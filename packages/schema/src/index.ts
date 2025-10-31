import { readFileSync } from 'fs';
import path from 'path';
import Ajv, { ValidateFunction } from 'ajv';
import schema from '../manifest.schema.json';
import { WorkspaceManifest } from './types';

const ajv = new Ajv({ allErrors: true, strict: false });
const validateManifestFn: ValidateFunction<WorkspaceManifest> = ajv.compile<WorkspaceManifest>(schema as unknown);

export * from './types';

export function validateManifest(manifest: unknown): asserts manifest is WorkspaceManifest {
  const valid = validateManifestFn(manifest);
  if (!valid) {
    const errorText = ajv.errorsText(validateManifestFn.errors, { dataVar: 'manifest' });
    throw new Error(`Manifest validation failed: ${errorText}`);
  }
}

export function getManifestSchema(): object {
  return schema;
}

export function loadManifestFromFile(manifestPath: string): WorkspaceManifest {
  const absolutePath = path.resolve(manifestPath);
  const raw = readFileSync(absolutePath, 'utf-8');
  const parsed = JSON.parse(raw);
  validateManifest(parsed);
  return parsed;
}
