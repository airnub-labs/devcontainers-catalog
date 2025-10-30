import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chalk from 'chalk';
import fsExtra from 'fs-extra';
import type { CommandModule } from 'yargs';
import { Catalog } from '../lib/catalog.js';
import { ensureDir, writeManagedFile } from '../lib/fsx.js';
import { renderTemplate } from '../lib/render.js';
import { createAggregateCompose } from '../lib/compose.js';
import { materializeServices, ServiceSelection } from '../lib/services.js';

const packageUrl = new URL('../../package.json', import.meta.url);
const templateDir = fileURLToPath(new URL('../../templates', import.meta.url));

interface LessonManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    org: string;
    course: string;
    lesson: string;
  };
  spec: {
    base_preset: string;
    image_tag_strategy: string;
    vscode_extensions?: string[];
    settings?: Record<string, unknown>;
    features?: Record<string, unknown>;
    services?: Array<{
      name: string;
      vars?: Record<string, string>;
    }>;
    env?: Record<string, string>;
    secrets_placeholders?: string[];
    emit_aggregate_compose?: boolean;
    starter_repo?: {
      url: string;
      path?: string;
    };
  };
}

interface GenerateLessonArgs {
  manifest: string;
  output: string;
  catalogRef: string;
}

function lessonSlug(manifest: LessonManifest): string {
  return `${manifest.metadata.org}-${manifest.metadata.course}-${manifest.metadata.lesson}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function lessonImage(manifest: LessonManifest): string {
  const slug = lessonSlug(manifest);
  return `ghcr.io/airnub-labs/templates/lessons/${slug}:${manifest.spec.image_tag_strategy}`;
}

async function loadPackageVersion(): Promise<string> {
  const pkgRaw = await readFile(packageUrl, 'utf8');
  const pkg = JSON.parse(pkgRaw) as { version: string };
  return pkg.version;
}

async function validateLesson(catalog: Catalog, manifest: LessonManifest): Promise<void> {
  const schemaRaw = await catalog.readFile('schemas/lesson-env.schema.json');
  const schema = JSON.parse(schemaRaw);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(manifest);
  if (!valid) {
    const errors = (validate.errors ?? [])
      .map((error) => `${error.instancePath || '(root)'} ${error.message}`)
      .join('\n');
    throw new Error(`Lesson manifest failed validation:\n${errors}`);
  }
}

async function generateLesson(argv: GenerateLessonArgs): Promise<void> {
  const manifestPath = path.resolve(String(argv.manifest));
  const outputDir = path.resolve(String(argv.output));
  const catalogRef = argv.catalogRef ?? 'HEAD';

  const manifestRaw = await readFile(manifestPath, 'utf8');
  const manifest = YAML.parse(manifestRaw) as LessonManifest;

  const catalog = await Catalog.create({ ref: catalogRef });
  await validateLesson(catalog, manifest);
  const version = await loadPackageVersion();

  await ensureDir(outputDir);
  const devcontainerDir = path.join(outputDir, '.devcontainer');
  await ensureDir(devcontainerDir);
  await fsExtra.outputFile(path.join(outputDir, 'lesson.yaml'), manifestRaw);

  const slug = lessonSlug(manifest);
  const image = lessonImage(manifest);
  const remoteEnv = manifest.spec.env ?? {};
  const extensions = manifest.spec.vscode_extensions ?? [];
  const settings = manifest.spec.settings ?? {};
  const features = manifest.spec.features ?? {};

  const vscodeConfig: Record<string, unknown> = { extensions };
  if (Object.keys(settings).length > 0) {
    vscodeConfig.settings = settings;
  }

  const devcontainerConfig: Record<string, unknown> = {
    name: `${manifest.metadata.course} — ${manifest.metadata.lesson}`,
    image,
    dockerComposeFile: ['./compose.yaml'],
    service: 'devcontainer',
    workspaceFolder: '/workspace',
    customizations: {
      vscode: vscodeConfig
    },
    portsAttributes: {}
  };

  if (Object.keys(features).length > 0) {
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
  await writeManagedFile(path.join(devcontainerDir, 'devcontainer.json'), devcontainerJson, {
    commentStyle: 'slash',
    version,
    catalogRef
  });

  const composeYaml = await renderTemplate(
    'lesson/compose.yaml.ejs',
    { image, slug, catalogRef, version },
    { templateDir }
  );
  await writeManagedFile(path.join(devcontainerDir, 'compose.yaml'), composeYaml, {
    commentStyle: 'hash',
    version,
    catalogRef
  });

  const selections: ServiceSelection[] = (manifest.spec.services ?? []).map((service) => ({
    id: service.name,
    env: service.vars
  }));
  const { fragments, envSections } = await materializeServices(catalog, selections, devcontainerDir);

  const aggregate = createAggregateCompose({
    devcontainerFile: './compose.yaml',
    devcontainerService: 'devcontainer',
    fragments
  });

  if (manifest.spec.emit_aggregate_compose !== false) {
    await writeManagedFile(path.join(devcontainerDir, 'aggregate.compose.yml'), aggregate, {
      commentStyle: 'hash',
      version,
      catalogRef
    });
  }

  if (manifest.spec.starter_repo) {
    const starter = manifest.spec.starter_repo;
    try {
      const starterUrl = new URL(starter.url);
      if (starterUrl.protocol === 'file:') {
        const source = fileURLToPath(starterUrl);
        const relativePath = starter.path ? starter.path.replace(/^\//, '') : '';
        const destination = path.join(outputDir, relativePath);
        await fsExtra.copy(source, destination, { overwrite: false, errorOnExist: false });
        console.log(chalk.green(`Starter content copied from ${source} to ${destination}`));
      } else {
        console.warn(
          chalk.yellow(
            'Starter repository URL is remote; skipping automatic fetch. Download manually if needed.'
          )
        );
      }
    } catch (error) {
      const localSource = path.resolve(starter.url);
      try {
        const relativePath = starter.path ? starter.path.replace(/^\//, '') : '';
        const destination = path.join(outputDir, relativePath);
        await fsExtra.copy(localSource, destination, { overwrite: false, errorOnExist: false });
        console.log(chalk.green(`Starter content copied from ${localSource} to ${destination}`));
      } catch (copyError) {
        console.warn(
          chalk.yellow(
            `Unable to materialize starter repo from ${starter.url}: ${(copyError as Error).message}`
          )
        );
      }
    }
  }

  const envLines: string[] = [];
  envLines.push('# Copy this file to .env and supply the required values.');
  for (const [key, value] of Object.entries(remoteEnv)) {
    envLines.push(`${key}=${value}`);
  }
  for (const placeholder of manifest.spec.secrets_placeholders ?? []) {
    envLines.push(`${placeholder}=<insert-value>`);
  }
  envLines.push(...envSections);
  const envExample = envLines.join('\n');

  await writeManagedFile(path.join(devcontainerDir, '.env.example'), envExample, {
    commentStyle: 'hash',
    version,
    catalogRef
  });

  try {
    const lessonReadme = await catalog.readFile('docs/snippets/lesson-readme.md');
    await writeManagedFile(path.join(outputDir, 'README.md'), lessonReadme, {
      commentStyle: 'html',
      version,
      catalogRef
    });
  } catch (error) {
    console.warn(chalk.yellow('lesson README snippet not found; skipping.'));
  }

  const workflow = await renderTemplate(
    'lesson/prebuild.yml.ejs',
    {
      image,
      slug,
      basePreset: manifest.spec.base_preset,
      catalogRef,
      version
    },
    { templateDir }
  );
  await writeManagedFile(path.join(outputDir, '.github/workflows/prebuild.yml'), workflow, {
    commentStyle: 'hash',
    version,
    catalogRef
  });

  console.log(chalk.green(`Lesson scaffold generated at ${outputDir}`));
}

export const generateLessonCommand: CommandModule<unknown, GenerateLessonArgs> = {
  command: 'generate lesson',
  describe: 'Generate a lesson scaffold that points to the prebuilt lesson image',
  builder: {
    manifest: {
      alias: 'm',
      type: 'string',
      demandOption: true,
      describe: 'Path to lesson manifest (YAML)'
    },
    output: {
      alias: 'o',
      type: 'string',
      demandOption: true,
      describe: 'Directory to materialize the lesson scaffold'
    },
    catalogRef: {
      type: 'string',
      default: 'HEAD',
      describe: 'Catalog git ref used to source templates'
    }
  },
  handler: (argv) => generateLesson(argv)
};
