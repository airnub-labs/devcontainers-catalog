# Coding Agent Prompt: Increase Test Coverage to 80%+

## Mission Objective

Implement comprehensive test coverage for three critical modules in the `tools/airnub-devc` package to achieve **80%+ code coverage**. These modules handle catalog resolution, service materialization, and stack generation—the core functionality of the CLI.

---

## Target Files

1. **`catalog.ts`** (154 lines) - Catalog resolution, caching, and integrity verification
2. **`services.ts`** (311 lines) - Service registry loading, filtering, and materialization
3. **`stacks.ts`** (1136 lines) - Stack generation, YAML/JSON merging, port allocation

---

## Current Test Coverage Analysis

### Existing Tests (Location: `tools/airnub-devc/src/lib/__tests__/`)

#### `catalog.spec.ts` (2 tests - ~15% coverage)
**Current Coverage:**
- ✅ Downloads catalog tarball and records SHA256 checksum
- ✅ Re-downloads when cached checksum is invalid

**Missing Critical Coverage (~85%):**
- Local catalog resolution (explicit `catalogRoot` option)
- Catalog discovery via `discoverCatalogRoot()`
- Error handling: invalid tarball URL, network failures, malformed archives
- SHA256 file format validation (non-hex checksum rejection)
- Cache directory permissions errors
- Concurrent cache access scenarios

#### `services.spec.ts` (5 tests - ~25% coverage)
**Current Coverage:**
- ✅ Filters services by stability (experimental/deprecated)
- ✅ Validates allowed/disallowed service IDs
- ✅ Throws errors for stability violations

**Missing Critical Coverage (~75%):**
- `loadRegistryFromDisk()`: JSON parsing, error handling, missing file
- `loadServiceRegistry()`: Registry caching behavior
- `getBrowserSidecar()`: ID lookup, not found cases
- `materializeServices()`: Local copy, remote fetch, staging/cleanup
- `fetchRemoteFragment()`: HTTP errors, missing compose files, partial downloads
- `listServiceDirs()`: Directory listing, empty directories, non-existent paths

#### `stacks.spec.ts` (2 tests - ~10% coverage)
**Current Coverage:**
- ✅ Merges browser services with port reassignment
- ✅ Generates merge plan and scaffolding (SDK mode)

**Missing Critical Coverage (~90%):**
- Port parsing edge cases: strings, objects, invalid formats
- Multiple browser port conflicts (3+ browsers)
- YAML comment preservation in complex scenarios
- Template placeholder handling (`{{...}}` parsing/serialization)
- Template sections (`{{#...}}`, `{{^...}}`, `{{/...}}`)
- Feature merging and sorting
- Preset image replacement (removing `build` config)
- Insert file operations with mode preservation
- Error cases: missing templates, malformed YAML, invalid browser IDs

---

## Testing Framework & Patterns

### Technology Stack
- **Test Runner:** Vitest (already configured)
- **Mocking:** `vi.fn()`, `vi.spyOn()`, `vi.mock()`, `vi.stubGlobal()`
- **File System:** `fs-extra` with temp directories (use `fs.mkdtemp()` in `beforeEach`)
- **Assertions:** `expect()` from Vitest

### Test Structure Pattern
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";

describe("ModuleName.functionName", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-prefix-"));
    // Setup test fixtures
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
    vi.restoreAllMocks();
  });

  it("should handle happy path scenario", async () => {
    // Arrange: Create test data
    // Act: Call function under test
    // Assert: Verify expectations
  });

  it("should throw error when [edge case]", async () => {
    // Test error handling
    await expect(async () => {
      // Call function
    }).rejects.toThrow(/expected error message/);
  });
});
```

---

## Detailed Test Implementation Requirements

### 1. `catalog.spec.ts` - Expand to 80%+ Coverage

**Add the following test cases:**

#### **Test Suite: `resolveCatalog` (add 6 new tests)**

```typescript
describe("resolveCatalog - local resolution", () => {
  it("should use explicit catalogRoot when provided", async () => {
    // Create a local catalog structure
    const localCatalog = path.join(tmpDir, "local-catalog");
    await fs.ensureDir(path.join(localCatalog, "templates"));

    const ctx = await resolveCatalog({ catalogRoot: localCatalog });

    expect(ctx.mode).toBe("local");
    expect(ctx.root).toBe(localCatalog);
    expect(ctx.ref).toBe("local");
  });

  it("should throw error when catalogRoot does not exist", async () => {
    await expect(async () => {
      await resolveCatalog({ catalogRoot: "/nonexistent/path" });
    }).rejects.toThrow(/Catalog root not found/);
  });

  it("should discover catalog root when in repo directory", async () => {
    // Mock discoverCatalogRoot to return a valid path
    const { resolveCatalog } = await import("../catalog.js");
    vi.doMock("../fsutil.js", () => ({
      discoverCatalogRoot: () => tmpDir,
    }));

    const ctx = await resolveCatalog({});
    expect(ctx.mode).toBe("local");
  });
});

describe("resolveCatalog - remote resolution", () => {
  it("should use custom cacheDir option", async () => {
    const customCache = path.join(tmpDir, "custom-cache");
    // Create mock tarball and fetch
    // ... (similar to existing test)

    const ctx = await resolveCatalog({
      catalogRef: "v1.0.0",
      cacheDir: customCache
    });

    expect(ctx.root).toContain("custom-cache");
  });

  it("should sanitize ref names in cache directory", async () => {
    // Test that refs like "feature/foo-bar" become "feature_foo-bar"
    // Mock fetch response
    const ctx = await resolveCatalog({ catalogRef: "feature/test-123" });
    expect(ctx.root).toMatch(/feature_test-123/);
  });

  it("should handle network errors gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    await expect(async () => {
      await resolveCatalog({ catalogRef: "nonexistent" });
    }).rejects.toThrow(/Failed to download catalog tarball/);
  });
});

describe("verifyCachedCatalog", () => {
  it("should return false when tarball is missing", async () => {
    const cacheDir = path.join(tmpDir, "empty-cache");
    await fs.ensureDir(cacheDir);

    // Call internal verifyCachedCatalog (may need to export for testing)
    // Or test indirectly via resolveCatalog behavior
  });

  it("should return false when SHA256 file has invalid format", async () => {
    // Create tarball but write invalid SHA (too short, invalid chars)
    const cacheDir = path.join(tmpDir, "bad-sha");
    await fs.ensureDir(path.join(cacheDir, ".airnub-cache"));
    await fs.writeFile(
      path.join(cacheDir, ".airnub-cache", "catalog.tar.gz.sha256"),
      "not-a-valid-sha"
    );
    await fs.writeFile(
      path.join(cacheDir, ".airnub-cache", "catalog.tar.gz"),
      "fake tarball"
    );

    // Verify cache is invalidated and re-downloaded
  });
});

describe("computeFileSha256", () => {
  it("should compute correct SHA256 for a file", async () => {
    const testFile = path.join(tmpDir, "test.txt");
    await fs.writeFile(testFile, "hello world");

    const sha = await computeFileSha256(testFile);

    // Pre-computed SHA256 of "hello world"
    expect(sha).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  });

  it("should handle empty files", async () => {
    const emptyFile = path.join(tmpDir, "empty.txt");
    await fs.writeFile(emptyFile, "");

    const sha = await computeFileSha256(emptyFile);
    expect(sha).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(sha)).toBe(true);
  });

  it("should reject when file does not exist", async () => {
    await expect(async () => {
      await computeFileSha256("/nonexistent/file.txt");
    }).rejects.toThrow();
  });
});
```

**Coverage Target:** 8 existing + 9 new = **17 tests** (~85% coverage)

---

### 2. `services.spec.ts` - Expand to 80%+ Coverage

**Add the following test cases:**

#### **Test Suite: Registry Loading (add 8 new tests)**

```typescript
describe("loadRegistryFromDisk", () => {
  it("should parse valid services.json", async () => {
    const repoRoot = tmpDir;
    await fs.outputJson(path.join(repoRoot, "catalog", "services.json"), {
      services: [
        {
          id: "redis",
          label: "Redis Cache",
          templatePath: "services/redis",
          stability: "stable",
          ports: [6379],
        },
        {
          id: "kafka",
          label: "Apache Kafka",
          templatePath: "services/kafka",
          stability: "experimental",
          since: "1.2.0",
        },
      ],
    });

    const { loadRegistryFromDisk } = await import("../services.js");
    const registry = await loadRegistryFromDisk(repoRoot);

    expect(registry.services).toHaveLength(2);
    expect(registry.services[0].id).toBe("redis");
    expect(registry.services[0].stability).toBe("stable");
    expect(registry.services[1].stability).toBe("experimental");
  });

  it("should throw descriptive error when services.json is missing", async () => {
    const emptyRepo = path.join(tmpDir, "empty");
    await fs.ensureDir(emptyRepo);

    await expect(async () => {
      const { loadRegistryFromDisk } = await import("../services.js");
      await loadRegistryFromDisk(emptyRepo);
    }).rejects.toThrow(/Service registry not found/);
  });

  it("should handle malformed services.json gracefully", async () => {
    await fs.outputFile(
      path.join(tmpDir, "catalog", "services.json"),
      "{ invalid json }"
    );

    await expect(async () => {
      const { loadRegistryFromDisk } = await import("../services.js");
      await loadRegistryFromDisk(tmpDir);
    }).rejects.toThrow();
  });

  it("should apply defaults for missing fields", async () => {
    await fs.outputJson(path.join(tmpDir, "catalog", "services.json"), {
      services: [
        { id: "minimal", templatePath: "services/minimal" },
      ],
    });

    const { loadRegistryFromDisk } = await import("../services.js");
    const registry = await loadRegistryFromDisk(tmpDir);

    expect(registry.services[0].stability).toBe("stable");
    expect(registry.services[0].label).toBeTruthy();
  });
});

describe("loadServiceRegistry - caching", () => {
  it("should cache registry by repoRoot path", async () => {
    await fs.outputJson(path.join(tmpDir, "catalog", "services.json"), {
      services: [{ id: "test", templatePath: "services/test", stability: "stable" }],
    });

    const registry1 = await loadServiceRegistry(tmpDir);
    const registry2 = await loadServiceRegistry(tmpDir);

    // Should return same promise (cached)
    expect(registry1).toBe(registry2);
  });

  it("should use different cache for different paths", async () => {
    const repo1 = path.join(tmpDir, "repo1");
    const repo2 = path.join(tmpDir, "repo2");

    await fs.outputJson(path.join(repo1, "catalog", "services.json"), {
      services: [{ id: "svc1", templatePath: "services/svc1", stability: "stable" }],
    });
    await fs.outputJson(path.join(repo2, "catalog", "services.json"), {
      services: [{ id: "svc2", templatePath: "services/svc2", stability: "stable" }],
    });

    const reg1 = await loadServiceRegistry(repo1);
    const reg2 = await loadServiceRegistry(repo2);

    expect(reg1.services[0].id).toBe("svc1");
    expect(reg2.services[0].id).toBe("svc2");
  });
});

describe("getBrowserSidecar", () => {
  it("should return sidecar by ID", () => {
    const browser = getBrowserSidecar("neko-chrome");
    expect(browser).toBeDefined();
    expect(browser?.id).toBe("neko-chrome");
    expect(browser?.serviceName).toBe("neko");
  });

  it("should return undefined for unknown ID", () => {
    const browser = getBrowserSidecar("nonexistent-browser");
    expect(browser).toBeUndefined();
  });

  it("should include experimental sidecars in lookup", () => {
    const firefox = getBrowserSidecar("neko-firefox");
    expect(firefox).toBeDefined();
    expect(firefox?.experimental).toBe(true);
  });
});

describe("materializeServices", () => {
  it("should copy local service fragments to destination", async () => {
    const repoRoot = tmpDir;
    const servicesDir = path.join(repoRoot, "services", "redis");
    await fs.outputFile(
      path.join(servicesDir, "docker-compose.redis.yml"),
      "services:\n  redis:\n    image: redis:7\n"
    );
    await fs.outputFile(
      path.join(servicesDir, "README.md"),
      "# Redis Service"
    );

    const dest = path.join(tmpDir, "output");
    await materializeServices({
      services: ["redis"],
      destination: dest,
      repoRoot,
    });

    expect(await fs.pathExists(path.join(dest, "redis", "docker-compose.redis.yml"))).toBe(true);
    expect(await fs.pathExists(path.join(dest, "redis", "README.md"))).toBe(true);
  });

  it("should fetch remote fragments when fetchIfMissing is true", async () => {
    const repoRoot = path.join(tmpDir, "empty-repo");
    await fs.ensureDir(repoRoot);

    // Mock fetch to return service files
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "services:\n  supabase:\n    image: supabase/postgres\n",
      })
      .mockResolvedValueOnce({ ok: false }) // README not found
      .mockResolvedValueOnce({ ok: false }) // .env.example not found
    );

    const dest = path.join(tmpDir, "fetched");
    await materializeServices({
      services: ["supabase"],
      destination: dest,
      repoRoot,
      fetchIfMissing: true,
      fetchRef: "main",
    });

    expect(await fs.pathExists(path.join(dest, "supabase"))).toBe(true);
  });

  it("should throw error when service not found and fetchIfMissing is false", async () => {
    await expect(async () => {
      await materializeServices({
        services: ["nonexistent"],
        destination: path.join(tmpDir, "dest"),
        repoRoot: tmpDir,
        fetchIfMissing: false,
      });
    }).rejects.toThrow(/Service fragment 'nonexistent' not found/);
  });

  it("should handle searchRoots fallback", async () => {
    const altRoot = path.join(tmpDir, "alt-services");
    await fs.outputFile(
      path.join(altRoot, "custom-svc", "docker-compose.custom-svc.yml"),
      "services:\n  custom:\n    image: custom:latest\n"
    );

    const dest = path.join(tmpDir, "search-output");
    await materializeServices({
      services: ["custom-svc"],
      destination: dest,
      repoRoot: tmpDir,
      searchRoots: [altRoot],
    });

    expect(await fs.pathExists(path.join(dest, "custom-svc", "docker-compose.custom-svc.yml"))).toBe(true);
  });

  it("should skip materialization when services array is empty", async () => {
    const dest = path.join(tmpDir, "should-not-exist");

    await materializeServices({
      services: [],
      destination: dest,
      repoRoot: tmpDir,
    });

    // Destination should not be created for empty services
    expect(await fs.pathExists(dest)).toBe(false);
  });
});

describe("fetchRemoteFragment", () => {
  it("should throw error when no compose file found remotely", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    // Note: fetchRemoteFragment is not exported, test via materializeServices
    await expect(async () => {
      await materializeServices({
        services: ["missing-remote"],
        destination: path.join(tmpDir, "dest"),
        repoRoot: tmpDir,
        fetchIfMissing: true,
        fetchRef: "main",
      });
    }).rejects.toThrow(/Service fragment 'missing-remote' not found remotely/);
  });
});

describe("listServiceDirs", () => {
  it("should list service directories", async () => {
    const baseDir = path.join(tmpDir, "services");
    await fs.ensureDir(path.join(baseDir, "redis"));
    await fs.ensureDir(path.join(baseDir, "kafka"));
    await fs.outputFile(path.join(baseDir, "readme.txt"), "not a dir");

    const dirs = await listServiceDirs(baseDir);

    expect(dirs).toEqual(expect.arrayContaining(["redis", "kafka"]));
    expect(dirs).not.toContain("readme.txt");
    expect(dirs).toHaveLength(2);
  });

  it("should return empty array when directory does not exist", async () => {
    const dirs = await listServiceDirs(path.join(tmpDir, "nonexistent"));
    expect(dirs).toEqual([]);
  });

  it("should return sorted list", async () => {
    const baseDir = path.join(tmpDir, "svc");
    await fs.ensureDir(path.join(baseDir, "zulu"));
    await fs.ensureDir(path.join(baseDir, "alpha"));
    await fs.ensureDir(path.join(baseDir, "beta"));

    const dirs = await listServiceDirs(baseDir);
    expect(dirs).toEqual(["alpha", "beta", "zulu"]);
  });
});
```

**Coverage Target:** 5 existing + 16 new = **21 tests** (~85% coverage)

---

### 3. `stacks.spec.ts` - Expand to 80%+ Coverage

**Add the following test cases:**

#### **Test Suite: Port Parsing & Allocation (add 12 new tests)**

```typescript
describe("parsePort edge cases", () => {
  // Note: parsePort is not exported, test via allocateBrowserPorts or indirectly

  it("should parse port from number", () => {
    // Test via port collection in compose/devcontainer
  });

  it("should parse port from string '8080'", () => {
    // Create devcontainer with forwardPorts: ["8080"]
  });

  it("should parse port from object { port: 3000 }", () => {
    // Create compose with ports: [{ published: 3000, target: 3000 }]
  });

  it("should return null for invalid port values", () => {
    // Test with forwardPorts: ["invalid", null, {}, []]
  });
});

describe("allocateBrowserPorts - multiple browsers", () => {
  it("should reassign conflicting ports for 3+ browsers", async () => {
    const repoRoot = tmpDir;

    // Create template with port 8080 already used
    const templateDir = path.join(repoRoot, "templates", "multi-browser", ".template");
    await fs.outputFile(
      path.join(templateDir, "docker-compose.yml"),
      `services:
  devcontainer:
    image: dev/base
    ports:
      - "8080:8080"
      - "8081:8081"
      - "6901:6901"
`
    );
    await fs.outputJson(
      path.join(templateDir, ".devcontainer", "devcontainer.json"),
      { forwardPorts: [8080, 8081, 6901] }
    );

    // All three browsers want the same ports
    const browsers: BrowserSidecar[] = [
      {
        id: "browser1",
        label: "Browser 1",
        templatePath: "sidecars/b1/.template",
        serviceName: "b1",
        ports: [8080],
        portLabels: { 8080: { label: "B1", onAutoForward: "openBrowser" } },
      },
      {
        id: "browser2",
        label: "Browser 2",
        templatePath: "sidecars/b2/.template",
        serviceName: "b2",
        ports: [8080, 8081],
        portLabels: {
          8080: { label: "B2-UI", onAutoForward: "openBrowser" },
          8081: { label: "B2-API", onAutoForward: "silent" },
        },
      },
      {
        id: "browser3",
        label: "Browser 3",
        templatePath: "sidecars/b3/.template",
        serviceName: "b3",
        ports: [6901],
        portLabels: { 6901: { label: "B3", onAutoForward: "openBrowser" } },
      },
    ];

    // Create sidecar templates
    for (const browser of browsers) {
      await fs.outputFile(
        path.join(repoRoot, browser.templatePath, "docker-compose.yml"),
        `services:\n  ${browser.serviceName}:\n    image: test\n    ports:\n${browser.ports.map(p => `      - "${p}:${p}"`).join("\n")}\n`
      );
      await fs.outputJson(
        path.join(repoRoot, browser.templatePath, ".devcontainer", "devcontainer.json"),
        { runServices: [browser.serviceName] }
      );
    }

    const outDir = path.join(tmpDir, "multi-out");
    await generateStackTemplate({
      repoRoot,
      templateId: "multi-browser",
      outDir,
      browsers,
      force: true,
    });

    const composeContent = await fs.readFile(path.join(outDir, "docker-compose.yml"), "utf8");
    const devcontainer = await fs.readJson(path.join(outDir, ".devcontainer", "devcontainer.json"));

    // Verify all browsers have unique ports (reassigned to 45000+ range)
    expect(composeContent).toMatch(/45000/);
    expect(composeContent).toMatch(/45001/);
    expect(devcontainer.forwardPorts.length).toBeGreaterThan(3);
  });

  it("should throw error when port pool is exhausted", async () => {
    // Create scenario with 5000+ browsers to exhaust 45000-49999 range
    // (Simplified: mock the allocation to simulate exhaustion)
  });
});

describe("YAML comment preservation", () => {
  it("should preserve inline comments in docker-compose.yml", async () => {
    const repoRoot = tmpDir;
    const templateDir = path.join(repoRoot, "templates", "comments", ".template");

    await fs.outputFile(
      path.join(templateDir, "docker-compose.yml"),
      `services:
  devcontainer:
    image: dev/base
    # Main application port
    ports:
      - "3000:3000"  # HTTP server

  # Database service
  postgres:
    image: postgres:15
    # PostgreSQL default port
    ports:
      - "5432:5432"
`
    );
    await fs.outputJson(
      path.join(templateDir, ".devcontainer", "devcontainer.json"),
      { forwardPorts: [3000] }
    );

    const browser: BrowserSidecar = {
      id: "test",
      label: "Test",
      templatePath: "sidecars/test/.template",
      serviceName: "test-svc",
      ports: [9000],
      portLabels: { 9000: { label: "Test", onAutoForward: "openBrowser" } },
    };

    await fs.outputFile(
      path.join(repoRoot, browser.templatePath, "docker-compose.yml"),
      `services:
  test-svc:
    image: test
    # Test browser port
    ports:
      - "9000:9000"
`
    );
    await fs.outputJson(
      path.join(repoRoot, browser.templatePath, ".devcontainer", "devcontainer.json"),
      { runServices: ["test-svc"] }
    );

    const outDir = path.join(tmpDir, "comments-out");
    await generateStackTemplate({
      repoRoot,
      templateId: "comments",
      outDir,
      browsers: [browser],
      force: true,
    });

    const merged = await fs.readFile(path.join(outDir, "docker-compose.yml"), "utf8");

    expect(merged).toContain("# Main application port");
    expect(merged).toContain("# HTTP server");
    expect(merged).toContain("# Database service");
    expect(merged).toContain("# Test browser port");
  });
});

describe("Template placeholder handling", () => {
  it("should parse and preserve mustache placeholders", async () => {
    const content = JSON.stringify({
      name: "{{PROJECT_NAME}}",
      version: "{{VERSION}}",
      nested: {
        key: "{{NESTED_VALUE}}",
      },
    }, null, 2);

    // Test parseDevcontainerTemplate (may need to export for testing)
    // Or test via generateStack with variables

    const result = await generateStack({
      template: "placeholder-test",
      variables: {
        PROJECT_NAME: "My Project",
        VERSION: "1.0.0",
      },
    });

    // Verify placeholders were preserved in output
  });

  it("should handle quoted vs unquoted placeholders", async () => {
    // "{{TOKEN}}" vs {{TOKEN}}
  });
});

describe("Template sections handling", () => {
  it("should preserve conditional sections", async () => {
    // Test {{#templateOption.usePrebuiltImage}}...{{/templateOption.usePrebuiltImage}}

    const repoRoot = tmpDir;
    const templateDir = path.join(repoRoot, "templates", "sections", ".template");

    await fs.outputFile(
      path.join(templateDir, ".devcontainer", "devcontainer.json"),
      `{
  "name": "Test",
  {{#templateOption.usePrebuiltImage}}
  "image": "ghcr.io/airnub-labs/devcontainer-images/dev-web:latest",
  {{/templateOption.usePrebuiltImage}}
  {{^templateOption.usePrebuiltImage}}
  "build": {
    "dockerfile": "Dockerfile"
  },
  {{/templateOption.usePrebuiltImage}}
  "forwardPorts": []
}`
    );
    await fs.outputFile(
      path.join(templateDir, "docker-compose.yml"),
      "services:\n  devcontainer:\n    image: base\n"
    );

    const outDir = path.join(tmpDir, "sections-out");
    await generateStackTemplate({
      repoRoot,
      templateId: "sections",
      outDir,
      browsers: [],
      force: true,
      preserveTemplateSections: true,
    });

    const devcontainer = await fs.readFile(
      path.join(outDir, ".devcontainer", "devcontainer.json"),
      "utf8"
    );

    expect(devcontainer).toContain("{{#templateOption.usePrebuiltImage}}");
    expect(devcontainer).toContain("{{^templateOption.usePrebuiltImage}}");
  });
});

describe("Feature merging", () => {
  it("should merge features from input and template", async () => {
    const result = await generateStack({
      template: "web",
      features: [
        "ghcr.io/airnub-labs/devcontainer-features/deno:1",
        "ghcr.io/airnub-labs/devcontainer-features/cursor-ai:1",
      ],
    });

    expect(result.plan.files.some(f => f.path === ".devcontainer/devcontainer.json")).toBe(true);
    // Verify features are sorted and merged
  });

  it("should deduplicate features", async () => {
    // Template already has chrome-cdp, add chrome-cdp again
  });

  it("should sort features alphabetically", async () => {
    const result = await generateStack({
      template: "web",
      features: [
        "ghcr.io/z-feature:1",
        "ghcr.io/a-feature:1",
        "ghcr.io/m-feature:1",
      ],
    });

    // Extract features from plan and verify order
  });
});

describe("Preset image handling", () => {
  it("should replace build config with preset image", async () => {
    const result = await generateStack({
      template: "web",
      preset: "ghcr.io/airnub-labs/devcontainer-images/lesson-ai:1.0.0",
    });

    expect(result.plan.notes.some(n => n.includes("removing local build"))).toBe(true);
  });

  it("should remove image when preset is empty string", async () => {
    const result = await generateStack({
      template: "web",
      preset: "",
    });

    // Verify image field is removed
  });
});

describe("Insert files with mode preservation", () => {
  it("should insert custom files and preserve executable mode", async () => {
    const result = await generateStack({
      template: "web",
      inserts: [
        {
          path: "scripts/setup.sh",
          content: "#!/bin/bash\necho 'Setup complete'",
          mode: 0o755,
        },
        {
          path: "docs/guide.md",
          content: "# Guide\n\nWelcome!",
        },
      ],
    });

    expect(result.files?.get("scripts/setup.sh")).toBeDefined();
    const scriptBuffer = result.files?.get("scripts/setup.sh") as Buffer & { _mode?: number };
    expect(scriptBuffer?._mode).toBe(0o755);
  });

  it("should mark insert operations correctly", async () => {
    const result = await generateStack({
      template: "web",
      inserts: [
        { path: "new-file.txt", content: "new" },
        { path: ".devcontainer/devcontainer.json", content: "{}" }, // Overwrite existing
      ],
    });

    expect(result.plan.files.find(f => f.path === "new-file.txt")?.op).toBe("create");
    expect(result.plan.files.find(f => f.path === ".devcontainer/devcontainer.json")?.op).toBe("update");
  });
});

describe("Error handling", () => {
  it("should throw error when template does not exist", async () => {
    await expect(async () => {
      await generateStack({
        template: "nonexistent-template",
      });
    }).rejects.toThrow(/Template 'nonexistent-template' not found/);
  });

  it("should throw error for unknown browser ID", async () => {
    await expect(async () => {
      await generateStack({
        template: "web",
        browsers: ["unknown-browser"],
      });
    }).rejects.toThrow(/Unknown browser sidecar: unknown-browser/);
  });

  it("should throw error for experimental browser without flag", async () => {
    await expect(async () => {
      await generateStack({
        template: "web",
        browsers: ["neko-firefox"],
        allowExperimental: false,
      });
    }).rejects.toThrow(/experimental.*--include-experimental/);
  });

  it("should handle malformed docker-compose.yml in template", async () => {
    const repoRoot = tmpDir;
    const templateDir = path.join(repoRoot, "templates", "malformed", ".template");

    await fs.outputFile(
      path.join(templateDir, "docker-compose.yml"),
      "services:\n  invalid yaml: [unclosed"
    );
    await fs.outputJson(
      path.join(templateDir, ".devcontainer", "devcontainer.json"),
      {}
    );

    await expect(async () => {
      process.env.AIRNUB_CATALOG_ROOT = repoRoot;
      await generateStack({ template: "malformed" });
    }).rejects.toThrow(/Failed to parse/);
    delete process.env.AIRNUB_CATALOG_ROOT;
  });
});

describe("parseBrowserSelection", () => {
  it("should parse CSV browser list", () => {
    const selected = parseBrowserSelection({
      withBrowsersCsv: "neko-chrome,kasm-chrome",
    });

    expect(selected).toHaveLength(2);
    expect(selected.map(b => b.id)).toEqual(["neko-chrome", "kasm-chrome"]);
  });

  it("should parse array browser list", () => {
    const selected = parseBrowserSelection({
      withBrowser: ["neko-chrome", "kasm-chrome"],
    });

    expect(selected).toHaveLength(2);
  });

  it("should deduplicate browsers", () => {
    const selected = parseBrowserSelection({
      withBrowsersCsv: "neko-chrome,neko-chrome",
      withBrowser: ["neko-chrome"],
    });

    expect(selected).toHaveLength(1);
  });

  it("should throw for unknown browser", () => {
    expect(() => {
      parseBrowserSelection({ withBrowser: ["fake-browser"] });
    }).toThrow(/Unknown browser sidecar/);
  });

  it("should throw for experimental without flag", () => {
    expect(() => {
      parseBrowserSelection({
        withBrowser: ["neko-firefox"],
        includeExperimental: false,
      });
    }).toThrow(/experimental.*--include-experimental/);
  });
});

describe("Merge warnings", () => {
  it("should warn on containerEnv conflicts", async () => {
    // Create template with NEXT_PUBLIC_API_URL="http://localhost:3000"
    // Add browser with same env var but different value
    // Verify warning is in plan.notes
  });

  it("should warn on default credentials", async () => {
    // Add browser with default password in containerEnv
    // Verify warning about overriding before sharing workspace
  });

  it("should warn on missing required env vars", async () => {
    // Add browser with requiredEnv: ["SECRET_KEY"]
    // Don't provide SECRET_KEY in containerEnv
    // Verify warning
  });
});

describe("Dry run mode", () => {
  it("should return plan without files in dry run", async () => {
    const result = await generateStack({
      template: "web",
      dryRun: true,
    });

    expect(result.plan).toBeDefined();
    expect(result.files).toBeUndefined();
  });

  it("should return files when not dry run", async () => {
    const result = await generateStack({
      template: "web",
      dryRun: false,
    });

    expect(result.plan).toBeDefined();
    expect(result.files).toBeDefined();
    expect(result.files?.size).toBeGreaterThan(0);
  });
});
```

**Coverage Target:** 2 existing + 30+ new = **32+ tests** (~85% coverage)

---

## Implementation Guidelines

### Code Quality Standards

1. **Test Independence:** Each test must be fully isolated
   - Use `beforeEach` to create fresh temp directories
   - Use `afterEach` to clean up (`fs.remove`, `vi.restoreAllMocks()`)
   - Never rely on test execution order

2. **Meaningful Assertions:**
   - Avoid trivial assertions like `expect(result).toBeDefined()`
   - Test actual values: `expect(sha).toBe("b94d27b9934d3e08...")`
   - Use specific error message matchers: `toThrow(/expected regex/)`

3. **Edge Cases First:**
   - Prioritize error paths and edge cases (null, empty, malformed data)
   - Test boundary conditions (empty files, large files, 0 ports, 65535 ports)
   - Test concurrent scenarios (cache collisions, race conditions)

4. **Mock External Dependencies:**
   - Mock `fetch` for network calls
   - Mock `discoverCatalogRoot` for deterministic local discovery
   - Use `vi.stubGlobal()` for global replacements

5. **Readable Test Names:**
   - Use descriptive names: `"should throw error when SHA256 file has invalid format"`
   - Follow pattern: `"should [expected behavior] when [condition]"`

6. **DRY Test Fixtures:**
   - Create reusable helper functions for common setups:
     ```typescript
     async function createMockTemplate(repoRoot: string, id: string) {
       const templateDir = path.join(repoRoot, "templates", id, ".template");
       await fs.outputFile(...);
       await fs.outputJson(...);
       return templateDir;
     }
     ```

---

## Success Criteria

### Coverage Metrics (Run `npm run test:coverage`)

```bash
# Target coverage for each file:
catalog.ts:   ✅ 85%+ (Statements, Branches, Functions, Lines)
services.ts:  ✅ 85%+ (Statements, Branches, Functions, Lines)
stacks.ts:    ✅ 85%+ (Statements, Branches, Functions, Lines)
```

### Test Suite Health
- ✅ All tests pass (`npm run test`)
- ✅ No flaky tests (run 10 times: `npm run test -- --run --reporter=verbose --repeat=10`)
- ✅ Fast execution (<30 seconds for full suite)
- ✅ No hanging processes (proper cleanup in `afterEach`)

### Code Review Checklist
- ✅ Every public function has at least 2 test cases (happy path + error)
- ✅ Complex functions (`allocateBrowserPorts`, `mergeComposeDocument`) have 5+ tests
- ✅ Edge cases documented in test names
- ✅ Mocks are verified (`expect(fetchMock).toHaveBeenCalledWith(...)`)
- ✅ Temp directories cleaned up (no `/tmp` pollution)

---

## Deliverables

### Files to Modify

1. **`tools/airnub-devc/src/lib/__tests__/catalog.spec.ts`**
   - Add 9 new test cases
   - Target: 17 total tests, 85%+ coverage

2. **`tools/airnub-devc/src/lib/__tests__/services.spec.ts`**
   - Add 16 new test cases
   - Target: 21 total tests, 85%+ coverage

3. **`tools/airnub-devc/src/lib/__tests__/stacks.spec.ts`**
   - Add 30+ new test cases
   - Target: 32+ total tests, 85%+ coverage

### Final Validation

Run the following commands to validate implementation:

```bash
# 1. Run all tests
cd tools/airnub-devc
npm run test

# 2. Generate coverage report
npm run test:coverage

# 3. Verify coverage thresholds (should be in package.json)
# Add to package.json if missing:
{
  "vitest": {
    "coverage": {
      "thresholds": {
        "src/lib/catalog.ts": { "lines": 85, "functions": 85, "branches": 85, "statements": 85 },
        "src/lib/services.ts": { "lines": 85, "functions": 85, "branches": 85, "statements": 85 },
        "src/lib/stacks.ts": { "lines": 85, "functions": 85, "branches": 85, "statements": 85 }
      }
    }
  }
}

# 4. Run linter
npm run lint

# 5. Verify no regressions in existing functionality
npm run build
```

---

## Example Test Template (Copy-Paste Ready)

```typescript
describe("FunctionName", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-"));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
    vi.restoreAllMocks();
  });

  it("should handle happy path", async () => {
    // Arrange
    const input = "test-data";

    // Act
    const result = await functionUnderTest(input);

    // Assert
    expect(result).toBe("expected-output");
  });

  it("should throw error when input is invalid", async () => {
    await expect(async () => {
      await functionUnderTest(null);
    }).rejects.toThrow(/Invalid input/);
  });
});
```

---

## Notes for the Agent

### What NOT to Do
- ❌ Don't create new files outside of `__tests__/` directories
- ❌ Don't modify source code in `catalog.ts`, `services.ts`, `stacks.ts` (only add tests)
- ❌ Don't skip edge cases or error handling tests
- ❌ Don't use `any` types in test code
- ❌ Don't leave console.log() statements in tests

### What TO Do
- ✅ Use TypeScript strict mode in tests
- ✅ Import types from source files: `import type { CatalogContext } from "../catalog.js"`
- ✅ Use async/await consistently (no promise chains)
- ✅ Group related tests in `describe` blocks
- ✅ Add comments for non-obvious test logic
- ✅ Verify mocks were called with correct arguments
- ✅ Test both success and failure paths for each function

---

## Questions to Clarify Before Starting

If you encounter ambiguity, consider these scenarios:

1. **Should I export internal functions for testing?**
   - Prefer testing via public APIs when possible
   - If a complex internal function needs direct testing, export it with a `/** @internal */` JSDoc comment

2. **How should I handle async race conditions in tests?**
   - Use `vi.useFakeTimers()` for time-based operations
   - Use proper async/await patterns (no floating promises)

3. **What if a test requires network access?**
   - Mock all network calls with `vi.stubGlobal("fetch", mockFn)`
   - Never make real HTTP requests in tests

4. **How to test cache invalidation?**
   - Manipulate filesystem directly in tests
   - Write invalid checksums, delete files, corrupt JSON

---

## Final Checklist

Before marking this task complete, verify:

- [ ] All 3 test files have 80%+ coverage (run `npm run test:coverage`)
- [ ] All tests pass (`npm run test`)
- [ ] No flaky tests (run suite 10 times)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Temp directories are cleaned up (check `/tmp` after tests)
- [ ] Mocks are restored in `afterEach`
- [ ] Test names are descriptive and follow conventions
- [ ] Edge cases and error paths are tested
- [ ] Code is documented with JSDoc comments where needed

---

## Context for the Agent

This is a high-impact task for the **Airnub DevContainers Catalog** project, which powers classroom-first development environments. The three files you're testing form the **core engine** of the CLI:

- **catalog.ts:** Ensures users get the right version of the catalog (local or remote)
- **services.ts:** Manages optional services (databases, browsers, tools)
- **stacks.ts:** Generates complete dev container stacks with zero-conflict port allocation

**Why this matters:** Educators depend on this CLI to generate reproducible environments for students. Bugs in these modules could result in broken classrooms, port conflicts, or security issues (exposed secrets, missing checksums). Your tests will prevent regressions and enable confident refactoring.

**Current state:** The project has ~10% test coverage. Your work will bring critical modules to 85%+, setting a standard for the rest of the codebase.

---

## Resources

- **Vitest Docs:** https://vitest.dev/guide/
- **Test Files Location:** `/home/user/devcontainers-catalog/tools/airnub-devc/src/lib/__tests__/`
- **Source Files:** `/home/user/devcontainers-catalog/tools/airnub-devc/src/lib/`
- **Run Tests:** `cd tools/airnub-devc && npm run test`
- **Coverage Report:** `npm run test:coverage`

---

**Good luck! Let's build bulletproof test coverage for the Airnub DevContainers Catalog. 🚀**
