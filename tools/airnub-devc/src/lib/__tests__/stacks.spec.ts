import os from "os";
import path from "path";
import fs from "fs-extra";
import YAML from "yaml";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";

import { generateStackTemplate, generateStack, parseBrowserSelection } from "../stacks.js";
import { BrowserSidecar } from "../services.js";

const BASE_TEMPLATE_ID = "demo-stack";

async function writeFile(relative: string, content: string) {
  await fs.outputFile(relative, content, "utf8");
}

async function setupBaseRepository() {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stack-repo-"));
  const outDir = path.join(repoRoot, "generated");

  const templateBase = path.join(repoRoot, "templates", BASE_TEMPLATE_ID, ".template");
  await writeFile(
    path.join(templateBase, "docker-compose.yml"),
    [
      "services:",
      "  devcontainer:",
      "    image: dev/base",
      "    ports:",
      "      - \"3000:3000\"",
      "",
      "  # Existing API service should be preserved",
      "  api:",
      "    image: dev/api",
      "    ports:",
      "      - \"4000:4000\"",
      "",
      "volumes:",
      "  data: {}",
    ].join("\n"),
  );

  await writeFile(
    path.join(templateBase, ".devcontainer", "devcontainer.json"),
    JSON.stringify(
      {
        name: "Demo",
        forwardPorts: [3000],
        portsAttributes: {
          3000: { label: "App", onAutoForward: "openBrowser" },
        },
        containerEnv: {
          NEXT_DEV_PORT: "3000",
        },
      },
      null,
      2,
    ),
  );

  const browserTemplate = path.join(repoRoot, "sidecars", "browser", ".template");
  await writeFile(
    path.join(browserTemplate, "docker-compose.yml"),
    [
      "services:",
      "  # Browser sidecar comment should survive merge",
      "  browser:",
      "    image: test/browser:latest",
      "    ports:",
      "      - \"3000:3000\"",
      "      - \"59000:59000/tcp\"",
      "    volumes:",
      "      - browser-data:/data",
      "",
      "volumes:",
      "  browser-data: {}",
    ].join("\n"),
  );

  await writeFile(
    path.join(browserTemplate, ".devcontainer", "devcontainer.json"),
    JSON.stringify(
      {
        forwardPorts: [3000, 59000],
        portsAttributes: {
          3000: { label: "Browser UI", onAutoForward: "openBrowser" },
          59000: { label: "Browser TCP", onAutoForward: "silent" },
        },
        containerEnv: {
          TEST_BROWSER_PASSWORD: "student",
        },
        runServices: ["browser"],
      },
      null,
      2,
    ),
  );

  return { repoRoot, outDir };
}

describe("generateStackTemplate", () => {
  let repoRoot: string;
  let outDir: string;

  beforeEach(async () => {
    ({ repoRoot, outDir } = await setupBaseRepository());
  });

  afterEach(async () => {
    await fs.remove(repoRoot);
    vi.restoreAllMocks();
  });

  it("merges browser services, reassigns ports, and preserves comments", async () => {
    const browser: BrowserSidecar = {
      id: "neko-chrome",
      label: "Test Browser",
      templatePath: "sidecars/browser/.template",
      serviceName: "browser",
      ports: [3000, 59000],
      portLabels: {
        3000: { label: "Browser UI", onAutoForward: "openBrowser" },
        59000: { label: "Browser TCP", onAutoForward: "silent" },
      },
      requiredEnv: ["TEST_BROWSER_PASSWORD"],
      notes: ["Browser sidecar requires TEST_BROWSER_PASSWORD."],
    };

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await generateStackTemplate({
      repoRoot,
      templateId: BASE_TEMPLATE_ID,
      outDir,
      browsers: [browser],
      force: true,
    });

    const composeContent = await fs.readFile(path.join(outDir, "docker-compose.yml"), "utf8");
    expect(composeContent).toContain("# Browser sidecar comment should survive merge");
    expect(composeContent).toMatch(/browser:\s*\n/);
    expect(composeContent).toMatch(/\"45000:3000\"/);
    expect(composeContent).toContain("browser-data:");
    expect(composeContent).toContain("data:");

    const composeDoc = YAML.parse(composeContent) as any;
    expect(composeDoc.services.browser.ports).toContain("45000:3000");
    expect(composeDoc.services.browser.ports).toContain("59000:59000/tcp");

    const devcontainerPath = path.join(outDir, ".devcontainer", "devcontainer.json");
    const devcontainerContent = await fs.readFile(devcontainerPath, "utf8");
    expect(devcontainerContent).not.toContain("{{");
    const devcontainer: any = JSON.parse(devcontainerContent);
    expect(devcontainer.forwardPorts).toEqual(expect.arrayContaining([3000, 45000, 59000]));
    expect(devcontainer.portsAttributes["45000"].label).toBe("Browser UI");
    expect(devcontainer.runServices).toEqual(expect.arrayContaining(["browser"]));

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Test Browser requires environment variables TEST_BROWSER_PASSWORD"),
    );
  });

  it("throws an error when the template directory is missing", async () => {
    await expect(
      generateStackTemplate({
        repoRoot,
        templateId: "missing",
        outDir,
        browsers: [],
      }),
    ).rejects.toThrow(/Template 'missing' not found/);
  });

  it("emits warnings for conflicts, default credentials, and required env", async () => {
    const templateDevcontainerPath = path.join(
      repoRoot,
      "templates",
      BASE_TEMPLATE_ID,
      ".template",
      ".devcontainer",
      "devcontainer.json",
    );
    await writeFile(
      templateDevcontainerPath,
      JSON.stringify(
        {
          name: "Demo",
          containerEnv: {
            TEST_BROWSER_PASSWORD: "override",
          },
        },
        null,
        2,
      ),
    );

    const browserTemplate = path.join(repoRoot, "sidecars", "browser", ".template", ".devcontainer", "devcontainer.json");
    await writeFile(
      browserTemplate,
      JSON.stringify(
        {
          containerEnv: {
            TEST_BROWSER_PASSWORD: "student",
            DEFAULT_PASSWORD: "student",
          },
          requiredEnv: ["ADMIN_TOKEN"],
          runServices: ["browser"],
        },
        null,
        2,
      ),
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const browser: BrowserSidecar = {
      id: "neko-chrome",
      label: "Test Browser",
      templatePath: "sidecars/browser/.template",
      serviceName: "browser",
      ports: [3000],
      portLabels: {
        3000: { label: "Browser UI", onAutoForward: "openBrowser" },
      },
      containerEnv: {
        TEST_BROWSER_PASSWORD: "student",
        DEFAULT_PASSWORD: "student",
      },
      requiredEnv: ["ADMIN_TOKEN"],
    };

    await generateStackTemplate({
      repoRoot,
      templateId: BASE_TEMPLATE_ID,
      outDir,
      browsers: [browser],
      force: true,
    });

    const warnings = warnSpy.mock.calls.flat();
    expect(warnings.join(" ")).toMatch(/containerEnv already defines TEST_BROWSER_PASSWORD/);
    expect(warnings.join(" ")).toMatch(/uses default credential DEFAULT_PASSWORD/);
    expect(warnings.join(" ")).toMatch(/requires environment variables ADMIN_TOKEN/);
  });

  it("preserves template sections when requested", async () => {
    const devcontainerPath = path.join(
      repoRoot,
      "templates",
      BASE_TEMPLATE_ID,
      ".template",
      ".devcontainer",
      "devcontainer.json",
    );
    const templated = `{
  "name": "Demo",
  {{#templateOption.useImage}}
  "image": "ghcr.io/airnub/demo:latest",
  {{/templateOption.useImage}}
  {{^templateOption.useImage}}
  "build": { "dockerfile": "Dockerfile" },
  {{/templateOption.useImage}}
  "forwardPorts": [3000]
}`;
    await writeFile(devcontainerPath, templated);

    const browser: BrowserSidecar = {
      id: "neko-chrome",
      label: "Test Browser",
      templatePath: "sidecars/browser/.template",
      serviceName: "browser",
      ports: [3000],
      portLabels: { 3000: { label: "Browser", onAutoForward: "openBrowser" } },
    };

    await generateStackTemplate({
      repoRoot,
      templateId: BASE_TEMPLATE_ID,
      outDir,
      browsers: [browser],
      force: true,
      preserveTemplateSections: true,
    });

    const output = await fs.readFile(path.join(outDir, ".devcontainer", "devcontainer.json"), "utf8");
    expect(output).toContain("{{#templateOption.useImage}}");
    expect(output).toContain("{{/templateOption.useImage}}");
    expect(output).toContain("{{^templateOption.useImage}}");
  });

  it("produces a merge plan and scaffolding when using the SDK", async () => {
    const browser: BrowserSidecar = {
      id: "neko-chrome",
      label: "Test Browser",
      templatePath: "sidecars/browser/.template",
      serviceName: "browser",
      ports: [3000, 59000],
      portLabels: {
        3000: { label: "Browser UI", onAutoForward: "openBrowser" },
        59000: { label: "Browser TCP", onAutoForward: "silent" },
      },
      requiredEnv: ["TEST_BROWSER_PASSWORD"],
    };

    process.env.AIRNUB_CATALOG_ROOT = repoRoot;
    try {
      const dryRun = await generateStack({
        template: BASE_TEMPLATE_ID,
        browsers: [browser.id],
        semverLock: true,
        dryRun: true,
      });

      expect(dryRun.plan.files.some((file) => file.path === ".vscode/walkthroughs.json")).toBe(true);
      expect(dryRun.plan.files.some((file) => file.path === "lesson.json")).toBe(true);
      expect(dryRun.plan.files.some((file) => file.path === ".comhra/lesson.gen.json")).toBe(true);
      expect(dryRun.plan.ports.find((entry) => entry.port === 45000)).toBeDefined();
      expect(
        dryRun.plan.notes.some((note) => note.includes("requires environment variables TEST_BROWSER_PASSWORD")),
      ).toBe(true);

      const full = await generateStack({
        template: BASE_TEMPLATE_ID,
        browsers: [browser.id],
        semverLock: true,
      });

      expect(full.files?.get(".vscode/walkthroughs.json")).toBeInstanceOf(Buffer);
      const postCreate = full.files?.get(".devcontainer/postCreate.sh") as Buffer & { _mode?: number } | undefined;
      expect(postCreate?._mode).toBeDefined();
    } finally {
      delete process.env.AIRNUB_CATALOG_ROOT;
    }
  });
});

describe("generateStack (SDK)", () => {
  let repoRoot: string;

  beforeEach(async () => {
    ({ repoRoot } = await setupBaseRepository());
  });

  afterEach(async () => {
    await fs.remove(repoRoot);
  });

  it("merges features with deduplication and sorting", async () => {
    const devcontainerPath = path.join(
      repoRoot,
      "templates",
      BASE_TEMPLATE_ID,
      ".template",
      ".devcontainer",
      "devcontainer.json",
    );
    await writeFile(
      devcontainerPath,
      JSON.stringify(
        {
          name: "Demo",
          features: {
            "ghcr.io/airnub-labs/devcontainer-features/node:1": {},
            "ghcr.io/airnub-labs/devcontainer-features/chrome-cdp:1": {},
          },
        },
        null,
        2,
      ),
    );

    process.env.AIRNUB_CATALOG_ROOT = repoRoot;
    try {
      const result = await generateStack({
        template: BASE_TEMPLATE_ID,
        features: [
          "ghcr.io/airnub-labs/devcontainer-features/chrome-cdp:1",
          "ghcr.io/airnub-labs/devcontainer-features/python:1",
        ],
      });

      const devcontainerBuffer = result.files?.get(".devcontainer/devcontainer.json");
      expect(devcontainerBuffer).toBeInstanceOf(Buffer);
      const devcontainer = JSON.parse(devcontainerBuffer!.toString("utf8"));
      const featureKeys = Object.keys(devcontainer.features);
      expect(featureKeys).toEqual([
        "ghcr.io/airnub-labs/devcontainer-features/chrome-cdp:1",
        "ghcr.io/airnub-labs/devcontainer-features/node:1",
        "ghcr.io/airnub-labs/devcontainer-features/python:1",
      ]);
    } finally {
      delete process.env.AIRNUB_CATALOG_ROOT;
    }
  });

  it("replaces the build configuration when a preset image is provided", async () => {
    const devcontainerPath = path.join(
      repoRoot,
      "templates",
      BASE_TEMPLATE_ID,
      ".template",
      ".devcontainer",
      "devcontainer.json",
    );
    await writeFile(
      devcontainerPath,
      JSON.stringify(
        {
          build: { dockerfile: "Dockerfile" },
        },
        null,
        2,
      ),
    );

    process.env.AIRNUB_CATALOG_ROOT = repoRoot;
    try {
      const result = await generateStack({
        template: BASE_TEMPLATE_ID,
        preset: "ghcr.io/airnub/devcontainer-images/demo:1.0.0",
      });

      expect(result.plan.notes.some((note) => note.includes("removing local build"))).toBe(true);
      const devcontainer = JSON.parse(
        result.files?.get(".devcontainer/devcontainer.json")?.toString("utf8") ?? "{}",
      );
      expect(devcontainer.image).toBe("ghcr.io/airnub/devcontainer-images/demo:1.0.0");
      expect(devcontainer).not.toHaveProperty("build");
    } finally {
      delete process.env.AIRNUB_CATALOG_ROOT;
    }
  });

  it("removes the image when preset is an empty string", async () => {
    const devcontainerPath = path.join(
      repoRoot,
      "templates",
      BASE_TEMPLATE_ID,
      ".template",
      ".devcontainer",
      "devcontainer.json",
    );
    await writeFile(
      devcontainerPath,
      JSON.stringify(
        {
          image: "ghcr.io/airnub/base:latest",
        },
        null,
        2,
      ),
    );

    process.env.AIRNUB_CATALOG_ROOT = repoRoot;
    try {
      const result = await generateStack({ template: BASE_TEMPLATE_ID, preset: "" });
      const devcontainer = JSON.parse(
        result.files?.get(".devcontainer/devcontainer.json")?.toString("utf8") ?? "{}",
      );
      expect(devcontainer).not.toHaveProperty("image");
    } finally {
      delete process.env.AIRNUB_CATALOG_ROOT;
    }
  });

  it("preserves file modes for inserted files", async () => {
    process.env.AIRNUB_CATALOG_ROOT = repoRoot;
    try {
      const result = await generateStack({
        template: BASE_TEMPLATE_ID,
        inserts: [
          { path: "scripts/setup.sh", content: "#!/bin/bash\necho ok", mode: 0o755 },
          { path: "docs/guide.md", content: "# Guide" },
        ],
      });

      const script = result.files?.get("scripts/setup.sh") as Buffer & { _mode?: number } | undefined;
      expect(script?._mode).toBe(0o755);
      expect(result.plan.files.find((entry) => entry.path === "scripts/setup.sh")?.op).toBe("create");
      expect(result.plan.files.find((entry) => entry.path === "docs/guide.md")?.op).toBe("create");
    } finally {
      delete process.env.AIRNUB_CATALOG_ROOT;
    }
  });

  it("distinguishes between dry-run and full generation", async () => {
    process.env.AIRNUB_CATALOG_ROOT = repoRoot;
    try {
      const dryRun = await generateStack({ template: BASE_TEMPLATE_ID, dryRun: true });
      expect(dryRun.files).toBeUndefined();

      const full = await generateStack({ template: BASE_TEMPLATE_ID });
      expect(full.files?.size).toBeGreaterThan(0);
    } finally {
      delete process.env.AIRNUB_CATALOG_ROOT;
    }
  });

  it("throws for unknown templates", async () => {
    process.env.AIRNUB_CATALOG_ROOT = repoRoot;
    try {
      await expect(generateStack({ template: "missing-template" })).rejects.toThrow(/Template 'missing-template'/);
    } finally {
      delete process.env.AIRNUB_CATALOG_ROOT;
    }
  });

  it("throws when selecting unknown browsers", async () => {
    process.env.AIRNUB_CATALOG_ROOT = repoRoot;
    try {
      await expect(generateStack({ template: BASE_TEMPLATE_ID, browsers: ["unknown-browser"] })).rejects.toThrow(
        /Unknown browser sidecar/,
      );
    } finally {
      delete process.env.AIRNUB_CATALOG_ROOT;
    }
  });

  it("requires explicit opt-in for experimental browsers", async () => {
    process.env.AIRNUB_CATALOG_ROOT = repoRoot;
    try {
      await expect(
        generateStack({ template: BASE_TEMPLATE_ID, browsers: ["neko-firefox"], allowExperimental: false }),
      ).rejects.toThrow(/experimental/);
    } finally {
      delete process.env.AIRNUB_CATALOG_ROOT;
    }
  });

  it("surface errors when the base compose file is invalid", async () => {
    const composePath = path.join(repoRoot, "templates", BASE_TEMPLATE_ID, ".template", "docker-compose.yml");
    await writeFile(composePath, "services:\n  invalid: [");

    process.env.AIRNUB_CATALOG_ROOT = repoRoot;
    try {
      await expect(generateStack({ template: BASE_TEMPLATE_ID })).rejects.toThrow(/Failed to parse base docker-compose.yml/);
    } finally {
      delete process.env.AIRNUB_CATALOG_ROOT;
    }
  });
});

describe("parseBrowserSelection", () => {
  it("parses comma-separated values and arrays", () => {
    const selected = parseBrowserSelection({
      withBrowsersCsv: "neko-chrome, kasm-chrome",
      withBrowser: ["neko-chrome", "kasm-chrome"],
      includeExperimental: true,
    });

    expect(selected.map((browser) => browser.id)).toEqual(["neko-chrome", "kasm-chrome"]);
  });

  it("deduplicates repeated entries", () => {
    const selected = parseBrowserSelection({
      withBrowsersCsv: "neko-chrome,neko-chrome",
      withBrowser: ["neko-chrome"],
      includeExperimental: true,
    });

    expect(selected).toHaveLength(1);
  });

  it("throws for unknown browser identifiers", () => {
    expect(() => parseBrowserSelection({ withBrowser: ["unknown"] })).toThrow(/Unknown browser sidecar/);
  });

  it("requires experimental opt-in", () => {
    expect(() => parseBrowserSelection({ withBrowser: ["neko-firefox"], includeExperimental: false })).toThrow(/experimental/);
  });
});

