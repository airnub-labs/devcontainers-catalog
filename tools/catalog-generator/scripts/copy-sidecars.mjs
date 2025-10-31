import { copyFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const source = path.join(repoRoot, 'catalog', 'sidecars.json');
const destinationDir = path.join(packageRoot, 'dist', 'catalog');
const destination = path.join(destinationDir, 'sidecars.json');

await mkdir(destinationDir, { recursive: true });
await copyFile(source, destination);
