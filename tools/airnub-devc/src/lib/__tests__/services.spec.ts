import os from "os";
import path from "path";
import fs from "fs-extra";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import {
  assertServicesAllowed,
  filterServicesByStability,
  getBrowserSidecar,
  listServiceDirs,
  loadServiceRegistry,
  materializeServices,
  ServiceRegistry,
} from "../services.js";

describe("service registry gating", () => {
  const registry: ServiceRegistry = {
    services: [
      { id: "stable", label: "Stable", templatePath: "services/stable", stability: "stable" },
      { id: "exp", label: "Experimental", templatePath: "services/exp", stability: "experimental" },
      { id: "gone", label: "Deprecated", templatePath: "services/gone", stability: "deprecated" },
    ],
  };

  it("filters experimental services by default", () => {
    const filtered = filterServicesByStability(registry, {
      includeExperimental: false,
      includeDeprecated: false,
    });
    expect(filtered.map((svc) => svc.id)).toEqual(["stable"]);
  });

  it("allows opting into experimental services", () => {
    const filtered = filterServicesByStability(registry, {
      includeExperimental: true,
      includeDeprecated: false,
    });
    expect(filtered.map((svc) => svc.id)).toEqual(["stable", "exp"]);
  });

  it("throws when an experimental service is disallowed", () => {
    expect(() =>
      assertServicesAllowed(["exp"], registry, {
        includeExperimental: false,
        includeDeprecated: false,
      }),
    ).toThrow(/experimental and disabled by default/);
  });

  it("throws when a deprecated service is disallowed", () => {
    expect(() =>
      assertServicesAllowed(["gone"], registry, {
        includeExperimental: true,
        includeDeprecated: false,
      }),
    ).toThrow(/deprecated and disabled by default/);
  });

  it("permits explicitly opted-in experimental services", () => {
    const descriptors = assertServicesAllowed(["exp"], registry, {
      includeExperimental: true,
      includeDeprecated: false,
    });
    expect(descriptors.map((svc) => svc.id)).toEqual(["exp"]);
  });
});

describe("service registry loading", () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "services-repo-"));
  });

  afterEach(async () => {
    await fs.remove(repoRoot);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("parses catalog/services.json from disk", async () => {
    await fs.outputJson(path.join(repoRoot, "catalog", "services.json"), {
      services: [
        { id: "redis", templatePath: "services/redis", stability: "stable", label: "Redis" },
        { id: "kafka", templatePath: "services/kafka", stability: "experimental", since: "1.0.0" },
      ],
    });

    const registry = await loadServiceRegistry(repoRoot);

    expect(registry.services).toHaveLength(2);
    expect(registry.services[0]).toMatchObject({ id: "redis", stability: "stable" });
    expect(registry.services[1]).toMatchObject({ id: "kafka", stability: "experimental", since: "1.0.0" });
  });

  it("applies defaults for missing optional fields", async () => {
    await fs.outputJson(path.join(repoRoot, "catalog", "services.json"), {
      services: [{ id: "minimal", templatePath: "services/minimal" }],
    });

    const registry = await loadServiceRegistry(repoRoot);

    expect(registry.services[0].label).toBe("minimal");
    expect(registry.services[0].stability).toBe("stable");
    expect(registry.services[0].ports).toBeUndefined();
  });

  it("throws a descriptive error when services.json is missing", async () => {
    await expect(loadServiceRegistry(repoRoot)).rejects.toThrow(/Service registry not found/);
  });

  it("bubbles up malformed JSON errors", async () => {
    const registryPath = path.join(repoRoot, "catalog", "services.json");
    await fs.ensureDir(path.dirname(registryPath));
    await fs.writeFile(registryPath, "{ invalid json }", "utf8");

    await expect(loadServiceRegistry(repoRoot)).rejects.toThrow();
  });

  it("memoises registry loads per repo root", async () => {
    await fs.outputJson(path.join(repoRoot, "catalog", "services.json"), {
      services: [{ id: "svc", templatePath: "services/svc" }],
    });

    const first = await loadServiceRegistry(repoRoot);
    const second = await loadServiceRegistry(repoRoot);

    expect(second).toBe(first);
  });

  it("uses different caches for distinct paths", async () => {
    const repoA = path.join(repoRoot, "a");
    const repoB = path.join(repoRoot, "b");

    await fs.outputJson(path.join(repoA, "catalog", "services.json"), {
      services: [{ id: "alpha", templatePath: "services/alpha" }],
    });
    await fs.outputJson(path.join(repoB, "catalog", "services.json"), {
      services: [{ id: "bravo", templatePath: "services/bravo" }],
    });

    const regA = await loadServiceRegistry(repoA);
    const regB = await loadServiceRegistry(repoB);

    expect(regA.services[0].id).toBe("alpha");
    expect(regB.services[0].id).toBe("bravo");
  });
});

describe("browser sidecar lookups", () => {
  it("returns descriptors for known browsers", () => {
    const chrome = getBrowserSidecar("neko-chrome");

    expect(chrome?.serviceName).toBe("neko");
    expect(chrome?.ports).toContain(8080);
  });

  it("returns undefined for missing browsers", () => {
    expect(getBrowserSidecar("unknown-browser")).toBeUndefined();
  });

  it("includes experimental entries", () => {
    const firefox = getBrowserSidecar("neko-firefox");

    expect(firefox?.experimental).toBe(true);
  });
});

describe("materializeServices", () => {
  let repoRoot: string;
  let destination: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "services-src-"));
    destination = path.join(repoRoot, "out");
  });

  afterEach(async () => {
    await fs.remove(repoRoot);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("copies service fragments from the catalog", async () => {
    const serviceDir = path.join(repoRoot, "services", "redis");
    await fs.outputFile(path.join(serviceDir, "docker-compose.redis.yml"), "services: {}\n");
    await fs.outputFile(path.join(serviceDir, "README.md"), "# Redis\n");

    await materializeServices({
      services: ["redis"],
      destination,
      repoRoot,
    });

    expect(await fs.pathExists(path.join(destination, "redis", "docker-compose.redis.yml"))).toBe(true);
    expect(await fs.pathExists(path.join(destination, "redis", "README.md"))).toBe(true);
  });

  it("searches alternate roots before fetching remotely", async () => {
    const alternate = path.join(repoRoot, "alt-services");
    await fs.outputFile(path.join(alternate, "custom", "docker-compose.custom.yml"), "services: {}\n");

    await materializeServices({
      services: ["custom"],
      destination,
      repoRoot,
      searchRoots: [alternate],
    });

    expect(await fs.pathExists(path.join(destination, "custom", "docker-compose.custom.yml"))).toBe(true);
  });

  it("fetches missing fragments when fetchIfMissing is true", async () => {
    const composeContent = "services:\n  remote:\n    image: remote:latest\n";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, text: async () => composeContent })
      .mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal("fetch", fetchMock);

    await materializeServices({
      services: ["remote"],
      destination,
      repoRoot,
      fetchIfMissing: true,
      fetchRef: "main",
    });

    const fetched = await fs.readFile(path.join(destination, "remote", "docker-compose.remote.yml"), "utf8");
    expect(fetched).toContain("remote:latest");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("throws when remote fragments are unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(
      materializeServices({
        services: ["missing"],
        destination,
        repoRoot,
        fetchIfMissing: true,
        fetchRef: "main",
      }),
    ).rejects.toThrow(/not found remotely/);
  });

  it("throws when the service fragment is missing locally and fetching is disabled", async () => {
    await expect(
      materializeServices({
        services: ["missing"],
        destination,
        repoRoot,
        fetchIfMissing: false,
      }),
    ).rejects.toThrow(/Service fragment 'missing'/);
  });

  it("skips work when no services are requested", async () => {
    await materializeServices({
      services: [],
      destination,
      repoRoot,
    });

    expect(await fs.pathExists(destination)).toBe(false);
  });
});

describe("fetchRemoteFragment error handling", () => {
  it("raises an error when the compose file cannot be located", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "services-fetch-"));
    try {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

      await expect(
        materializeServices({
          services: ["remote"],
          destination: path.join(repoRoot, "out"),
          repoRoot,
          fetchIfMissing: true,
          fetchRef: "main",
        }),
      ).rejects.toThrow(/not found remotely/);
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      await fs.remove(repoRoot);
    }
  });
});

describe("listServiceDirs", () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await fs.mkdtemp(path.join(os.tmpdir(), "services-list-"));
  });

  afterEach(async () => {
    await fs.remove(baseDir);
  });

  it("returns sorted service directory names", async () => {
    await fs.ensureDir(path.join(baseDir, "redis"));
    await fs.ensureDir(path.join(baseDir, "kafka"));
    await fs.outputFile(path.join(baseDir, "README.md"), "not a dir");

    const dirs = await listServiceDirs(baseDir);

    expect(dirs).toEqual(["kafka", "redis"]);
  });

  it("returns an empty list when the directory does not exist", async () => {
    const missing = path.join(baseDir, "missing");
    const dirs = await listServiceDirs(missing);

    expect(dirs).toEqual([]);
  });
});
