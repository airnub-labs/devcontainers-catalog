#!/usr/bin/env node
import { Command } from "commander";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { loadManifest, loadSchema } from "./lib/schema.js";
import { repoRootFromCwd } from "./lib/fsutil.js";
import { buildAndPushImage } from "./lib/build.js";
import {
  generatePresetBuildContext,
  generateWorkspaceScaffold,
  idFromManifest,
} from "./lib/generate.js";

const program = new Command();
program.name("devc").description("Agnostic Dev Container generator (education-capable)");

program
  .command("validate")
  .argument("<manifest>", "path to lesson/env manifest (yaml|json)")
  .action(async (manifestPath: string) => {
    const root = repoRootFromCwd();
    const validate = await loadSchema(root);
    const manifest = await loadManifest(manifestPath);
    const ok = validate(manifest);
    if (!ok) {
      console.error(chalk.red("Schema validation errors:"));
      console.error(validate.errors);
      process.exit(1);
    }
    console.log(chalk.green("Manifest is valid."));
  });

program
  .command("generate")
  .argument("<manifest>", "path to manifest")
  .option("--out-images <dir>", "dir for generated presets", "images/presets/generated")
  .option("--out-templates <dir>", "dir for generated scaffolds", "templates/generated")
  .option("--fetch-missing-fragments", "fetch service fragments from repo if missing", false)
  .option("--fetch-ref <ref>", "branch/tag/SHA for raw fragment fetch", "main")
  .option("--force", "overwrite existing generated directories", false)
  .action(async (manifestPath, opts) => {
    const root = repoRootFromCwd();
    const validate = await loadSchema(root);
    const manifest = await loadManifest(manifestPath);
    if (!validate(manifest)) {
      console.error(chalk.red("Schema validation errors:"));
      console.error(validate.errors);
      process.exit(1);
    }

    const id = idFromManifest(manifest);
    const imagesBase = path.isAbsolute(opts.outImages)
      ? opts.outImages
      : path.join(root, opts.outImages);
    const templatesBase = path.isAbsolute(opts.outTemplates)
      ? opts.outTemplates
      : path.join(root, opts.outTemplates);

    const presetOutDir = path.join(imagesBase, id);
    const scaffoldOutDir = path.join(templatesBase, id);

    const presetResult = await generatePresetBuildContext({
      repoRoot: root,
      manifest,
      outDir: presetOutDir,
      force: !!opts.force,
      fetchMissingFragments: !!opts.fetchMissingFragments,
      fetchRef: opts.fetchRef,
    });

    const scaffoldResult = await generateWorkspaceScaffold({
      repoRoot: root,
      manifest,
      outDir: scaffoldOutDir,
      force: !!opts.force,
      fetchMissingFragments: !!opts.fetchMissingFragments,
      fetchRef: opts.fetchRef,
    });

    console.log(chalk.green("Generated:"));
    console.log(`  preset build ctx: ${presetResult.outDir}`);
    console.log(`  scaffold: ${scaffoldResult.outDir}`);
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
  .option("--fetch-missing-fragments", "fetch service fragments if missing", false)
  .option("--fetch-ref <ref>", "branch/tag/SHA for raw fetch", "main")
  .option("--force", "overwrite target directory", false)
  .action(async (manifestPath, opts) => {
    const root = repoRootFromCwd();
    const validate = await loadSchema(root);
    const manifest = await loadManifest(manifestPath);
    if (!validate(manifest)) {
      console.error(chalk.red("Schema validation errors:"));
      console.error(validate.errors);
      process.exit(1);
    }

    const resolvedOut = path.isAbsolute(opts.out) ? opts.out : path.resolve(process.cwd(), opts.out);
    const tmpRoot = path.join(root, ".tmp-devc-scaffold");
    await fs.remove(tmpRoot).catch(() => {});
    const tmpOut = path.join(tmpRoot, "scaffold");

    try {
      const result = await generateWorkspaceScaffold({
        repoRoot: root,
        manifest,
        outDir: tmpOut,
        force: true,
        fetchMissingFragments: !!opts.fetchMissingFragments,
        fetchRef: opts.fetchRef,
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

program
  .command("doctor")
  .argument("<manifest>", "path to manifest")
  .option("--fetch-missing-fragments", "attempt to fetch missing service fragments", false)
  .option("--fetch-ref <ref>", "branch/tag/SHA for raw fetch", "main")
  .action(async (manifestPath, opts) => {
    const root = repoRootFromCwd();
    const validate = await loadSchema(root);
    const manifest = await loadManifest(manifestPath);
    if (!validate(manifest)) {
      console.error(chalk.red("Schema validation errors:"));
      console.error(validate.errors);
      process.exit(1);
    }

    const services = (manifest.spec.services ?? []).map((svc: any) => svc.name);
    if (!services.length) {
      console.log(chalk.yellow("No services requested — nothing to doctor."));
      return;
    }

    const missing: string[] = [];
    for (const svc of services) {
      const svcDir = path.join(root, "services", svc);
      if (!await fs.pathExists(svcDir)) {
        missing.push(svc);
      }
    }

    if (missing.length) {
      console.warn(chalk.yellow("Missing service fragments:"), missing.join(", "));
      if (!opts.fetchMissingFragments) {
        console.warn("Run with --fetch-missing-fragments or add them under services/.");
      } else {
        console.warn(`Will attempt to fetch fragments when generating (ref=${opts.fetchRef}).`);
      }
    } else {
      console.log(chalk.green("All requested service fragments appear present."));
    }
  });

program.parse();
