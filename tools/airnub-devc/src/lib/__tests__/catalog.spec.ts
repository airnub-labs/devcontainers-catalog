import os from "os";
import path from "path";
import fs from "fs-extra";
import tar from "tar";
import { Readable } from "stream";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { resolveCatalog, computeFileSha256 } from "../catalog.js";

vi.mock("../fsutil.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../fsutil.js")>();
  return {
    ...actual,
    discoverCatalogRoot: () => null,
  };
});

declare global {
  // eslint-disable-next-line no-var
  var fetch: any;
}

async function createTarball(baseDir: string, label: string) {
  const workingDir = await fs.mkdtemp(path.join(baseDir, `catalog-src-${label}-`));
  const folderName = `airnub-labs-devcontainers-catalog-${label}`;
  const repoDir = path.join(workingDir, folderName);
  await fs.ensureDir(repoDir);
  await fs.writeFile(path.join(repoDir, "README.md"), `catalog ${label}`);
  const tarPath = path.join(workingDir, "catalog.tar.gz");
  await tar.c({
    cwd: workingDir,
    gzip: true,
    file: tarPath,
  }, [folderName]);
  return { tarPath, cleanup: () => fs.remove(workingDir) };
}

function responseFromFile(filePath: string) {
  const nodeStream = fs.createReadStream(filePath);
  const body = Readable.toWeb(nodeStream);
  return {
    ok: true,
    status: 200,
    body,
  } as unknown as Response;
}

describe("resolveCatalog", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "catalog-test-"));
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await fs.remove(tmpDir);
  });

  it("downloads the catalog tarball and records a checksum", async () => {
    const { tarPath, cleanup } = await createTarball(tmpDir, "first");
    const fetchMock = vi.fn().mockResolvedValue(responseFromFile(tarPath));
    vi.stubGlobal("fetch", fetchMock);

    const cacheRoot = path.join(tmpDir, "cache");
    const context = await resolveCatalog({ catalogRef: "test", cacheDir: cacheRoot });

    const shaFile = path.join(context.root, ".airnub-cache", "catalog.tar.gz.sha256");
    const tarball = path.join(context.root, ".airnub-cache", "catalog.tar.gz");

    expect(await fs.pathExists(shaFile)).toBe(true);
    expect(await fs.pathExists(tarball)).toBe(true);

    const recorded = (await fs.readFile(shaFile, "utf8")).trim();
    const actual = await computeFileSha256(tarball);
    expect(recorded).toBe(actual);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await cleanup();
  });

  it("re-downloads when the cached checksum no longer matches", async () => {
    const first = await createTarball(tmpDir, "first");
    const second = await createTarball(tmpDir, "second");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseFromFile(first.tarPath))
      .mockResolvedValueOnce(responseFromFile(second.tarPath));
    vi.stubGlobal("fetch", fetchMock);

    const cacheRoot = path.join(tmpDir, "cache");
    const ctx1 = await resolveCatalog({ catalogRef: "test", cacheDir: cacheRoot });
    const shaFile = path.join(ctx1.root, ".airnub-cache", "catalog.tar.gz.sha256");
    await fs.writeFile(shaFile, "0000000000000000000000000000000000000000000000000000000000000000\n");

    const ctx2 = await resolveCatalog({ catalogRef: "test", cacheDir: cacheRoot });
    const tarball = path.join(ctx2.root, ".airnub-cache", "catalog.tar.gz");
    const recorded = (await fs.readFile(path.join(ctx2.root, ".airnub-cache", "catalog.tar.gz.sha256"), "utf8")).trim();
    const actual = await computeFileSha256(tarball);

    expect(ctx2.root).toBe(cacheRoot);
    expect(recorded).toBe(actual);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await first.cleanup();
    await second.cleanup();
  });
});
