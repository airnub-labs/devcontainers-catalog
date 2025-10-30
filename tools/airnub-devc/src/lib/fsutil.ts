import fs from "fs-extra";
import path from "path";
import YAML from "yaml";

export async function safeWriteDir(dir: string, force = false) {
  await fs.ensureDir(path.dirname(dir));
  const exists = await fs.pathExists(dir);
  if (exists && !force) {
    throw new Error(`Refusing to overwrite existing dir: ${dir} (use --force)`);
  }
  if (exists && force) {
    await fs.emptyDir(dir);
  } else {
    await fs.ensureDir(dir);
  }
}

export async function writeJson(filePath: string, data: unknown) {
  await fs.outputJson(filePath, data, { spaces: 2 });
}

export async function writeYaml(filePath: string, data: unknown) {
  await fs.outputFile(filePath, YAML.stringify(data));
}

export function discoverCatalogRoot(startDir = process.cwd()): string | null {
  let cur = startDir;
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(cur, "schemas", "lesson-env.schema.json")) ||
      fs.existsSync(path.join(cur, "services"))
    ) {
      return cur;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

export function discoverWorkspaceRoot(startDir = process.cwd()): string | null {
  let cur = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(cur, ".devcontainer", "devcontainer.json"))) {
      return cur;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}
