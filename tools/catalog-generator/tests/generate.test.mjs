import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { generateCatalogWorkspace, cleanupGeneratedWorkspace } from '../dist/index.js';
import { validateManifest } from '@airnub/devcontainers-catalog-manifest';

const SAMPLE_PIN = '0000000000000000000000000000000000000000';

test('generator produces a manifest that validates against the schema', async (t) => {
  const output = await generateCatalogWorkspace({
    stackId: 'nextjs-supabase@1.0.0',
    browsers: ['neko-chrome'],
    pin: SAMPLE_PIN
  });

  t.after(() => {
    cleanupGeneratedWorkspace(output);
  });

  const manifestFromDisk = JSON.parse(await readFile(output.manifestPath, 'utf-8'));
  assert.deepEqual(output.manifestJson, manifestFromDisk, 'manifestJson should match file contents');

  const validation = validateManifest(manifestFromDisk);
  assert.equal(validation.valid, true, `manifest should be valid: ${JSON.stringify(validation.errors)}`);

  assert.equal(manifestFromDisk.catalogCommit, SAMPLE_PIN, 'catalog commit should match input pin');
  assert.ok(manifestFromDisk.ports.some((port) => port.label === 'Neko Chrome UI'));

  const devcontainer = JSON.parse(await readFile(path.join(output.outDir, '.devcontainer', 'devcontainer.json'), 'utf-8'));
  assert.equal(devcontainer.portsAttributes['3000'].label, 'Web App');
  assert.equal(devcontainer.portsAttributes['8080'].label, 'Neko Chrome UI');
});
