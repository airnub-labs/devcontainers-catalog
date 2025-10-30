#!/usr/bin/env node
import { Command } from "commander";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { loadManifest, loadSchema } from "./lib/schema.js";
import { buildAndPushImage } from "./lib/build.js";
import {
  generatePresetBuildContext,
  generateWorkspaceScaffold,
  idFromManifest,
} from "./lib/generate.js";
import { resolveCatalog, CatalogContext } from "./lib/catalog.js";
import { discoverWorkspaceRoot } from "./lib/fsutil.js";
import { buildAggregateCompose, readAggregateMetadata } from "./lib/compose.js";
import { materializeServices, listServiceDirs } from "./lib/services.js";

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

const program = new Command();
program
  .name("devc")
  .description("Agnostic Dev Container generator (education-capable)")
  .option("--catalog-root <path>", "explicit catalog checkout to use for schemas/fragments")
  .option("--catalog-ref <ref>", "remote catalog ref when downloading", "main")
  .option("--workspace-root <path>", "workspace directory (defaults to nearest .devcontainer)");

program
  .command("validate")
  .argument("<manifest>", "path to lesson/env manifest (yaml|json)")
  .action(async function (this: Command, manifestPath: string) {
    await withCatalog(this, async (catalog) => {
      const validate = await loadSchema(catalog.root);
      const manifest = await loadManifest(manifestPath);
      const ok = validate(manifest);
      if (!ok) {
        console.error(chalk.red("Schema validation errors:"));
        console.error(validate.errors);
        process.exit(1);
      }
      console.log(chalk.green("Manifest is valid."));
    });
  });

program
  .command("generate")
  .argument("<manifest>", "path to manifest")
  .option("--out-images <dir>", "dir for generated presets", "images/presets/generated")
  .option("--out-templates <dir>", "dir for generated scaffolds", "templates/generated")
  .option("--fetch-missing-fragments", "fetch service fragments from catalog if missing")
  .option("--fetch-ref <ref>", "branch/tag/SHA for fragment fetch")
  .option("--force", "overwrite existing generated directories", false)
  .action(async function (this: Command, manifestPath, opts) {
    await withCatalog(this, async (catalog, globals) => {
      const validate = await loadSchema(catalog.root);
      const manifest = await loadManifest(manifestPath);
      if (!validate(manifest)) {
        console.error(chalk.red("Schema validation errors:"));
        console.error(validate.errors);
        process.exit(1);
      }

      const id = idFromManifest(manifest);
      const cwd = process.cwd();
      const imagesBase = path.isAbsolute(opts.outImages)
        ? opts.outImages
        : path.resolve(cwd, opts.outImages);
      const templatesBase = path.isAbsolute(opts.outTemplates)
        ? opts.outTemplates
        : path.resolve(cwd, opts.outTemplates);

      const presetOutDir = path.join(imagesBase, id);
      const scaffoldOutDir = path.join(templatesBase, id);
      const fetchMissing = opts.fetchMissingFragments ?? catalog.mode === "remote";
      const fetchRef = defaultFetchRef(opts.fetchRef, globals, catalog);

      const presetResult = await generatePresetBuildContext({
        repoRoot: catalog.root,
        manifest,
        outDir: presetOutDir,
        force: !!opts.force,
        fetchMissingFragments: fetchMissing,
        fetchRef,
        catalogRef: catalog.ref,
      });

      const scaffoldResult = await generateWorkspaceScaffold({
        repoRoot: catalog.root,
        manifest,
        outDir: scaffoldOutDir,
        force: !!opts.force,
        fetchMissingFragments: fetchMissing,
        fetchRef,
        catalogRef: catalog.ref,
      });

      console.log(chalk.green("Generated:"));
      console.log(`  preset build ctx: ${presetResult.outDir}`);
      console.log(`  scaffold: ${scaffoldResult.outDir}`);
    });
  });

program
  .command("build")
  .requiredOption("--ctx <dir>", "generated preset context dir")
  .requiredOption("--tag <imageTag>", "ghcr tag, e.g., ghcr.io/airnub-labs/templates/lessons/foo:ubuntu-24.04")
  .action(async (opts) => {
    await buildAndPushImage(opts.ctx, opts.tag);
  });

program
  .command("scaffold")
  .argument("<manifest>", "path to manifest")
  .requiredOption("--out <dir>", "target repo dir to place scaffold")
  .option("--fetch-missing-fragments", "fetch service fragments if missing")
  .option("--fetch-ref <ref>", "branch/tag/SHA for fragment fetch")
  .option("--force", "overwrite target directory", false)
  .action(async function (this: Command, manifestPath, opts) {
    await withCatalog(this, async (catalog, globals) => {
      const validate = await loadSchema(catalog.root);
      const manifest = await loadManifest(manifestPath);
      if (!validate(manifest)) {
        console.error(chalk.red("Schema validation errors:"));
        console.error(validate.errors);
        process.exit(1);
      }

      const resolvedOut = path.isAbsolute(opts.out) ? opts.out : path.resolve(process.cwd(), opts.out);
      const tmpRoot = path.join(process.cwd(), ".tmp-devc-scaffold");
      await fs.remove(tmpRoot).catch(() => {});
      const tmpOut = path.join(tmpRoot, "scaffold");
      const fetchMissing = opts.fetchMissingFragments ?? catalog.mode === "remote";
      const fetchRef = defaultFetchRef(opts.fetchRef, globals, catalog);

      try {
        const result = await generateWorkspaceScaffold({
          repoRoot: catalog.root,
          manifest,
          outDir: tmpOut,
          force: true,
          fetchMissingFragments: fetchMissing,
          fetchRef,
          catalogRef: catalog.ref,
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
  .argument("<manifest>", "path to manifest")
  .option("--fetch-missing-fragments", "attempt to fetch missing service fragments")
  .action(async function (this: Command, manifestPath, opts) {
    await withCatalog(this, async (catalog) => {
      const validate = await loadSchema(catalog.root);
      const manifest = await loadManifest(manifestPath);
      if (!validate(manifest)) {
        console.error(chalk.red("Schema validation errors:"));
        console.error(validate.errors);
        process.exit(1);
      }

      const services = manifestServiceNames(manifest);
      if (!services.length) {
        console.log(chalk.yellow("No services requested — nothing to doctor."));
        return;
      }

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
      }
    });
  });

const addCmd = program.command("add").description("Augment an existing workspace");

addCmd
  .command("service")
  .argument("<name...>", "service fragment(s) to add")
  .option("--fetch-missing-fragments", "download missing fragments from catalog", true)
  .option("--fetch-ref <ref>", "catalog ref to use when fetching")
  .action(async function (this: Command, names: string[], opts) {
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
    const devcontainer = await fs.readJson(devcontainerPath).catch(() => ({ name: path.basename(workspaceRoot) }));
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
  .action(async function (this: Command, opts) {
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
