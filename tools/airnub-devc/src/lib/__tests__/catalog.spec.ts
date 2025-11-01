import os from "os";
import path from "path";
import fs from "fs-extra";
import * as tar from "tar";
import { Readable } from "stream";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { resolveCatalog, computeFileSha256 } from "../catalog.js";

const discoverCatalogRootMock = vi.fn<[], string | null>(() => null);

vi.mock("../fsutil.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../fsutil.js")>();
  return {
    ...actual,
    discoverCatalogRoot: discoverCatalogRootMock,
  };
});

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
    discoverCatalogRootMock.mockReturnValue(null);
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

  it("uses an explicit catalogRoot when provided", async () => {
    const localCatalog = path.join(tmpDir, "local");
    await fs.ensureDir(path.join(localCatalog, "templates"));

    const ctx = await resolveCatalog({ catalogRoot: localCatalog });

    expect(ctx.mode).toBe("local");
    expect(ctx.ref).toBe("local");
    expect(ctx.root).toBe(localCatalog);
  });

  it("throws when the explicit catalogRoot does not exist", async () => {
    await expect(resolveCatalog({ catalogRoot: path.join(tmpDir, "missing") })).rejects.toThrow(
      /Catalog root not found/,
    );
  });

  it("prefers a discovered catalog root when available", async () => {
    const discoveredRoot = path.join(tmpDir, "discovered");
    await fs.ensureDir(path.join(discoveredRoot, "templates"));
    discoverCatalogRootMock.mockReturnValue(discoveredRoot);

    const ctx = await resolveCatalog({});

    expect(ctx.mode).toBe("local");
    expect(ctx.root).toBe(discoveredRoot);
  });

  it("honors a custom cacheDir option when downloading", async () => {
    const { tarPath, cleanup } = await createTarball(tmpDir, "custom");
    const fetchMock = vi.fn().mockResolvedValue(responseFromFile(tarPath));
    vi.stubGlobal("fetch", fetchMock);

    const cacheDir = path.join(tmpDir, "custom-cache");
    const ctx = await resolveCatalog({ catalogRef: "v1.2.3", cacheDir });

    expect(ctx.mode).toBe("remote");
    expect(path.relative(cacheDir, ctx.root)).toBe("v1.2.3");
    expect(await fs.pathExists(path.join(ctx.root, ".airnub-cache", "catalog.tar.gz"))).toBe(true);

    await cleanup();
  });

  it("sanitizes ref names when creating cache directories", async () => {
    const { tarPath, cleanup } = await createTarball(tmpDir, "feature");
    const fetchMock = vi.fn().mockResolvedValue(responseFromFile(tarPath));
    vi.stubGlobal("fetch", fetchMock);

    const cacheDir = path.join(tmpDir, "cache");
    const ctx = await resolveCatalog({ catalogRef: "feature/foo-bar", cacheDir });

    expect(ctx.root.startsWith(path.join(cacheDir, "feature_foo-bar"))).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await cleanup();
  });

  it("re-downloads when cached checksum has invalid format", async () => {
    const first = await createTarball(tmpDir, "first");
    const second = await createTarball(tmpDir, "second");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseFromFile(first.tarPath))
      .mockResolvedValueOnce(responseFromFile(second.tarPath));
    vi.stubGlobal("fetch", fetchMock);

    const cacheDir = path.join(tmpDir, "cache");
    const ctx1 = await resolveCatalog({ catalogRef: "main", cacheDir });
    const shaPath = path.join(ctx1.root, ".airnub-cache", "catalog.tar.gz.sha256");
    await fs.writeFile(shaPath, "not-a-valid-sha\n", "utf8");

    await resolveCatalog({ catalogRef: "main", cacheDir });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    await first.cleanup();
    await second.cleanup();
  });

  it("cleans an invalid cache when the tarball is missing", async () => {
    const { tarPath, cleanup } = await createTarball(tmpDir, "missing");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responseFromFile(tarPath))
      .mockResolvedValueOnce(responseFromFile(tarPath));
    vi.stubGlobal("fetch", fetchMock);

    const cacheDir = path.join(tmpDir, "cache");
    const ctx1 = await resolveCatalog({ catalogRef: "feature", cacheDir });
    const cacheRoot = path.join(ctx1.root, ".airnub-cache");
    await fs.remove(path.join(cacheRoot, "catalog.tar.gz"));

    await resolveCatalog({ catalogRef: "feature", cacheDir });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    await cleanup();
  });

  it("surfaces network failures when downloading the catalog", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    await expect(resolveCatalog({ catalogRef: "does-not-exist", cacheDir: path.join(tmpDir, "cache") })).rejects.toThrow(
      /Failed to download catalog tarball/,
    );
  });
});

describe("computeFileSha256", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sha-test-"));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("computes the expected hash for a known payload", async () => {
    const filePath = path.join(tmpDir, "payload.txt");
    await fs.writeFile(filePath, "hello world", "utf8");

    const sha = await computeFileSha256(filePath);

    expect(sha).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  });

  it("produces a valid hash for empty files", async () => {
    const filePath = path.join(tmpDir, "empty.bin");
    await fs.writeFile(filePath, Buffer.alloc(0));

    const sha = await computeFileSha256(filePath);

    expect(sha).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(sha)).toBe(true);
  });

  it("rejects when the target file does not exist", async () => {
    await expect(computeFileSha256(path.join(tmpDir, "missing.txt"))).rejects.toThrow();
  });
});
