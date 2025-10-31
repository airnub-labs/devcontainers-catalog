import path from "path";
import fs from "fs-extra";
import { LessonEnv } from "../types.js";
import { buildAggregateCompose } from "./compose.js";
import { safeWriteDir, writeJson } from "./fsutil.js";
import { materializeServices } from "./services.js";

export interface GenerateBaseOptions {
  repoRoot: string;
  manifest: LessonEnv;
  fetchMissingFragments?: boolean;
  fetchRef?: string;
  catalogRef?: string;
  gitSha?: string;
}

export interface GeneratePresetOptions extends GenerateBaseOptions {
  outDir: string;
  force?: boolean;
}

export interface GenerateScaffoldOptions extends GenerateBaseOptions {
  outDir: string;
  force?: boolean;
}

export function idFromManifest(m: LessonEnv) {
  const org = m.metadata.org;
  const partB = m.metadata.course || m.metadata.name || "env";
  const partC = m.metadata.lesson ? `-${m.metadata.lesson}` : "";
  return `${org}-${partB}${partC}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function ensureArray<T>(value: T[] | undefined) {
  return value ? [...value] : [];
}

export async function generatePresetBuildContext(opts: GeneratePresetOptions) {
  const manifest = opts.manifest;
  const id = idFromManifest(manifest);
  const presetSource = path.join(opts.repoRoot, "images", "presets", manifest.spec.base_preset);
  if (!await fs.pathExists(presetSource)) {
    throw new Error(`Preset '${manifest.spec.base_preset}' not found under images/presets`);
  }

  await safeWriteDir(opts.outDir, opts.force);
  await fs.copy(presetSource, opts.outDir, { overwrite: true, errorOnExist: false });

  const servicesRequested = ensureArray(manifest.spec.services).map((svc) => svc.name);
  let servicesDir: string | null = null;
  if (servicesRequested.length) {
    const localServicesDir = path.join(opts.outDir, "services");
    servicesDir = localServicesDir;
    await materializeServices({
      services: servicesRequested,
      destination: localServicesDir,
      repoRoot: opts.repoRoot,
      fetchIfMissing: opts.fetchMissingFragments,
      fetchRef: opts.fetchRef,
      catalogRef: opts.catalogRef,
    });
  }

  const devcontainerPath = path.join(opts.outDir, "devcontainer.json");
  const devcontainer: any = await fs.readJson(devcontainerPath).catch(() => ({ name: id }));

  const existingExtensions = ensureArray(devcontainer.customizations?.vscode?.extensions);
  const extraExtensions = ensureArray(manifest.spec.vscode_extensions);
  const mergedExtensions = Array.from(new Set([...existingExtensions, ...extraExtensions]));

  const existingSettings = devcontainer.customizations?.vscode?.settings ?? {};
  const mergedSettings = {
    "remote.downloadExtensionsLocally": "always",
    ...existingSettings,
    ...(manifest.spec.settings ?? {}),
  } as Record<string, unknown>;

  const containerEnv = devcontainer.containerEnv ?? {};
  const manifestEnv = manifest.spec.env ?? {};

  const mergedDevcontainer: any = { ...devcontainer };
  mergedDevcontainer.name = id;
  mergedDevcontainer.containerEnv = { ...containerEnv, ...manifestEnv };

  mergedDevcontainer.customizations = mergedDevcontainer.customizations ?? {};
  mergedDevcontainer.customizations.vscode = mergedDevcontainer.customizations.vscode ?? {};
  mergedDevcontainer.customizations.vscode.settings = mergedSettings;
  mergedDevcontainer.customizations.vscode.extensions = mergedExtensions;

  mergedDevcontainer.build = mergedDevcontainer.build ?? {};
  const existingLabels = mergedDevcontainer.build.labels ?? {};
  mergedDevcontainer.build.labels = {
    ...existingLabels,
    "org.airnub.schema": manifest.apiVersion,
    "org.airnub.schemaVersion": manifest.apiVersion,
    "org.airnub.id": id,
    "org.airnub.org": manifest.metadata.org,
    ...(manifest.metadata.course ? { "org.airnub.course": manifest.metadata.course } : {}),
    ...(manifest.metadata.lesson ? { "org.airnub.lesson": manifest.metadata.lesson } : {}),
    ...(opts.gitSha ? { "org.airnub.gitSha": opts.gitSha } : {}),
    "org.opencontainers.image.source": "https://github.com/airnub-labs/devcontainers-catalog",
  };

  mergedDevcontainer.build.args = mergedDevcontainer.build.args ?? {};
  if (!mergedDevcontainer.build.args.GIT_SHA) {
    mergedDevcontainer.build.args.GIT_SHA = opts.gitSha ?? "local-dev";
  }

  await writeJson(devcontainerPath, mergedDevcontainer);

  if (manifest.spec.secrets_placeholders?.length) {
    const envExample = manifest.spec.secrets_placeholders.map((key) => `${key}=`).join("\n") + "\n";
    await fs.outputFile(path.join(opts.outDir, ".env.example"), envExample);
  }

  if (Object.keys(manifestEnv).length) {
    const defaults = Object.entries(manifestEnv).map(([key, value]) => `${key}=${value}`).join("\n") + "\n";
    await fs.outputFile(path.join(opts.outDir, ".env.defaults"), defaults);
  }

  const shouldEmitAggregate = manifest.spec.emit_aggregate_compose !== false;

  if (shouldEmitAggregate && servicesRequested.length) {
    const aggregatePath = path.join(opts.outDir, "aggregate.compose.yml");
    await buildAggregateCompose({
      repoRoot: opts.repoRoot,
      services: servicesRequested,
      outFile: aggregatePath,
      fetchIfMissing: opts.fetchMissingFragments,
      fetchRef: opts.fetchRef,
      catalogRef: opts.catalogRef,
      searchRoots: servicesDir ? [servicesDir, path.join(opts.repoRoot, "services")] : [path.join(opts.repoRoot, "services")],
    });
  }

  return { id, outDir: opts.outDir };
}

export async function generateWorkspaceScaffold(opts: GenerateScaffoldOptions) {
  const manifest = opts.manifest;
  const id = idFromManifest(manifest);
  const outDir = opts.outDir;

  await safeWriteDir(outDir, opts.force);
  const devDir = path.join(outDir, ".devcontainer");
  await fs.ensureDir(devDir);

  const imageTag = manifest.spec.image_tag_strategy || "ubuntu-24.04";
  const image = `ghcr.io/airnub-labs/templates/lessons/${id}:${imageTag}`;

  const scaffoldDevcontainer = {
    name: id,
    image,
    customizations: {
      vscode: {
        settings: {
          "remote.downloadExtensionsLocally": "always",
          ...(manifest.spec.settings ?? {}),
        },
        extensions: ensureArray(manifest.spec.vscode_extensions),
      },
    },
  };

  await writeJson(path.join(devDir, "devcontainer.json"), scaffoldDevcontainer);

  if (manifest.spec.secrets_placeholders?.length) {
    const envExample = manifest.spec.secrets_placeholders.map((key) => `${key}=`).join("\n") + "\n";
    await fs.outputFile(path.join(devDir, ".env.example"), envExample);
  }

  if (manifest.spec.env && Object.keys(manifest.spec.env).length) {
    const defaults = Object.entries(manifest.spec.env).map(([key, value]) => `${key}=${value}`).join("\n") + "\n";
    await fs.outputFile(path.join(devDir, ".env.defaults"), defaults);
  }

  const shouldEmitAggregate = manifest.spec.emit_aggregate_compose !== false;

  const servicesRequested = ensureArray(manifest.spec.services).map((svc) => svc.name);

  if (servicesRequested.length) {
    const servicesDir = path.join(devDir, "services");
    await materializeServices({
      services: servicesRequested,
      destination: servicesDir,
      repoRoot: opts.repoRoot,
      fetchIfMissing: opts.fetchMissingFragments,
      fetchRef: opts.fetchRef,
      catalogRef: opts.catalogRef,
    });

    if (shouldEmitAggregate) {
      const aggregatePath = path.join(devDir, "aggregate.compose.yml");
      await buildAggregateCompose({
        repoRoot: opts.repoRoot,
        services: servicesRequested,
        outFile: aggregatePath,
        fetchIfMissing: opts.fetchMissingFragments,
        fetchRef: opts.fetchRef,
        catalogRef: opts.catalogRef,
        searchRoots: [servicesDir, path.join(opts.repoRoot, "services")],
      });
    }
  }

  if (manifest.spec.starter_repo?.url) {
    const starterNote = [
      `This scaffold expects lesson content from: ${manifest.spec.starter_repo.url}`,
      manifest.spec.starter_repo.path ? `Place files under: ${manifest.spec.starter_repo.path}` : undefined,
      "\nMaterialize the starter repository during your CI or provisioning flow.",
    ]
      .filter(Boolean)
      .join("\n\n");
    await fs.outputFile(path.join(outDir, "README.content.md"), `${starterNote}\n`);
  }

  return { id, outDir };
}
