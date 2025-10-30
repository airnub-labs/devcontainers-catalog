import path from "path";
import os from "os";
import fs from "fs-extra";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import tar from "tar";
import { discoverCatalogRoot } from "./fsutil.js";

const OWNER = "airnub-labs";
const REPO = "devcontainers-catalog";

export interface CatalogOptions {
  catalogRoot?: string;
  catalogRef?: string;
  cacheDir?: string;
}

export interface CatalogContext {
  root: string;
  mode: "local" | "remote";
  ref: string;
}

async function downloadCatalog(ref: string, cacheDir: string) {
  const url = `https://codeload.github.com/${OWNER}/${REPO}/tar.gz/${ref}`;
  const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), "airnub-devc-"));
  const tarPath = path.join(tmpBase, "catalog.tar.gz");

  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download catalog tarball ${url}: ${res.status}`);
  }

  await pipeline(res.body, createWriteStream(tarPath));
  await tar.x({ file: tarPath, cwd: tmpBase });

  const entries = await fs.readdir(tmpBase);
  const extractedDir = entries
    .map((entry) => path.join(tmpBase, entry))
    .find((entry) => fs.statSync(entry).isDirectory() && path.basename(entry).includes(REPO));

  if (!extractedDir) {
    throw new Error(`Unable to locate extracted catalog directory for ref ${ref}`);
  }

  await fs.ensureDir(path.dirname(cacheDir));
  await fs.remove(cacheDir).catch(() => {});
  await fs.move(extractedDir, cacheDir, { overwrite: true });
  await fs.remove(tmpBase).catch(() => {});
}

export async function resolveCatalog(options: CatalogOptions = {}): Promise<CatalogContext> {
  const explicit = options.catalogRoot ? path.resolve(options.catalogRoot) : null;
  if (explicit) {
    if (!await fs.pathExists(explicit)) {
      throw new Error(`Catalog root not found: ${explicit}`);
    }
    return { root: explicit, mode: "local", ref: "local" };
  }

  const discovered = discoverCatalogRoot();
  if (discovered) {
    return { root: discovered, mode: "local", ref: "local" };
  }

  const ref = options.catalogRef ?? "main";
  const cacheBase = options.cacheDir ?? path.join(os.homedir(), ".cache", "airnub-devc");
  const cacheTarget = path.join(cacheBase, ref.replace(/[^a-zA-Z0-9._-]/g, "_"));

  if (!await fs.pathExists(cacheTarget)) {
    await downloadCatalog(ref, cacheTarget);
  }

  return { root: cacheTarget, mode: "remote", ref };
}
