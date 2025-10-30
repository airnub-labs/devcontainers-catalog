import path from "path";
import fs from "fs-extra";

export interface MaterializeServicesOptions {
  services: string[];
  destination: string;
  repoRoot: string;
  fetchIfMissing?: boolean;
  searchRoots?: string[];
}

export async function materializeServices(opts: MaterializeServicesOptions) {
  if (!opts.services.length) {
    return;
  }

  await fs.ensureDir(opts.destination);

  for (const svc of opts.services) {
    const destDir = path.join(opts.destination, svc);
    const candidates = [
      destDir,
      ...(opts.searchRoots ?? []).map((root) => path.join(root, svc)),
      path.join(opts.repoRoot, "services", svc),
    ];

    let sourceDir: string | null = null;
    for (const candidate of candidates) {
      if (await fs.pathExists(candidate)) {
        sourceDir = candidate;
        break;
      }
    }

    if (!sourceDir) {
      if (opts.fetchIfMissing) {
        throw new Error(
          `Service fragment '${svc}' missing locally. Provide --catalog-root or ensure services/${svc} exists.`,
        );
      }
      throw new Error(`Service fragment '${svc}' not found under ${path.join(opts.repoRoot, "services")}.`);
    }

    if (sourceDir !== destDir) {
      await fs.remove(destDir).catch(() => {});
      await fs.copy(sourceDir, destDir);
    }
  }
}

export async function listServiceDirs(baseDir: string): Promise<string[]> {
  const exists = await fs.pathExists(baseDir);
  if (!exists) {
    return [];
  }
  const entries = await fs.readdir(baseDir);
  return entries
    .map((entry) => path.join(baseDir, entry))
    .filter((entry) => fs.statSync(entry).isDirectory())
    .map((entry) => path.basename(entry))
    .sort();
}
