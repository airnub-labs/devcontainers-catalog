import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const schemaPath = path.join(root, 'packages', 'schema', 'manifest', 'schema', 'manifest.schema.json');
const packageJsonPath = path.join(root, 'packages', 'schema', 'manifest', 'package.json');

const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const schemaConst = schema?.properties?.schemaVersion?.const;
const packageVersion = pkg?.version;

if (!schemaConst) {
  console.error('schemaVersion const not found in manifest schema');
  process.exit(1);
}

if (!packageVersion) {
  console.error('version not found in manifest package.json');
  process.exit(1);
}

if (schemaConst !== packageVersion) {
  console.error(`schemaVersion (${schemaConst}) does not match package version (${packageVersion})`);
  process.exit(1);
}

console.log(`Manifest schemaVersion (${schemaConst}) matches package version (${packageVersion}).`);
