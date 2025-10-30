import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chalk from 'chalk';
import fsExtra from 'fs-extra';
import type { ArgumentsCamelCase, CommandModule } from 'yargs';
import { Catalog } from '../lib/catalog.js';
import { ensureDir, writeManagedFile } from '../lib/fsx.js';
import { renderTemplate } from '../lib/render.js';
import { createAggregateCompose } from '../lib/compose.js';
import { materializeServices, ServiceSelection } from '../lib/services.js';

const packageUrl = new URL('../../package.json', import.meta.url);
const templateDir = fileURLToPath(new URL('../../templates', import.meta.url));

interface GenerateWorkspaceArgs {
  manifest: string;
  output: string;
  catalogRef: string;
  preview?: string;
}

interface WorkspaceManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
  };
  spec: {
    mode: 'preset' | 'features';
    preset?: string;
    features?: Record<string, unknown>;
    image_tag_strategy: string;
    services?: string[];
    vscode?: {
      extensions?: string[];
      settings?: Record<string, unknown>;
    };
    env?: Record<string, string>;
    secrets_placeholders?: string[];
  };
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function presetImage(spec: WorkspaceManifest['spec']): string {
  const preset = spec.preset ?? 'full-classroom';
  return `ghcr.io/airnub-labs/templates/${preset}:${spec.image_tag_strategy}`;
}

function baseImage(spec: WorkspaceManifest['spec']): string {
  return `ghcr.io/devcontainers/base:${spec.image_tag_strategy}`;
}

async function loadPackageVersion(): Promise<string> {
  const pkgRaw = await readFile(packageUrl, 'utf8');
  const pkg = JSON.parse(pkgRaw) as { version: string };
  return pkg.version;
}

async function validateManifest(catalog: Catalog, manifest: WorkspaceManifest): Promise<void> {
  const schemaRaw = await catalog.readFile('schemas/workspace.schema.json');
  const schema = JSON.parse(schemaRaw);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(manifest);
  if (!valid) {
    const errors = (validate.errors ?? [])
      .map((error) => `${error.instancePath || '(root)'} ${error.message}`)
      .join('\n');
    throw new Error(`Manifest failed validation:\n${errors}`);
  }
}

export interface MaterializeOptions {
  catalogRef: string;
  previewDir?: string;
}

export async function materializeWorkspace(
  manifestPath: string,
  outputDir: string,
  options: MaterializeOptions
): Promise<void> {
  const resolvedManifestPath = path.resolve(manifestPath);
  const resolvedOutputDir = path.resolve(outputDir);
  const catalogRef = options.catalogRef ?? 'HEAD';
  const previewDir = options.previewDir ? path.resolve(options.previewDir) : undefined;

  const manifestRaw = await readFile(resolvedManifestPath, 'utf8');
  const manifest = YAML.parse(manifestRaw) as WorkspaceManifest;

  const catalog = await Catalog.create({ ref: catalogRef });
  await validateManifest(catalog, manifest);
  const version = await loadPackageVersion();

  const devcontainerDir = path.join(resolvedOutputDir, '.devcontainer');
  await ensureDir(devcontainerDir);
  await fsExtra.outputFile(path.join(resolvedOutputDir, 'workspace.yaml'), manifestRaw);

  const slug = toSlug(manifest.metadata.name);
  const spec = manifest.spec;

  const image = spec.mode === 'preset' ? presetImage(spec) : baseImage(spec);
  const remoteEnv = spec.env ?? {};
  const vscodeExtensions = spec.vscode?.extensions ?? [];
  const vscodeSettings = spec.vscode?.settings ?? {};
  const features = spec.mode === 'features' ? spec.features ?? {} : undefined;

  const vscodeConfig: Record<string, unknown> = {
    extensions: vscodeExtensions
  };
  if (Object.keys(vscodeSettings).length > 0) {
    vscodeConfig.settings = vscodeSettings;
  }

  const devcontainerConfig: Record<string, unknown> = {
    name: manifest.metadata.name,
    image,
    dockerComposeFile: ['./compose.yaml'],
    service: 'devcontainer',
    workspaceFolder: '/workspace',
    customizations: {
      vscode: vscodeConfig
    },
    portsAttributes: {}
  };

  if (features && Object.keys(features).length > 0) {
    devcontainerConfig.features = features;
  }

  if (Object.keys(remoteEnv).length > 0) {
    devcontainerConfig.remoteEnv = remoteEnv;
  }

  const devcontainerJson = await renderTemplate(
    'workspace/devcontainer.json.ejs',
    { config: devcontainerConfig },
    { templateDir }
  );
  await writeManagedFile(
    path.join(devcontainerDir, 'devcontainer.json'),
    devcontainerJson,
    {
      commentStyle: 'slash',
      version,
      catalogRef,
      previewDir
    }
  );

  const composeYaml = await renderTemplate(
    spec.mode === 'preset' ? 'workspace/preset/compose.yaml.ejs' : 'workspace/features/compose.yaml.ejs',
    { image, slug, catalogRef, version },
    { templateDir }
  );
  await writeManagedFile(path.join(devcontainerDir, 'compose.yaml'), composeYaml, {
    commentStyle: 'hash',
    version,
    catalogRef,
    previewDir
  });

  const services = spec.services ?? [];
  const selections: ServiceSelection[] = services.map((id) => ({ id }));
  const { fragments, envSections } = await materializeServices(catalog, selections, devcontainerDir);

  const aggregate = createAggregateCompose({
    devcontainerFile: './compose.yaml',
    devcontainerService: 'devcontainer',
    fragments
  });

  await writeManagedFile(path.join(devcontainerDir, 'aggregate.compose.yml'), aggregate, {
    commentStyle: 'hash',
    version,
    catalogRef,
    previewDir
  });

  const envLines: string[] = [];
  envLines.push('# Copy this file to .env and provide required values.');
  for (const [key, value] of Object.entries(remoteEnv)) {
    envLines.push(`${key}=${value}`);
  }
  for (const placeholder of spec.secrets_placeholders ?? []) {
    envLines.push(`${placeholder}=<insert-value>`);
  }
  envLines.push(...envSections);
  const envExample = envLines.join('\n');

  await writeManagedFile(path.join(devcontainerDir, '.env.example'), envExample, {
    commentStyle: 'hash',
    version,
    catalogRef,
    previewDir
  });

  try {
    const workspaceReadme = await catalog.readFile('docs/snippets/workspace-readme.md');
    await writeManagedFile(path.join(resolvedOutputDir, 'README.md'), workspaceReadme, {
      commentStyle: 'html',
      version,
      catalogRef,
      previewDir
    });
  } catch (error) {
    console.warn(chalk.yellow('workspace README snippet not found; skipping.'));
  }

  console.log(chalk.green(`Workspace materialized at ${resolvedOutputDir}`));
}

async function generateWorkspace(argv: ArgumentsCamelCase<GenerateWorkspaceArgs>): Promise<void> {
  await materializeWorkspace(String(argv.manifest), String(argv.output), {
    catalogRef: argv.catalogRef ?? 'HEAD',
    previewDir: argv.preview
  });
}

export const generateWorkspaceCommand: CommandModule<unknown, GenerateWorkspaceArgs> = {
  command: 'generate workspace',
  describe: 'Materialize a workspace from a manifest',
  builder: {
    manifest: {
      alias: 'm',
      type: 'string',
      demandOption: true,
      describe: 'Path to workspace manifest (YAML)'
    },
    output: {
      alias: 'o',
      type: 'string',
      demandOption: true,
      describe: 'Target directory to materialize workspace'
    },
    catalogRef: {
      type: 'string',
      default: 'HEAD',
      describe: 'Catalog git ref to source templates from'
    },
    preview: {
      type: 'string',
      describe: 'Directory to emit patch previews for updates'
    }
  },
  handler: (argv) => generateWorkspace(argv)
};
