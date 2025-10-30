import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import type { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it, beforeAll } from 'vitest';
import YAML from 'yaml';

interface ValidationSuite {
  validator: Ajv;
  validateWorkspace: ValidateFunction;
  validateLesson: ValidateFunction;
}

const suite: ValidationSuite = {
  validator: new Ajv({ allErrors: true, strict: false }),
  validateWorkspace: () => true,
  validateLesson: () => true
} as unknown as ValidationSuite;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

beforeAll(async () => {
  addFormats(suite.validator);
  const repoRoot = path.resolve(__dirname, '../../../..');
  const workspaceSchemaPath = path.join(repoRoot, 'schemas', 'workspace.schema.json');
  const lessonSchemaPath = path.join(repoRoot, 'schemas', 'lesson-env.schema.json');
  const workspaceSchema = JSON.parse(await readFile(workspaceSchemaPath, 'utf8'));
  const lessonSchema = JSON.parse(await readFile(lessonSchemaPath, 'utf8'));
  suite.validateWorkspace = suite.validator.compile(workspaceSchema);
  suite.validateLesson = suite.validator.compile(lessonSchema);
});

describe('schemas', () => {
  it('accepts the workspace example manifest', async () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const manifestPath = path.join(repoRoot, 'examples', 'workspaces', 'quick-supabase.yaml');
    const manifest = YAML.parse(await readFile(manifestPath, 'utf8'));
    const result = suite.validateWorkspace(manifest);
    expect(result).toBe(true);
  });

  it('rejects workspace manifest missing preset in preset mode', () => {
    const invalid = {
      apiVersion: 'airnub.devcontainers/v1',
      kind: 'Workspace',
      metadata: { name: 'broken' },
      spec: {
        mode: 'preset',
        image_tag_strategy: 'ubuntu-24.04'
      }
    };
    const result = suite.validateWorkspace(invalid);
    expect(result).toBe(false);
  });

  it('accepts the lesson example manifest', async () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const manifestPath = path.join(repoRoot, 'examples', 'lessons', 'intro-ai-week02.yaml');
    const manifest = YAML.parse(await readFile(manifestPath, 'utf8'));
    const result = suite.validateLesson(manifest);
    expect(result).toBe(true);
  });
});
