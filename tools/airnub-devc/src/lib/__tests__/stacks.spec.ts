import os from "os";
import path from "path";
import fs from "fs-extra";
import YAML from "yaml";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";

import { generateStackTemplate, generateStack } from "../stacks.js";
import { BrowserSidecar } from "../services.js";

const BASE_TEMPLATE_ID = "demo-stack";

async function writeFile(relative: string, content: string) {
  await fs.outputFile(relative, content, "utf8");
}

describe("generateStackTemplate", () => {
  let repoRoot: string;
  let outDir: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stack-repo-"));
    outDir = path.join(repoRoot, "generated");

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
      containerEnv: {
        TEST_BROWSER_PASSWORD: "student",
      },
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
      expect.stringContaining("Test Browser uses default credential TEST_BROWSER_PASSWORD"),
    );
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
      containerEnv: {
        TEST_BROWSER_PASSWORD: "student",
      },
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
      expect(dryRun.plan.notes.some((note) => note.includes("default credential"))).toBe(true);

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

