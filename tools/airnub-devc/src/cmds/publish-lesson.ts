import { access } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chalk from 'chalk';
import YAML from 'yaml';
import type { CommandModule } from 'yargs';
import { Catalog } from '../lib/catalog.js';

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
  };
}

interface PublishLessonArgs {
  manifest: string;
  catalogRef: string;
  provenance: boolean;
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

function runDevcontainerBuild(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('devcontainer', ['build', ...args], {
      cwd,
      stdio: 'inherit'
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`devcontainer build exited with code ${code}`));
      }
    });
    child.on('error', (error) => reject(error));
  });
}

async function publishLesson(argv: PublishLessonArgs): Promise<void> {
  const manifestPath = path.resolve(String(argv.manifest));
  const catalogRef = argv.catalogRef ?? 'HEAD';
  const manifestRaw = await readFile(manifestPath, 'utf8');
  const manifest = YAML.parse(manifestRaw) as LessonManifest;

  const catalog = await Catalog.create({ ref: catalogRef });
  await validateLesson(catalog, manifest);

  const image = lessonImage(manifest);
  const workspaceFolder = path.join(catalog.root, 'images', 'presets', manifest.spec.base_preset);
  try {
    await access(workspaceFolder);
  } catch (error) {
    throw new Error(`Preset workspace folder not found: ${workspaceFolder}`);
  }

  const args = [
    '--workspace-folder',
    workspaceFolder,
    '--image-name',
    image,
    '--push',
    '--platform',
    'linux/amd64,linux/arm64',
    '--buildx',
    `--provenance=${argv.provenance ? 'true' : 'false'}`
  ];

  console.log(chalk.blue(`Running devcontainer build for ${image}`));
  await runDevcontainerBuild(args, catalog.root);
  console.log(chalk.green(`Lesson image pushed: ${image}`));
}

export const publishLessonCommand: CommandModule<unknown, PublishLessonArgs> = {
  command: 'publish lesson',
  describe: 'Build and push a lesson image using devcontainer buildx',
  builder: {
    manifest: {
      alias: 'm',
      type: 'string',
      demandOption: true,
      describe: 'Path to lesson manifest (YAML)'
    },
    catalogRef: {
      type: 'string',
      default: 'HEAD',
      describe: 'Catalog git ref used to source presets'
    },
    provenance: {
      type: 'boolean',
      default: false,
      describe: 'Enable provenance in devcontainer build (default false)'
    }
  },
  handler: (argv) => publishLesson(argv)
};
