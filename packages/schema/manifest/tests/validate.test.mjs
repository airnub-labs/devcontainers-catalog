import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixturePath = (name) => resolve(__dirname, 'fixtures', name);

const loadJson = async (name) => {
  const raw = await readFile(fixturePath(name), 'utf8');
  return JSON.parse(raw);
};

test('validateManifest succeeds for valid manifests', async () => {
  const { validateManifest } = await import('../dist/index.js');
  const manifest = await loadJson('valid.manifest.json');
  const result = validateManifest(manifest);
  assert.equal(result.valid, true);
  assert.equal(result.errors, null);
});

test('validateManifest reports errors for invalid manifests', async () => {
  const { validateManifest } = await import('../dist/index.js');
  const manifest = await loadJson('invalid.manifest.json');
  const result = validateManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(Array.isArray(result.errors));
  assert.ok(result.errors.length > 0);
});
