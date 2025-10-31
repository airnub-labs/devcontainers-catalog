#!/usr/bin/env node
import { Command } from "commander";
import path from "path";
import fs from "fs-extra";
import type { Stats } from "fs";
import chalk from "chalk";
import { globby } from "globby";
import { loadManifest, loadSchema } from "./lib/schema.js";
import { buildImage } from "./lib/build.js";
import {
  generatePresetBuildContext,
  generateWorkspaceScaffold,
  idFromManifest,
} from "./lib/generate.js";
import { resolveCatalog, CatalogContext } from "./lib/catalog.js";
import { discoverWorkspaceRoot, safeWriteDir } from "./lib/fsutil.js";
import { buildAggregateCompose, readAggregateMetadata } from "./lib/compose.js";
import { materializeServices, listServiceDirs } from "./lib/services.js";
import { generateStackTemplate, parseBrowserSelection, listBrowserOptions, generateStack } from "./lib/stacks.js";
import { enforceTagPolicy, ManifestKind } from "./lib/tag-policy.js";
import { LessonEnv } from "./types.js";
import { execa } from "execa";

interface GlobalOptions {
  catalogRoot?: string;
  catalogRef?: string;
  workspaceRoot?: string;
}

function getGlobals(cmd: Command): GlobalOptions {
  return (cmd.optsWithGlobals ? cmd.optsWithGlobals() : cmd.opts()) as GlobalOptions;
}

async function withCatalog<T>(cmd: Command, fn: (ctx: CatalogContext, globals: GlobalOptions) => Promise<T>): Promise<T> {
  const globals = getGlobals(cmd);
  const ctx = await resolveCatalog({ catalogRoot: globals.catalogRoot, catalogRef: globals.catalogRef });
  try {
    return await fn(ctx, globals);
  } finally {
    // cached catalog directories do not need cleanup
  }
}

function resolveWorkspace(globals: GlobalOptions): string {
  const explicit = globals.workspaceRoot ? path.resolve(globals.workspaceRoot) : null;
  const detected = explicit ?? discoverWorkspaceRoot();
  if (!detected) {
    throw new Error("Workspace not found. Provide --workspace-root or run inside a generated workspace.");
  }
  const devcontainerPath = path.join(detected, ".devcontainer", "devcontainer.json");
  if (!fs.existsSync(devcontainerPath)) {
    throw new Error(`Expected ${devcontainerPath} to exist. Run devc generate or scaffold first.`);
  }
  return detected;
}

function manifestServiceNames(manifest: any): string[] {
  return Array.isArray(manifest?.spec?.services) ? manifest.spec.services.map((svc: any) => svc.name) : [];
}

function defaultFetchRef(optionRef: string | undefined, globals: GlobalOptions, catalog: CatalogContext): string {
  return optionRef || globals.catalogRef || (catalog.mode === "remote" ? catalog.ref : "main");
}

function canonicalLessonTag(manifest: LessonEnv, version: string) {
  const slug = idFromManifest(manifest);
  const base = (manifest.spec.image_tag_strategy || "ubuntu-24.04").replace(/[^a-z0-9.-]+/gi, "-");
  return `ghcr.io/airnub-labs/templates/lessons/${slug}:${base}-${slug}-${version}`;
}

function assertTagPolicy(tag: string, manifest: LessonEnv | undefined, version: string, force = false) {
  const match = tag.match(/^ghcr\.io\/airnub-labs\/templates\/lessons\/[a-z0-9-]+:[a-z0-9.-]+-[a-z0-9-]+-v[0-9a-z.-]+$/i);
  if (!match) {
    throw new Error(
      "Tag must follow ghcr.io/airnub-labs/templates/lessons/<slug>:<base>-<slug>-v<iteration>",
    );
  }
  const resolvedTag = tag.slice(tag.lastIndexOf(":") + 1);
  const kind = ManifestKind.parse(manifest?.kind ?? "PresetEnv");
  enforceTagPolicy(kind, resolvedTag, force);
  if (manifest) {
    const expected = canonicalLessonTag(manifest, version);
    if (expected !== tag) {
      throw new Error(`Tag '${tag}' does not match canonical '${expected}'. Override --version or manifest metadata.`);
    }
  }
}

const program = new Command();
program
  .name("devc")
  .description("Agnostic Dev Container generator (education-capable)")
  .option("--catalog-root <path>", "explicit catalog checkout to use for schemas/fragments")
  .option("--catalog-ref <ref>", "remote catalog ref when downloading", "main")
  .option("--workspace-root <path>", "workspace directory (defaults to nearest .devcontainer)");

program
  .command("validate")
  .argument("<manifest>", "path to lesson/env manifest (yaml|json) or directory of manifests")
  .option("--recursive", "scan directories recursively", false)
  .action(async function (this: Command, manifestPath: string, opts: Record<string, any>) {
    await withCatalog(this, async (catalog) => {
      const validate = await loadSchema(catalog.root);
      const targetPath = path.resolve(manifestPath);
      let stats: Stats | null;
      try {
        stats = await fs.stat(targetPath);
      } catch {
        stats = null;
      }
      const manifestFiles: string[] = [];

      if (stats?.isDirectory()) {
        const patterns = opts.recursive
          ? ["**/*.yaml", "**/*.yml", "**/*.json"]
          : ["*.yaml", "*.yml", "*.json"];
        const matches = await globby(patterns, { cwd: targetPath, absolute: true });
        manifestFiles.push(...matches);
      } else {
        manifestFiles.push(targetPath);
      }

      if (!manifestFiles.length) {
        console.warn(chalk.yellow(`No manifest files found at ${targetPath}.`));
        return;
      }

      let allValid = true;
      for (const file of manifestFiles) {
        const manifest = await loadManifest(file);
        const ok = validate(manifest);
        if (!ok) {
          allValid = false;
          console.error(chalk.red(`Schema validation errors in ${file}:`));
          console.error(validate.errors);
        } else {
          console.log(chalk.green(`Manifest is valid: ${file}`));
        }
      }

      if (!allValid) {
        process.exit(1);
      }
    });
  });

const generateCmd = program.command("generate").description("Generate catalog artifacts");

generateCmd
  .argument("<manifest>", "path to manifest")
  .option("--out-images <dir>", "dir for generated presets", "images/presets/generated")
  .option("--out-templates <dir>", "dir for generated scaffolds", "templates/generated")
  .option("--out <targets>", "comma-separated outputs (images,preset,templates,scaffold)")
  .option("--fetch-missing-fragments", "fetch service fragments from catalog if missing")
  .option("--fetch-ref <ref>", "branch/tag/SHA for fragment fetch")
  .option("--force", "overwrite existing generated directories", false)
  .option("--git-sha <sha>", "git revision stamped into labels", process.env.GITHUB_SHA || process.env.GIT_SHA)
  .action(async function (this: Command, manifestPath: string, opts: Record<string, any>) {
    await withCatalog(this, async (catalog, globals) => {
      const validate = await loadSchema(catalog.root);
      const manifestData = await loadManifest(manifestPath);
      if (!validate(manifestData)) {
        console.error(chalk.red("Schema validation errors:"));
        console.error(validate.errors);
        process.exit(1);
      }

      const manifest: LessonEnv = manifestData as LessonEnv;

      const id = idFromManifest(manifest);
      const cwd = process.cwd();
      const imagesBase = path.isAbsolute(opts.outImages)
        ? opts.outImages
        : path.resolve(cwd, opts.outImages);
      const templatesBase = path.isAbsolute(opts.outTemplates)
        ? opts.outTemplates
        : path.resolve(cwd, opts.outTemplates);

      const outputs = typeof opts.out === "string"
        ? opts.out.split(",").map((entry: string) => entry.trim().toLowerCase()).filter(Boolean)
        : [];
      const wantsPreset = outputs.length === 0
        || outputs.some((entry: string) => ["images", "image", "preset", "presets"].includes(entry));
      const wantsScaffold = outputs.length === 0
        || outputs.some((entry: string) => ["templates", "template", "scaffold", "scaffolds"].includes(entry));

      const presetOutDir = path.join(imagesBase, id);
      const scaffoldOutDir = path.join(templatesBase, id);
      const fetchMissing = opts.fetchMissingFragments ?? catalog.mode === "remote";
      const fetchRef = defaultFetchRef(opts.fetchRef, globals, catalog);
      const gitSha = opts.gitSha || process.env.GIT_SHA || process.env.GITHUB_SHA || catalog.ref;

      const generated: string[] = [];

      if (wantsPreset) {
        const presetResult = await generatePresetBuildContext({
          repoRoot: catalog.root,
          manifest,
          outDir: presetOutDir,
          force: !!opts.force,
          fetchMissingFragments: fetchMissing,
          fetchRef,
          catalogRef: catalog.ref,
          gitSha,
        });
        generated.push(`preset build ctx: ${presetResult.outDir}`);
      }

      if (wantsScaffold) {
        const scaffoldResult = await generateWorkspaceScaffold({
          repoRoot: catalog.root,
          manifest,
          outDir: scaffoldOutDir,
          force: !!opts.force,
          fetchMissingFragments: fetchMissing,
          fetchRef,
          catalogRef: catalog.ref,
          gitSha,
        });
        generated.push(`scaffold: ${scaffoldResult.outDir}`);
      }

      if (generated.length) {
        console.log(chalk.green("Generated:"));
        for (const item of generated) {
          console.log(`  ${item}`);
        }
      } else {
        console.log(chalk.yellow("No outputs requested via --out."));
      }
    });
  });

generateCmd
  .command("stack")
  .description("Materialize a stack template with optional browser sidecars")
  .requiredOption("--template <id>", "stack template id")
  .option("--out <dir>", "target directory", "./stack")
  .option("--force", "overwrite target directory", false)
  .option("--with-browsers <csv>", "comma-separated browser sidecars")
  .option(
    "--with-browser <id>",
    "repeatable browser sidecar",
    (value: string, previous: string[] | undefined) => {
      return [...(previous ?? []), value];
    },
    [],
  )
  .option("--list-browsers", "list available browser sidecars", false)
  .action(async function (this: Command, opts: Record<string, any>) {
    await withCatalog(this, async (catalog) => {
      if (opts.listBrowsers) {
        console.log(chalk.blue("Available browsers:"));
        for (const browser of listBrowserOptions()) {
          console.log(`  ${browser.id} — ${browser.label}`);
        }
        return;
      }

      const browsers = parseBrowserSelection({
        withBrowsersCsv: opts.withBrowsers,
        withBrowser: Array.isArray(opts.withBrowser) ? opts.withBrowser : opts.withBrowser ? [opts.withBrowser] : [],
      });

      const outDir = path.isAbsolute(opts.out) ? opts.out : path.resolve(process.cwd(), opts.out);

      await safeWriteDir(outDir, !!opts.force);

      const { plan, files } = await generateStack({
        template: opts.template,
        browsers: browsers.map((browser) => browser.id),
      });

      if (!files) {
        console.log(chalk.yellow("Dry run requested; no files written."));
        return;
      }

      for (const [relativePath, buffer] of files) {
        const segments = relativePath.split("/");
        const targetPath = path.join(outDir, ...segments);
        await fs.ensureDir(path.dirname(targetPath));
        const fileBuffer = Buffer.from(buffer as unknown as Uint8Array);
        await fs.writeFile(targetPath, fileBuffer as unknown as NodeJS.ArrayBufferView);
        const mode = (buffer as Buffer & { _mode?: number })._mode;
        if (typeof mode === "number") {
          await fs.promises.chmod(targetPath, mode);
        }
      }

      if (plan.notes.length) {
        for (const note of plan.notes) {
          console.warn(chalk.yellow(note));
        }
      }

      const summary = browsers.length
        ? browsers.map((browser) => browser.id).join(", ")
        : "no browser sidecars";
      console.log(chalk.green(`Stack generated at ${outDir} (${summary}).`));
    });
  });

program
  .command("build")
  .requiredOption("--ctx <dir>", "generated preset context dir")
  .requiredOption(
    "--tag <imageTag>",
    "ghcr tag, ghcr.io/airnub-labs/templates/lessons/<slug>:<base>-<slug>-v<iteration>",
  )
  .option("--manifest <path>", "lesson manifest to validate tag policy")
  .option("--version <v>", "lesson iteration (v-prefixed)", "v1")
  .option("--push", "push the resulting image", false)
  .option("--oci-output <dir>", "directory to store OCI archive when not pushing")
  .option("--platforms <list>", "override build platforms", "linux/amd64,linux/arm64")
  .option("--git-sha <sha>", "git revision used for provenance", process.env.GITHUB_SHA || process.env.GIT_SHA)
  .option("--force", "override tag policy for shared preset tags", false)
  .action(async function (this: Command, opts: Record<string, any>) {
    await withCatalog(this, async (catalog) => {
      const version = opts.version || "v1";
      if (!/^v[0-9][0-9a-z.-]*$/i.test(version)) {
        throw new Error("--version must look like v1 or v1.2");
      }

      let manifest: LessonEnv | undefined;
      if (opts.manifest) {
        const validate = await loadSchema(catalog.root);
        const manifestData = await loadManifest(opts.manifest);
        if (!validate(manifestData)) {
          console.error(chalk.red("Schema validation errors:"));
          console.error(validate.errors);
          process.exit(1);
        }
        manifest = manifestData as LessonEnv;
      }

      assertTagPolicy(opts.tag, manifest, version, !!opts.force);

      if (opts.gitSha && !/^[0-9a-f]{7,40}$/i.test(opts.gitSha)) {
        console.warn(chalk.yellow(`git sha '${opts.gitSha}' does not look like a commit hash.`));
      }
      if (!opts.gitSha) {
        console.warn(chalk.yellow("No --git-sha provided; downstream workflows should pass GIT_SHA for labeling."));
      }

      const ctxDir = path.isAbsolute(opts.ctx) ? opts.ctx : path.resolve(process.cwd(), opts.ctx);
      const outputDir = opts.ociOutput ? path.resolve(process.cwd(), opts.ociOutput) : undefined;

      await buildImage({
        ctxDir,
        tag: opts.tag,
        push: !!opts.push,
        outputDir,
        platforms: opts.platforms,
      });

      if (!opts.push && outputDir) {
        console.log(chalk.green(`OCI archive written to ${outputDir}`));
      }
      console.log(chalk.green(`Build complete for ${opts.tag}`));
    });
  });

program
  .command("scaffold")
  .argument("<manifest>", "path to manifest")
  .requiredOption("--out <dir>", "target repo dir to place scaffold")
  .option("--fetch-missing-fragments", "fetch service fragments if missing")
  .option("--fetch-ref <ref>", "branch/tag/SHA for fragment fetch")
  .option("--force", "overwrite target directory", false)
  .option("--git-sha <sha>", "git revision stamped into labels", process.env.GITHUB_SHA || process.env.GIT_SHA)
  .action(async function (this: Command, manifestPath: string, opts: Record<string, any>) {
    await withCatalog(this, async (catalog, globals) => {
      const validate = await loadSchema(catalog.root);
      const manifestData = await loadManifest(manifestPath);
      if (!validate(manifestData)) {
        console.error(chalk.red("Schema validation errors:"));
        console.error(validate.errors);
        process.exit(1);
      }

      const manifest: LessonEnv = manifestData as LessonEnv;

      const resolvedOut = path.isAbsolute(opts.out) ? opts.out : path.resolve(process.cwd(), opts.out);
      const tmpRoot = path.join(process.cwd(), ".tmp-devc-scaffold");
      await fs.remove(tmpRoot).catch(() => {});
      const tmpOut = path.join(tmpRoot, "scaffold");
      const fetchMissing = opts.fetchMissingFragments ?? catalog.mode === "remote";
      const fetchRef = defaultFetchRef(opts.fetchRef, globals, catalog);
      const gitSha = opts.gitSha || process.env.GIT_SHA || process.env.GITHUB_SHA || catalog.ref;

      try {
        const result = await generateWorkspaceScaffold({
          repoRoot: catalog.root,
          manifest,
          outDir: tmpOut,
          force: true,
          fetchMissingFragments: fetchMissing,
          fetchRef,
          catalogRef: catalog.ref,
          gitSha,
        });

        await fs.copy(result.outDir, resolvedOut, {
          overwrite: !!opts.force,
          errorOnExist: !opts.force,
        });
      } finally {
        await fs.remove(tmpRoot).catch(() => {});
      }

      console.log(chalk.green(`Scaffold written to ${resolvedOut}`));
    });
  });

program
  .command("doctor")
  .argument(
    "[manifest]",
    "path to manifest",
    "examples/lesson-manifests/intro-ai-week02.yaml",
  )
  .option("--fetch-missing-fragments", "attempt to fetch missing service fragments")
  .option("--tag <tag>", "lesson image tag to validate")
  .option("--version <v>", "expected lesson iteration", "v1")
  .action(async function (this: Command, manifestPath: string, opts: Record<string, any>) {
    await withCatalog(this, async (catalog) => {
      const validate = await loadSchema(catalog.root);
      const manifestData = await loadManifest(manifestPath);
      if (!validate(manifestData)) {
        console.error(chalk.red("Schema validation errors:"));
        console.error(validate.errors);
        process.exit(1);
      }

      const manifest: LessonEnv = manifestData as LessonEnv;

      const version = opts.version || "v1";
      if (!/^v[0-9][0-9a-z.-]*$/i.test(version)) {
        throw new Error("--version must look like v1 or v2.1");
      }

      if (opts.tag) {
        try {
          assertTagPolicy(opts.tag, manifest, version, false);
          console.log(chalk.green(`Tag '${opts.tag}' matches manifest metadata.`));
        } catch (error) {
          if (error instanceof Error) {
            console.error(chalk.red(error.message));
          }
          process.exit(1);
        }
      }

      const canonicalTag = canonicalLessonTag(manifest, version);
      console.log(chalk.blue(`Canonical tag: ${canonicalTag}`));

      const presetPath = path.join(catalog.root, "images", "presets", manifest.spec.base_preset);
      if (!await fs.pathExists(presetPath)) {
        console.warn(
          chalk.yellow(
            `Preset '${manifest.spec.base_preset}' not found under images/presets. Run devc generate with --fetch-missing-fragments.`,
          ),
        );
      } else {
        console.log(chalk.green(`Preset '${manifest.spec.base_preset}' located.`));
      }

      const services = manifestServiceNames(manifest);
      if (!services.length) {
        console.log(chalk.yellow("No services requested — nothing to doctor."));
      } else {
        const searchRoots = [path.join(process.cwd(), "services"), path.join(catalog.root, "services")];
        const missing: string[] = [];
        for (const svc of services) {
          let present = false;
          for (const root of searchRoots) {
            const dir = path.join(root, svc);
            if (await fs.pathExists(dir)) {
              present = true;
              break;
            }
          }
          if (!present) {
            missing.push(svc);
          }
        }

        if (missing.length) {
          console.warn(chalk.yellow("Missing service fragments:"), missing.join(", "));
          if (!opts.fetchMissingFragments) {
            console.warn("Run with --fetch-missing-fragments or add them under services/.");
          } else {
            console.warn("Fragments will be fetched from the catalog during generation.");
          }
        } else {
          console.log(chalk.green("All requested service fragments appear present."));
          for (const svc of services) {
            const pathsToCheck = searchRoots.map((root) => path.join(root, svc, ".env.example"));
            if (!pathsToCheck.some((candidate) => fs.existsSync(candidate))) {
              console.warn(chalk.yellow(`Consider adding .env.example for service '${svc}' to document credentials.`));
            }
          }
        }
      }

      try {
        await execa("docker", ["buildx", "version"], { stdio: "pipe" });
        console.log(chalk.green("docker buildx is available."));
      } catch {
        console.warn(
          chalk.yellow("docker buildx not available; multi-arch builds will fail. Install Docker Buildx extensions."),
        );
      }
    });
  });

const addCmd = program.command("add").description("Augment an existing workspace");

addCmd
  .command("service")
  .argument("<name...>", "service fragment(s) to add")
  .option("--fetch-missing-fragments", "download missing fragments from catalog", true)
  .option("--fetch-ref <ref>", "catalog ref to use when fetching")
  .action(async function (this: Command, names: string[], opts: Record<string, any>) {
    await withCatalog(this, async (catalog, globals) => {
      const workspaceRoot = resolveWorkspace(globals);
      const devDir = path.join(workspaceRoot, ".devcontainer");
      const servicesDir = path.join(devDir, "services");
      const fetchMissing = opts.fetchMissingFragments ?? true;
      const fetchRef = defaultFetchRef(opts.fetchRef, globals, catalog);

      await materializeServices({
        services: names,
        destination: servicesDir,
        repoRoot: catalog.root,
        fetchIfMissing: fetchMissing,
        searchRoots: [path.join(workspaceRoot, "services")],
        fetchRef,
        catalogRef: catalog.ref,
      });

      const aggregatePath = path.join(devDir, "aggregate.compose.yml");
      const existingMeta = await readAggregateMetadata(aggregatePath);
      const existing = existingMeta?.services ?? await listServiceDirs(servicesDir);
      const merged = Array.from(new Set([...existing, ...names]));

      await buildAggregateCompose({
        repoRoot: catalog.root,
        services: merged,
        outFile: aggregatePath,
        fetchIfMissing: fetchMissing,
        fetchRef,
        catalogRef: catalog.ref,
        searchRoots: [servicesDir, path.join(workspaceRoot, "services"), path.join(catalog.root, "services")],
      });

      console.log(chalk.green(`aggregate.compose.yml updated with: ${merged.join(", ")}`));
    });
  });

addCmd
  .command("extension")
  .argument("<extension...>", "VS Code extension IDs to add")
  .action(async function (this: Command, extensions: string[]) {
    const globals = getGlobals(this);
    const workspaceRoot = resolveWorkspace(globals);
    const devcontainerPath = path.join(workspaceRoot, ".devcontainer", "devcontainer.json");
    const devcontainer: any = await fs
      .readJson(devcontainerPath)
      .catch(() => ({ name: path.basename(workspaceRoot) }));
    devcontainer.customizations = devcontainer.customizations ?? {};
    devcontainer.customizations.vscode = devcontainer.customizations.vscode ?? {};
    const existing = new Set<string>(devcontainer.customizations.vscode.extensions ?? []);
    for (const ext of extensions) {
      existing.add(ext);
    }
    devcontainer.customizations.vscode.extensions = Array.from(existing);
    await fs.writeJson(devcontainerPath, devcontainer, { spaces: 2 });
    console.log(chalk.green(`Extensions added: ${extensions.join(", ")}`));
  });

program
  .command("sync")
  .description("Rebuild aggregate.compose.yml for the current workspace")
  .option("--manifest <path>", "manifest to derive services from")
  .option("--fetch-missing-fragments", "download missing fragments from catalog")
  .option("--fetch-ref <ref>", "catalog ref to use when fetching")
  .action(async function (this: Command, opts: Record<string, any>) {
    await withCatalog(this, async (catalog, globals) => {
      const workspaceRoot = resolveWorkspace(globals);
      const devDir = path.join(workspaceRoot, ".devcontainer");
      const aggregatePath = path.join(devDir, "aggregate.compose.yml");
      const servicesDir = path.join(devDir, "services");
      const fetchMissing = opts.fetchMissingFragments ?? true;
      const fetchRef = defaultFetchRef(opts.fetchRef, globals, catalog);

      let services: string[] = [];
      if (opts.manifest) {
        const manifest = await loadManifest(opts.manifest);
        services = manifestServiceNames(manifest);
        if (!services.length) {
          console.log(chalk.yellow("Manifest lists no services; aggregate compose will be removed."));
          await fs.remove(aggregatePath).catch(() => {});
          return;
        }
      } else {
        const meta = await readAggregateMetadata(aggregatePath);
        services = meta?.services ?? await listServiceDirs(servicesDir);
      }

      if (!services.length) {
        console.log(chalk.yellow("No services to sync."));
        return;
      }

      await materializeServices({
        services,
        destination: servicesDir,
        repoRoot: catalog.root,
        fetchIfMissing: fetchMissing,
        searchRoots: [path.join(workspaceRoot, "services")],
        fetchRef,
        catalogRef: catalog.ref,
      });

      await buildAggregateCompose({
        repoRoot: catalog.root,
        services,
        outFile: aggregatePath,
        fetchIfMissing: fetchMissing,
        fetchRef,
        catalogRef: catalog.ref,
        searchRoots: [servicesDir, path.join(workspaceRoot, "services"), path.join(catalog.root, "services")],
      });

      console.log(chalk.green(`aggregate.compose.yml refreshed for services: ${services.join(", ")}`));
    });
  });

program.parse();
