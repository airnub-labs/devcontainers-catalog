import path from "path";
import os from "os";
import fs from "fs-extra";
import { createHash, BinaryLike } from "crypto";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable, Transform } from "stream";
import * as tar from "tar";
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

  let tarballSha = "";
  try {
    const res = await fetch(url);
    if (!res.ok || !res.body) {
      throw new Error(`Failed to download catalog tarball ${url}: ${res.status}`);
    }

    const nodeStream = Readable.fromWeb(res.body as any);
    const hash = createHash("sha256");
    const hashingTransform = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        hash.update(chunk as BinaryLike);
        callback(null, chunk);
      },
    });

    await pipeline(nodeStream, hashingTransform, createWriteStream(tarPath));
    tarballSha = hash.digest("hex");

    await tar.x({ file: tarPath, cwd: tmpBase });

    const entries = await fs.readdir(tmpBase);
    const extractedDir = entries
      .map((entry) => path.join(tmpBase, entry))
      .find((entry) => {
        try {
          return fs.statSync(entry).isDirectory() && path.basename(entry).includes(REPO);
        } catch {
          return false;
        }
      });

    if (!extractedDir) {
      throw new Error(`Unable to locate extracted catalog directory for ref ${ref}`);
    }

    await fs.ensureDir(path.dirname(cacheDir));
    try {
      await fs.remove(cacheDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    await fs.move(extractedDir, cacheDir, { overwrite: true });

    const artifactDir = path.join(cacheDir, ".airnub-cache");
    await fs.ensureDir(artifactDir);
    await fs.move(tarPath, path.join(artifactDir, "catalog.tar.gz"), { overwrite: true });
    await fs.writeFile(path.join(artifactDir, "catalog.tar.gz.sha256"), `${tarballSha}\n`, "utf8");
  } finally {
    await fs.remove(tmpBase).catch(() => {});
  }
}

export async function computeFileSha256(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk: Buffer) => {
      hash.update(chunk as BinaryLike);
    });
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (error) => reject(error));
  });
}

async function verifyCachedCatalog(cacheDir: string): Promise<boolean> {
  const artifactDir = path.join(cacheDir, ".airnub-cache");
  const tarballPath = path.join(artifactDir, "catalog.tar.gz");
  const shaPath = `${tarballPath}.sha256`;

  const exists = await Promise.all([fs.pathExists(tarballPath), fs.pathExists(shaPath)]);
  if (!exists.every(Boolean)) {
    return false;
  }

  const recorded = (await fs.readFile(shaPath, "utf8")).trim();
  if (!/^[0-9a-f]{64}$/i.test(recorded)) {
    return false;
  }

  const actual = await computeFileSha256(tarballPath);
  return recorded === actual;
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

  if (await fs.pathExists(cacheTarget)) {
    const valid = await verifyCachedCatalog(cacheTarget).catch(() => false);
    if (!valid) {
      try {
        await fs.remove(cacheTarget);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      }
    }
  }

  if (!await fs.pathExists(cacheTarget)) {
    await downloadCatalog(ref, cacheTarget);
  }

  return { root: cacheTarget, mode: "remote", ref };
}
