import Ajv, { ErrorObject, type ValidateFunction } from 'ajv';
import schemaJson from '../schema/manifest.schema.json' assert { type: 'json' };
import type { Manifest } from './types.js';

const ajv = new Ajv({ allErrors: true, strict: false });
const validate: ValidateFunction<Manifest> = ajv.compile<Manifest>(schemaJson as any);

export type { Manifest } from './types.js';
export const schema = schemaJson as const;

export interface ValidateManifestResult {
  valid: boolean;
  errors: ErrorObject[] | null;
}

export function validateManifest(candidate: unknown): ValidateManifestResult {
  const valid = Boolean(validate(candidate));
  return {
    valid,
    errors: validate.errors ?? null
  };
}
