import Ajv, { ValidateFunction, AnySchema } from "ajv";
import addFormats from "ajv-formats";
import fs from "fs-extra";
import path from "path";
import YAML from "yaml";

let cachedValidator: ValidateFunction | null = null;
let cachedSchemaPath: string | null = null;

export async function loadSchema(repoRoot: string) {
  const schemaPath = path.join(repoRoot, "schemas", "lesson-env.schema.json");
  if (!cachedValidator || cachedSchemaPath !== schemaPath) {
    const schema = await fs.readJson(schemaPath) as AnySchema;
    const ajv = new Ajv({ allErrors: true, strict: true });
    addFormats(ajv);
    cachedValidator = ajv.compile(schema);
    cachedSchemaPath = schemaPath;
  }
  return cachedValidator!;
}

export async function loadManifest(file: string) {
  const raw = await fs.readFile(file, "utf8");
  if (file.endsWith(".json")) {
    return JSON.parse(raw);
  }
  return YAML.parse(raw);
}
