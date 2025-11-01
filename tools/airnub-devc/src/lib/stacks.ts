import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { fileURLToPath } from "url";
import {
  Document,
  isMap,
  isScalar,
  isSeq,
  parseDocument,
  YAMLMap,
  YAMLSeq,
} from "yaml";
import { discoverCatalogRoot, safeWriteDir } from "./fsutil.js";
import { BROWSER_SIDECARS, BrowserSidecar, getBrowserSidecar } from "./services.js";

function uniq<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function resolveBrowserNotes(browser: BrowserSidecar): string[] {
  const base = [...(browser.notes ?? [])];
  const inCodespaces = process.env.CODESPACES === "true";
  if (inCodespaces) {
    if (browser.compatibility?.codespaces?.notes?.length) {
      base.push(...browser.compatibility.codespaces.notes);
    }
  } else if (browser.compatibility?.local?.notes?.length) {
    base.push(...browser.compatibility.local.notes);
  }
  return base;
}

type Placeholder = {
  token: string;
  original: string;
  quoted: boolean;
};

const RESERVED_PORT_START = 45000;
const RESERVED_PORT_END = 49999;
const DEFAULT_PORT_VISIBILITY = "private" as const;

type FileOperation = {
  op: "create" | "update";
  reason?: string;
};

type FileRecord = {
  content: Buffer;
  mode?: number;
};

/**
 * Describes a file to inject into the generated workspace.
 *
 * @example
 * ```typescript
 * const inserts: RepoInsert[] = [
 *   {
 *     path: "scripts/setup.sh",
 *     content: "#!/bin/bash\\necho 'Hello, student!'",
 *     mode: 0o755
 *   },
 *   {
 *     path: "docs/lesson-plan.md",
 *     content: "# Week 1: Introduction\\n\\nToday we learn..."
 *   }
 * ];
 * ```
 *
 * @public
 */
export type RepoInsert = {
  /**
   * Relative path within the workspace (e.g., "scripts/init.sh").
   * Leading slashes are stripped automatically.
   */
  path: string;

  /**
   * File content as string or Buffer.
   * For binary files, use Buffer.
   */
  content: string | Buffer;

  /**
   * UNIX file mode (permissions) as octal number.
   *
   * @example 0o755 // executable script
   * @example 0o644 // regular file
   * @default 0o644
   */
  mode?: number;
};

/**
 * Describes the file operations, ports, and notes for a stack generation.
 *
 * The plan is returned by {@link generateStack} and provides a detailed
 * overview of what will be created or modified when the stack is materialized.
 *
 * @example
 * ```typescript
 * const { plan } = await generateStack({ template: "web" });
 *
 * console.log("Files:");
 * plan.files.forEach(f => console.log(`  ${f.op}: ${f.path}`));
 *
 * console.log("\nPorts:");
 * plan.ports.forEach(p => console.log(`  ${p.port} (${p.visibility})`));
 *
 * console.log("\nNotes:");
 * plan.notes.forEach(n => console.warn(`  ⚠ ${n}`));
 * ```
 *
 * @public
 */
export type MergePlan = {
  /** List of file operations (create, update, skip). */
  files: Array<{ path: string; op: "create" | "update" | "skip"; reason?: string }>;

  /**
   * Ports to be forwarded by the dev container.
   * Sorted numerically.
   */
  ports: Array<{ port: number; label?: string; visibility?: "private" | "org" | "public" }>;

  /** Services to auto-start via `runServices` in devcontainer.json. */
  runServices: string[];

  /** Environment variables to inject via `containerEnv`. */
  env: Record<string, string>;

  /**
   * Warnings and informational messages about the generation.
   * Common notes include port reassignments and required env vars.
   */
  notes: string[];
};

/**
 * Configuration for generating a dev container stack.
 *
 * This type defines all options available when generating a stack via
 * {@link generateStack}. At minimum, you must provide a `template` ID.
 *
 * @example
 * ```typescript
 * const input: GenerateStackInput = {
 *   template: "nextjs-supabase",
 *   browsers: ["neko-chrome"],
 *   features: ["ghcr.io/airnub-labs/devcontainer-features/cursor-ai:1"],
 *   preset: "ghcr.io/airnub-labs/devcontainer-images/dev-web:latest",
 *   variables: {
 *     PROJECT_NAME: "AI Fundamentals Week 2",
 *     SUPABASE_PROJECT_ID: "abc123"
 *   },
 *   semverLock: true,
 *   dryRun: false,
 *   allowExperimental: false
 * };
 * ```
 *
 * @public
 */
export type GenerateStackInput = {
  /**
   * Template ID from the catalog (e.g., "nextjs-supabase", "web").
   *
   * @example "nextjs-supabase"
   */
  template: string;

  /**
   * Browser sidecar IDs to include (e.g., "neko-chrome", "kasm-chrome").
   * Ports will be automatically reassigned if conflicts occur.
   *
   * @default []
   */
  browsers?: string[];

  /**
   * Additional Dev Container features to install.
   * Must be fully-qualified OCI references.
   *
   * @example ["ghcr.io/airnub-labs/devcontainer-features/deno:1"]
   * @default []
   */
  features?: string[];

  /**
   * Files to inject into the generated workspace.
   * Useful for adding custom scripts, configs, or lesson content.
   *
   * @default []
   */
  inserts?: RepoInsert[];

  /**
   * Prebuilt image reference to use instead of local Dockerfile build.
   * When set to an empty string, removes the image field entirely.
   *
   * @example "ghcr.io/airnub-labs/devcontainer-images/lesson-ai:1.0.0"
   */
  preset?: string | null;

  /** Variables for template placeholder substitution (e.g., {{PROJECT_NAME}}). */
  variables?: Record<string, string>;

  /**
   * Generate a `.comhra.lock.json` file with pinned versions.
   * Recommended for production lesson deployments.
   */
  semverLock?: boolean;

  /** Return only the plan without file buffers (preview mode). */
  dryRun?: boolean;

  /** Allow experimental browser sidecars and features. */
  allowExperimental?: boolean;
};

function replaceMoustachePlaceholders(content: string): { replaced: string; placeholders: Placeholder[] } {
  const placeholders: Placeholder[] = [];
  let replaced = "";
  let lastIndex = 0;
  const regex = /{{[^}]+}}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const start = match.index;
    replaced += content.slice(lastIndex, start);
    const end = regex.lastIndex;
    const preceding = start > 0 ? content[start - 1] : "";
    const following = end < content.length ? content[end] : "";
    const quoted = preceding === '"' && following === '"';
    const token = `__DEVCP_${placeholders.length}__`;
    placeholders.push({ token, original: match[0], quoted });
    if (quoted) {
      replaced += token;
    } else {
      replaced += `"${token}"`;
    }
    lastIndex = end;
  }
  replaced += content.slice(lastIndex);
  return { replaced, placeholders };
}

function restoreSections(json: string): string {
  json = json.replace(
    /  "image": "ghcr\.io\/airnub-labs\/devcontainer-images\/dev-web:latest",\n/g,
    '{{#templateOption.usePrebuiltImage}}\n  "image": "ghcr.io/airnub-labs/devcontainer-images/dev-web:latest",\n{{/templateOption.usePrebuiltImage}}\n',
  );
  json = json.replace(
    /  "build": {\n    "dockerfile": "Dockerfile",\n    "context": "\."\n  },\n/g,
    '{{^templateOption.usePrebuiltImage}}\n  "build": {\n    "dockerfile": "Dockerfile",\n    "context": "."\n  },\n{{/templateOption.usePrebuiltImage}}\n',
  );
  json = json.replace(
    /"ghcr\.io\/airnub-labs\/devcontainer-features\/supabase-cli:1": {\n      "manageLocalStack": true\n    },\n    "ghcr\.io\/airnub-labs\/devcontainer-features\/agent-tooling-clis:1": {}\n  }/g,
    '"ghcr.io/airnub-labs/devcontainer-features/supabase-cli:1": {\n      "manageLocalStack": true\n    }{{#templateOption.includeAgentToolingClis}},\n    "ghcr.io/airnub-labs/devcontainer-features/agent-tooling-clis:1": {}\n    {{/templateOption.includeAgentToolingClis}}\n  }',
  );
  return json;
}

function parseDevcontainerTemplate(content: string): { data: any; placeholders: Placeholder[] } {
  const withoutSections = content.replace(/{{[#/^][^}]+}}/g, "");
  const { replaced, placeholders } = replaceMoustachePlaceholders(withoutSections);
  const data = JSON.parse(replaced);
  return { data, placeholders };
}

function serializeDevcontainerTemplate(
  data: any,
  placeholders: Placeholder[],
  { preserveTemplateSections = false }: { preserveTemplateSections?: boolean } = {},
): string {
  let json = JSON.stringify(data, null, 2);
  if (preserveTemplateSections) {
    for (const placeholder of placeholders) {
      const pattern = new RegExp(`"${placeholder.token}"`, "g");
      if (placeholder.quoted) {
        json = json.replace(pattern, `"${placeholder.original}"`);
      } else {
        json = json.replace(pattern, placeholder.original);
      }
    }
    json = restoreSections(json);
  }
  if (!json.endsWith("\n")) {
    json += "\n";
  }
  return json;
}

function resolveRepoRoot(): string {
  const envRoot = process.env.AIRNUB_CATALOG_ROOT ? path.resolve(process.env.AIRNUB_CATALOG_ROOT) : null;
  if (envRoot && fs.existsSync(path.join(envRoot, "templates"))) {
    return envRoot;
  }
  const packageRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const repoCandidate = path.resolve(packageRoot, "..", "..");
  if (fs.existsSync(path.join(repoCandidate, "templates"))) {
    return repoCandidate;
  }
  const discovered = discoverCatalogRoot();
  if (discovered) {
    return discovered;
  }
  throw new Error("Unable to locate devcontainers catalog root. Provide --catalog-root or run within the catalog checkout.");
}

let cachedPackageVersion: string | null | undefined;

async function getPackageVersion(): Promise<string | null> {
  if (cachedPackageVersion !== undefined) {
    return cachedPackageVersion ?? null;
  }
  const packageRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const packageJsonPath = path.join(packageRoot, "package.json");
  try {
    const pkg: any = await fs.readJson(packageJsonPath);
    cachedPackageVersion = typeof pkg?.version === "string" ? pkg.version : null;
  } catch {
    cachedPackageVersion = null;
  }
  return cachedPackageVersion ?? null;
}

async function collectTemplateFiles(templateDir: string): Promise<Map<string, FileRecord>> {
  const files = new Map<string, FileRecord>();

  async function walk(current: string) {
    const entries = await fs.readdir(current);
    for (const entry of entries) {
      const abs = path.join(current, entry);
      const stat = await fs.stat(abs);
      if (stat.isDirectory()) {
        await walk(abs);
        continue;
      }
      if (!stat.isFile()) {
        continue;
      }
      const rel = path.relative(templateDir, abs);
      const repoPath = rel.split(path.sep).join("/");
      const content = (await fs.readFile(abs)) as unknown as Buffer;
      files.set(repoPath, { content, mode: stat.mode });
    }
  }

  await walk(templateDir);
  return files;
}

function markFileOperation(map: Map<string, FileOperation>, filePath: string, op: FileOperation["op"], reason?: string) {
  const existing = map.get(filePath);
  if (!existing) {
    map.set(filePath, { op, reason });
    return;
  }

  if (existing.op === op) {
    if (reason) {
      existing.reason = existing.reason ? `${existing.reason}; ${reason}` : reason;
    }
    return;
  }

  if (existing.op === "create" && op === "update") {
    map.set(filePath, { op, reason: reason ?? existing.reason });
    return;
  }

  if (existing.op === "update" && op === "create") {
    return;
  }

  if (reason) {
    existing.reason = existing.reason ? `${existing.reason}; ${reason}` : reason;
  }
}

function setFileRecord(files: Map<string, FileRecord>, filePath: string, content: Buffer, mode?: number) {
  const existing = files.get(filePath);
  files.set(filePath, { content, mode: mode ?? existing?.mode });
}

function ensureFile(
  files: Map<string, FileRecord>,
  ops: Map<string, FileOperation>,
  filePath: string,
  content: string | Buffer,
  { mode, reason, overwrite = false }: { mode?: number; reason?: string; overwrite?: boolean } = {},
) {
  const exists = files.has(filePath);
  if (exists && !overwrite) {
    return;
  }
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  setFileRecord(files, filePath, buffer, mode);
  markFileOperation(ops, filePath, exists ? "update" : "create", reason);
}

function toOutputFiles(files: Map<string, FileRecord>): Map<string, Buffer> {
  const result = new Map<string, Buffer>();
  for (const [filePath, record] of files.entries()) {
    const buffer = record.content;
    if (record.mode !== undefined) {
      (buffer as Buffer & { _mode?: number })._mode = record.mode;
    }
    result.set(filePath, buffer);
  }
  return result;
}

function mergeDevcontainerJson(base: any, addition: any): { merged: any; warnings: string[] } {
  const warnings: string[] = [];
  const merged: any = JSON.parse(JSON.stringify(base));

  const baseRun = Array.isArray(base.runServices) ? base.runServices : [];
  const addRun = Array.isArray(addition.runServices) ? addition.runServices : [];
  merged.runServices = uniq([...baseRun, ...addRun]);

  const baseEnv = base.containerEnv || {};
  merged.containerEnv = { ...baseEnv };
  for (const [key, value] of Object.entries(addition.containerEnv || {})) {
    if (Object.prototype.hasOwnProperty.call(merged.containerEnv, key)) {
      if (merged.containerEnv[key] !== value) {
        warnings.push(`containerEnv already defines ${key}; keeping existing value.`);
      }
      continue;
    }
    merged.containerEnv[key] = value;
  }

  for (const [key, value] of Object.entries(addition)) {
    if (["runServices", "forwardPorts", "portsAttributes", "containerEnv"].includes(key)) {
      continue;
    }
    if (merged[key] === undefined) {
      merged[key] = value;
    }
  }

  return { merged, warnings };
}

type DevcontainerTemplate = {
  path: string;
  data: any;
  placeholders: Placeholder[];
};

type BrowserAllocation = {
  browser: BrowserSidecar;
  portMap: Map<number, number>;
};

function ensureTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

async function readJsonFile(filePath: string): Promise<any> {
  return fs.readJson(filePath);
}

function loadDevcontainerTemplateFromContent(content: string, filePath: string): DevcontainerTemplate {
  const { data, placeholders } = parseDevcontainerTemplate(content);
  return { path: filePath, data, placeholders };
}

async function loadDevcontainerTemplate(devcontainerPath: string): Promise<DevcontainerTemplate> {
  const rawContent = await fs.readFile(devcontainerPath, "utf8");
  return loadDevcontainerTemplateFromContent(rawContent, devcontainerPath);
}

function parsePort(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const match = value.match(/^(\s*)(\d+)/);
    if (match) {
      return Number(match[2]);
    }
    return null;
  }
  if (typeof value === "object" && value !== null) {
    const candidate = (value as Record<string, unknown>).port
      ?? (value as Record<string, unknown>).localPort
      ?? (value as Record<string, unknown>).published;
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
}

function collectUsedPortsFromDevcontainer(data: any, used: Set<number>) {
  const entries = Array.isArray(data?.forwardPorts) ? data.forwardPorts : [];
  for (const entry of entries) {
    const port = parsePort(entry);
    if (port !== null) {
      used.add(port);
    }
  }
}

function collectPublishedPortsFromCompose(doc: Document.Parsed, used: Set<number>) {
  const servicesNode = doc.get("services");
  if (!isMap(servicesNode)) {
    return;
  }
  for (const pair of servicesNode.items) {
    if (!pair?.value || !isMap(pair.value)) {
      continue;
    }
    const portsNode = pair.value.get("ports");
    if (!portsNode) {
      continue;
    }
    if (isSeq(portsNode)) {
      for (const item of portsNode.items) {
        if (isScalar(item)) {
          const port = parsePort(item.value as unknown);
          if (port !== null) {
            used.add(port);
          }
        } else if (isMap(item)) {
          const published = item.get("published", true);
          const port = isScalar(published) ? parsePort(published.value as unknown) : parsePort(published as unknown);
          if (port !== null) {
            used.add(port);
          }
        }
      }
    } else if (isMap(portsNode)) {
      const published = portsNode.get("published", true);
      const port = isScalar(published) ? parsePort(published.value as unknown) : parsePort(published as unknown);
      if (port !== null) {
        used.add(port);
      }
    }
  }
}

function collectUsedPorts(devcontainerData: any, composeDoc: Document.Parsed): Set<number> {
  const used = new Set<number>();
  collectUsedPortsFromDevcontainer(devcontainerData, used);
  collectPublishedPortsFromCompose(composeDoc, used);
  return used;
}

function allocateBrowserPorts(
  browsers: BrowserSidecar[],
  used: Set<number>,
): { allocations: BrowserAllocation[]; notes: string[] } {
  const allocations: BrowserAllocation[] = [];
  const reserved = new Set<number>(used);
  const notes: string[] = [];

  for (const browser of browsers) {
    const portMap = new Map<number, number>();
    for (const desired of browser.ports) {
      let assigned = desired;
      if (reserved.has(desired)) {
        assigned = 0;
        for (let candidate = RESERVED_PORT_START; candidate <= RESERVED_PORT_END; candidate++) {
          if (!reserved.has(candidate)) {
            assigned = candidate;
            break;
          }
        }
        if (!assigned) {
          throw new Error(`Unable to allocate a free port for ${browser.label} (${browser.id}).`);
        }
        notes.push(`Port ${desired} for ${browser.label} reassigned to ${assigned}.`);
      }
      reserved.add(assigned);
      portMap.set(desired, assigned);
    }
    allocations.push({ browser, portMap });
  }

  return { allocations, notes };
}

function portMatches(entry: unknown, port: number): boolean {
  const parsed = parsePort(entry);
  return parsed !== null && parsed === port;
}

function rewriteServicePorts(node: unknown, portMap: Map<number, number>) {
  if (!node || !isMap(node) || portMap.size === 0) {
    return;
  }
  const portsNode = node.get("ports");
  if (!portsNode) {
    return;
  }
  if (isSeq(portsNode)) {
    for (const item of portsNode.items) {
      if (isScalar(item)) {
        const original = parsePort(item.value as unknown);
        if (original === null) {
          continue;
        }
        const assigned = portMap.get(original);
        if (assigned === undefined || assigned === original) {
          continue;
        }
        if (typeof item.value === "number") {
          item.value = assigned;
        } else if (typeof item.value === "string") {
          const match = item.value.match(/^(\s*)(\d+)(.*)$/);
          item.value = match ? `${match[1]}${assigned}${match[3]}` : String(assigned);
        } else {
          item.value = String(assigned);
        }
      } else if (isMap(item)) {
        const published = item.get("published", true);
        const original = isScalar(published) ? parsePort(published.value as unknown) : parsePort(published as unknown);
        if (original === null) {
          continue;
        }
        const assigned = portMap.get(original);
        if (assigned === undefined || assigned === original) {
          continue;
        }
        item.set("published", assigned);
      }
    }
  } else if (isMap(portsNode)) {
    const published = portsNode.get("published", true);
    const original = isScalar(published) ? parsePort(published.value as unknown) : parsePort(published as unknown);
    if (original === null) {
      return;
    }
    const assigned = portMap.get(original);
    if (assigned !== undefined && assigned !== original) {
      portsNode.set("published", assigned);
    }
  }
}

function mergeTopLevelMap(baseDoc: Document.Parsed, additionDoc: Document.Parsed, key: string): boolean {
  const additionNode = additionDoc.get(key);
  if (!additionNode || !isMap(additionNode)) {
    return false;
  }
  let baseNode = baseDoc.get(key);
  if (!isMap(baseNode)) {
    baseNode = new YAMLMap();
    baseDoc.set(key, baseNode);
    const newMap = baseNode as YAMLMap;
    for (const pair of additionNode.items) {
      if (!pair?.key) {
        continue;
      }
      newMap.add(pair.clone(additionDoc.schema));
    }
    return true;
  }
  const baseMap = baseNode as YAMLMap;
  let changed = false;
  for (const pair of additionNode.items) {
    if (!pair?.key) {
      continue;
    }
    const keyValue = isScalar(pair.key) ? pair.key.value : pair.key;
    if (baseMap.has(keyValue as any)) {
      continue;
    }
    baseMap.add(pair.clone(additionDoc.schema));
    changed = true;
  }
  return changed;
}

async function mergeComposeDocument({
  composeDoc,
  allocations,
  repoRoot,
}: {
  composeDoc: Document.Parsed;
  allocations: BrowserAllocation[];
  repoRoot: string;
}): Promise<{ touched: boolean }> {
  if (!allocations.length) {
    return { touched: false };
  }

  let touched = false;
  let servicesNode = composeDoc.get("services");
  if (!isMap(servicesNode)) {
    servicesNode = new YAMLMap();
    composeDoc.set("services", servicesNode);
    touched = true;
  }
  const servicesMap = servicesNode as YAMLMap;

  for (const allocation of allocations) {
    const sidecarComposePath = path.join(repoRoot, allocation.browser.templatePath, "docker-compose.yml");
    if (!await fs.pathExists(sidecarComposePath)) {
      continue;
    }
    const sidecarContent = await fs.readFile(sidecarComposePath, "utf8");
    const additionDoc = parseDocument(sidecarContent);
    if (additionDoc.errors.length) {
      throw new Error(`Failed to parse compose fragment for ${allocation.browser.id}: ${additionDoc.errors[0].message}`);
    }
    const additionServices = additionDoc.get("services");
    if (isMap(additionServices)) {
      for (const pair of additionServices.items) {
        if (!pair?.key) {
          continue;
        }
        const serviceName = isScalar(pair.key) ? String(pair.key.value) : String(pair.key);
        if (serviceName === "devcontainer" || servicesMap.has(serviceName)) {
          continue;
        }
        const cloned = pair.clone(additionDoc.schema);
        rewriteServicePorts(cloned.value, allocation.portMap);
        servicesMap.add(cloned);
        touched = true;
      }
    }

    for (const key of ["volumes", "networks", "configs", "secrets"]) {
      if (mergeTopLevelMap(composeDoc, additionDoc, key)) {
        touched = true;
      }
    }
  }

  return { touched };
}

async function mergeDevcontainerData({
  template,
  allocations,
  repoRoot,
}: {
  template: DevcontainerTemplate;
  allocations: BrowserAllocation[];
  repoRoot: string;
}): Promise<{ data: any; warnings: string[] }> {
  if (!allocations.length) {
    return { data: template.data, warnings: [] };
  }

  const baseForwardValues = Array.isArray(template.data.forwardPorts) ? template.data.forwardPorts : [];
  const baseForwardSet = new Set<number>();
  for (const entry of baseForwardValues) {
    const parsed = parsePort(entry);
    if (parsed !== null) {
      baseForwardSet.add(parsed);
    }
  }
  const basePortAttributeKeys = new Set(
    template.data.portsAttributes && typeof template.data.portsAttributes === "object"
      ? Object.keys(template.data.portsAttributes)
      : [],
  );

  let mergedData = JSON.parse(JSON.stringify(template.data));
  const warnings: string[] = [];

  for (const allocation of allocations) {
    const browserDevcontainerPath = path.join(repoRoot, allocation.browser.templatePath, ".devcontainer", "devcontainer.json");
    if (!await fs.pathExists(browserDevcontainerPath)) {
      continue;
    }
    const addition = await readJsonFile(browserDevcontainerPath);
    const result = mergeDevcontainerJson(mergedData, addition);
    mergedData = result.merged;
    warnings.push(...result.warnings);
  }

  const runServices = Array.isArray(mergedData.runServices) ? [...mergedData.runServices] : [];
  for (const allocation of allocations) {
    runServices.push(allocation.browser.serviceName);
  }
  mergedData.runServices = uniq(runServices);

  let forwardPorts = Array.isArray(mergedData.forwardPorts) ? [...mergedData.forwardPorts] : [];
  let portsAttributes: Record<string, Record<string, unknown>> =
    mergedData.portsAttributes && typeof mergedData.portsAttributes === "object"
      ? { ...mergedData.portsAttributes }
      : {};

  for (const allocation of allocations) {
    for (const [original, assigned] of allocation.portMap.entries()) {
      if (!baseForwardSet.has(original)) {
        forwardPorts = forwardPorts.filter((entry) => !portMatches(entry, original));
      }
      if (!forwardPorts.some((entry) => portMatches(entry, assigned))) {
        forwardPorts.push(assigned);
      }
      if (!basePortAttributeKeys.has(String(original))) {
        delete portsAttributes[String(original)];
      }
    }
  }
  mergedData.forwardPorts = forwardPorts;

  for (const allocation of allocations) {
    const { browser, portMap } = allocation;
    for (const [port, meta] of Object.entries(browser.portLabels)) {
      const originalPort = Number(port);
      const assigned = portMap.get(originalPort) ?? originalPort;
      const key = String(assigned);
      portsAttributes[key] = {
        ...(portsAttributes[key] || {}),
        ...meta,
      };
    }
  }
  mergedData.portsAttributes = portsAttributes;

  mergedData.containerEnv = mergedData.containerEnv || {};
  for (const allocation of allocations) {
    for (const [key, value] of Object.entries(allocation.browser.containerEnv || {})) {
      if (Object.prototype.hasOwnProperty.call(mergedData.containerEnv, key)) {
        if (mergedData.containerEnv[key] !== value) {
          warnings.push(`containerEnv already defines ${key}; keeping existing value.`);
        }
        continue;
      }
      mergedData.containerEnv[key] = value;
    }
  }

  for (const allocation of allocations) {
    for (const [key, value] of Object.entries(allocation.browser.containerEnv || {})) {
      const finalValue = mergedData.containerEnv?.[key];
      if (typeof finalValue === "string" && finalValue === value) {
        warnings.push(`${allocation.browser.label} uses default credential ${key}; override it before sharing a workspace.`);
      }
    }

    const requiredEnv = allocation.browser.requiredEnv || [];
    if (requiredEnv.length) {
      const missing = requiredEnv.filter((envName) => {
        const finalValue = mergedData.containerEnv?.[envName];
        return typeof finalValue !== "string" || finalValue.trim().length === 0;
      });
      if (missing.length) {
        const formatted = missing.join(", ");
        warnings.push(
          `${allocation.browser.label} requires environment variables ${formatted}. `
            + "Provide them via devcontainer containerEnv overrides or Codespaces secrets before sharing.",
        );
      }
    }
  }

  return { data: mergedData, warnings };
}

/**
 * Options for {@link generateStackTemplate}.
 *
 * Use this type when you want to materialize a stack directly to disk instead
 * of receiving file buffers. It largely mirrors {@link GenerateStackInput}
 * but expects already-resolved browser sidecar definitions.
 *
 * @public
 */
export type GenerateStackOptions = {
  /** Absolute path to the catalog repository root. */
  repoRoot: string;

  /** Template identifier under `templates/` (e.g., `nextjs-supabase`). */
  templateId: string;

  /** Output directory where the stack should be written. */
  outDir: string;

  /** Overwrite the output directory if it already exists. */
  force?: boolean;

  /** Browser sidecars to merge into the template. */
  browsers: BrowserSidecar[];

  /** Preserve mustache sections when reserializing the devcontainer template. */
  preserveTemplateSections?: boolean;
};

/**
 * Parses browser sidecar selection from CLI options.
 *
 * Accepts browsers as:
 * - CSV string: `"neko-chrome,kasm-chrome"`
 * - Array: `["neko-chrome", "kasm-chrome"]`
 * - Combination of both (merged and deduplicated)
 *
 * @param options - Browser selection options from CLI flags
 * @param options.withBrowsersCsv - Comma-separated browser IDs
 * @param options.withBrowser - Array of browser IDs
 * @param options.includeExperimental - Allow experimental browsers
 * @returns Array of selected browser sidecar configurations
 * @throws {Error} When an unknown browser ID is provided
 * @throws {Error} When an experimental browser is used without the flag
 *
 * @example
 * ```typescript
 * const browsers = parseBrowserSelection({
 *   withBrowsersCsv: "neko-chrome,kasm-chrome",
 *   includeExperimental: false
 * });
 * console.log(browsers.map(b => b.id));
 * ```
 *
 * @internal
 */
export function parseBrowserSelection(options: {
  withBrowsersCsv?: string;
  withBrowser?: string[];
  includeExperimental?: boolean;
}): BrowserSidecar[] {
  const ids = new Set<string>();
  if (options.withBrowsersCsv) {
    for (const entry of options.withBrowsersCsv.split(",")) {
      const trimmed = entry.trim();
      if (trimmed) {
        ids.add(trimmed);
      }
    }
  }
  for (const entry of options.withBrowser || []) {
    const trimmed = entry.trim();
    if (trimmed) {
      ids.add(trimmed);
    }
  }
  const selected: BrowserSidecar[] = [];
  for (const id of ids) {
    const browser = getBrowserSidecar(id);
    if (!browser) {
      throw new Error(`Unknown browser sidecar: ${id}`);
    }
    if (browser.experimental && !options.includeExperimental) {
      throw new Error(
        `${browser.label} (${browser.id}) is experimental. Pass --include-experimental to opt into experimental sidecars.`,
      );
    }
    selected.push(browser);
  }
  return selected;
}

/**
 * Generates a stack template and writes it to disk.
 *
 * This is a file-system version of {@link generateStack} that directly writes
 * the output to the specified directory. Use this when you want to materialize
 * a stack immediately rather than working with file buffers.
 *
 * **Safety:**
 * - Requires `force: true` to overwrite an existing directory
 * - Preserves template sections when `preserveTemplateSections: true`
 *
 * @param options - Generation options including output directory
 * @throws {Error} When the template does not exist
 * @throws {Error} When the output directory exists and force is false
 *
 * @example
 * ```typescript
 * await generateStackTemplate({
 *   repoRoot: "/path/to/catalog",
 *   templateId: "nextjs-supabase",
 *   outDir: "./workspace",
 *   browsers: [nekoChromeSidecar],
 *   force: true
 * });
 * ```
 *
 * @public
 * @since 0.1.0
 */
export async function generateStackTemplate(options: GenerateStackOptions) {
  const templateDir = path.join(options.repoRoot, "templates", options.templateId, ".template");
  if (!await fs.pathExists(templateDir)) {
    throw new Error(`Template '${options.templateId}' not found under templates/`);
  }

  await safeWriteDir(options.outDir, !!options.force);
  await fs.copy(templateDir, options.outDir, { overwrite: true, errorOnExist: false });

  if (!options.browsers.length) {
    return;
  }

  const composePath = path.join(options.outDir, "docker-compose.yml");
  const composeContent = await fs.readFile(composePath, "utf8");
  const composeDoc = parseDocument(composeContent);
  if (composeDoc.errors.length) {
    throw new Error(`Failed to parse base docker-compose.yml: ${composeDoc.errors[0].message}`);
  }

  const devcontainerPath = path.join(options.outDir, ".devcontainer", "devcontainer.json");
  const template = await loadDevcontainerTemplate(devcontainerPath);

  const { allocations, notes } = allocateBrowserPorts(options.browsers, collectUsedPorts(template.data, composeDoc));
  for (const allocation of allocations) {
    const resolvedNotes = resolveBrowserNotes(allocation.browser);
    if (resolvedNotes.length) {
      notes.push(...resolvedNotes);
    }
  }

  const composeResult = await mergeComposeDocument({
    composeDoc,
    allocations,
    repoRoot: options.repoRoot,
  });
  if (composeResult.touched) {
    const serialized = ensureTrailingNewline(String(composeDoc));
    await fs.writeFile(composePath, serialized, "utf8");
  }

  const devResult = await mergeDevcontainerData({
    template,
    allocations,
    repoRoot: options.repoRoot,
  });
  const serializedDevcontainer = serializeDevcontainerTemplate(devResult.data, template.placeholders, {
    preserveTemplateSections: !!options.preserveTemplateSections,
  });
  await fs.writeFile(devcontainerPath, serializedDevcontainer, "utf8");

  const warnings = uniq([...notes, ...devResult.warnings]);
  for (const warning of warnings) {
    console.warn(chalk.yellow(warning));
  }
}

/**
 * Generates a complete dev container stack from a template.
 *
 * This function:
 * - Loads the specified template from the catalog
 * - Merges browser sidecars (handling port conflicts automatically)
 * - Adds custom features to the devcontainer configuration
 * - Injects custom files via the `inserts` option
 * - Generates lesson scaffolding (docs, assessments, metadata)
 * - Returns a plan describing all file operations
 *
 * **Port Conflict Resolution:**
 * If a browser sidecar requires a port already in use by the template,
 * the function automatically reassigns it to a port in the range 45000-49999.
 *
 * **Dry Run Mode:**
 * When `dryRun: true`, returns only the plan without file buffers.
 * This is useful for previewing changes before committing.
 *
 * @param input - Stack generation configuration
 * @returns Object containing the merge plan and optional file buffers
 * @throws {Error} When the template does not exist
 * @throws {Error} When an unknown browser sidecar ID is provided
 * @throws {Error} When an experimental feature is used without the flag
 *
 * @example
 * ```typescript
 * import { promises as fs } from "fs";
 * import { generateStack } from "@airnub/devc";
 *
 * // Generate a Next.js stack with Chrome sidecar
 * const result = await generateStack({
 *   template: "nextjs-supabase",
 *   browsers: ["neko-chrome"],
 *   features: ["ghcr.io/airnub-labs/devcontainer-features/deno:1"],
 *   preset: "ghcr.io/airnub-labs/devcontainer-images/dev-web:latest",
 *   variables: { PROJECT_NAME: "My Lesson" },
 *   semverLock: true
 * });
 *
 * console.log(`Generated ${result.plan.files.length} files`);
 * console.log(`Forwarding ${result.plan.ports.length} ports`);
 *
 * // Write files to disk
 * for (const [path, buffer] of result.files!) {
 *   await fs.writeFile(path, buffer);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Dry run to preview changes
 * const preview = await generateStack({
 *   template: "web",
 *   browsers: ["kasm-chrome"],
 *   dryRun: true
 * });
 *
 * console.log("Files to be created/updated:");
 * preview.plan.files.forEach(f => {
 *   console.log(`  ${f.op}: ${f.path}`);
 * });
 * ```
 *
 * @see {@link GenerateStackInput} for all available options
 * @see {@link MergePlan} for the plan structure
 * @public
 * @since 0.1.0
 */
export async function generateStack(input: GenerateStackInput): Promise<{ plan: MergePlan; files?: Map<string, Buffer> }> {
  const repoRoot = resolveRepoRoot();
  const templateDir = path.join(repoRoot, "templates", input.template, ".template");
  if (!await fs.pathExists(templateDir)) {
    throw new Error(`Template '${input.template}' not found under templates/`);
  }

  const fileRecords = await collectTemplateFiles(templateDir);
  const fileOps = new Map<string, FileOperation>();
  for (const filePath of fileRecords.keys()) {
    markFileOperation(fileOps, filePath, "create");
  }

  const composeRecord = fileRecords.get("docker-compose.yml");
  if (!composeRecord) {
    throw new Error("Template is missing docker-compose.yml");
  }
  const composeContent = composeRecord.content.toString("utf8");
  const composeDoc = parseDocument(composeContent);
  if (composeDoc.errors.length) {
    throw new Error(`Failed to parse base docker-compose.yml: ${composeDoc.errors[0].message}`);
  }

  const devcontainerRecord = fileRecords.get(".devcontainer/devcontainer.json");
  if (!devcontainerRecord) {
    throw new Error("Template is missing .devcontainer/devcontainer.json");
  }
  const devTemplate = loadDevcontainerTemplateFromContent(
    devcontainerRecord.content.toString("utf8"),
    ".devcontainer/devcontainer.json",
  );

  const browserIds = input.browsers ?? [];
  const selectedBrowsers = browserIds.map((id) => {
    const browser = getBrowserSidecar(id);
    if (!browser) {
      throw new Error(`Unknown browser sidecar: ${id}`);
    }
    if (browser.experimental && !input.allowExperimental) {
      throw new Error(
        `${browser.label} (${browser.id}) is experimental. Pass allowExperimental: true to generateStack or use --include-experimental in the CLI.`,
      );
    }
    return browser;
  });

  const { allocations, notes: allocationNotes } = allocateBrowserPorts(
    selectedBrowsers,
    collectUsedPorts(devTemplate.data, composeDoc),
  );

  for (const allocation of allocations) {
    const resolvedNotes = resolveBrowserNotes(allocation.browser);
    if (resolvedNotes.length) {
      allocationNotes.push(...resolvedNotes);
    }
  }

  const composeMerge = await mergeComposeDocument({ composeDoc, allocations, repoRoot });
  const notes: string[] = [...allocationNotes];
  if (composeMerge.touched) {
    const serialized = ensureTrailingNewline(String(composeDoc));
    if (serialized !== composeContent) {
      setFileRecord(fileRecords, "docker-compose.yml", Buffer.from(serialized, "utf8"), composeRecord.mode);
      markFileOperation(fileOps, "docker-compose.yml", "update", "merged browser services");
    }
  }

  const devMerge = await mergeDevcontainerData({ template: devTemplate, allocations, repoRoot });
  notes.push(...devMerge.warnings);
  let mergedDevcontainer = devMerge.data;

  if (Array.isArray(mergedDevcontainer.runServices)) {
    mergedDevcontainer.runServices = Array.from(new Set(mergedDevcontainer.runServices)).sort();
  }

  if (input.features?.length) {
    const baseFeatures =
      mergedDevcontainer.features && typeof mergedDevcontainer.features === "object" && !Array.isArray(mergedDevcontainer.features)
        ? { ...mergedDevcontainer.features }
        : {};
    for (const feature of input.features) {
      if (!Object.prototype.hasOwnProperty.call(baseFeatures, feature)) {
        baseFeatures[feature] = {};
      }
    }
    const sortedFeatures = Object.fromEntries(
      Object.entries(baseFeatures).sort(([a], [b]) => a.localeCompare(b)),
    );
    mergedDevcontainer.features = sortedFeatures;
  }

  if (input.preset !== undefined) {
    if (input.preset && input.preset.trim().length) {
      mergedDevcontainer.image = input.preset;
      if (mergedDevcontainer.build) {
        notes.push("Using preset image; removing local build instructions.");
      }
      delete mergedDevcontainer.build;
    } else {
      delete mergedDevcontainer.image;
    }
  }

  const serializedDevcontainer = serializeDevcontainerTemplate(mergedDevcontainer, devTemplate.placeholders);
  if (serializedDevcontainer !== devcontainerRecord.content.toString("utf8")) {
    setFileRecord(
      fileRecords,
      ".devcontainer/devcontainer.json",
      Buffer.from(serializedDevcontainer, "utf8"),
      devcontainerRecord.mode,
    );
    markFileOperation(fileOps, ".devcontainer/devcontainer.json", "update", "updated devcontainer configuration");
  }

  const projectName = input.variables?.PROJECT_NAME?.trim() || "Lesson Project";

  const walkthrough = {
    walkthroughs: [
      {
        id: "lesson-start",
        title: `${projectName} onboarding`,
        description: "Get started with your lesson workspace.",
        steps: [
          {
            id: "review-docs",
            title: "Review lesson docs",
            description: "Open docs/index.md to review the lesson goals.",
          },
          {
            id: "install-deps",
            title: "Install dependencies",
            description: "Run npm install (or the equivalent) inside the Dev Container.",
          },
          {
            id: "launch-sidecar",
            title: "Open the browser sidecar",
            description: "Use the Ports view to launch the selected browser sidecars.",
          },
          {
            id: "run-tests",
            title: "Run lesson assessments",
            description: "Execute the configured test commands to validate progress.",
          },
        ],
      },
    ],
  };
  ensureFile(
    fileRecords,
    fileOps,
    ".vscode/walkthroughs.json",
    `${JSON.stringify(walkthrough, null, 2)}\n`,
    { reason: "lesson walkthrough scaffold" },
  );
  ensureFile(fileRecords, fileOps, ".tours/.gitkeep", "", { reason: "CodeTour slot" });

  const docsContent = [`# ${projectName}`, "", "Welcome to your lesson workspace. Customize this page with lesson context.", ""].join("\n");
  ensureFile(fileRecords, fileOps, "docs/index.md", `${docsContent}\n`, { reason: "lesson docs scaffold" });

  ensureFile(fileRecords, fileOps, "assessments/qti/.gitkeep", "", { reason: "QTI scaffold" });
  const analyticsContent = [
    "# Analytics",
    "",
    "Drop Caliper or xAPI configuration files here to enable lesson analytics.",
    "",
  ].join("\n");
  ensureFile(fileRecords, fileOps, "analytics/README.md", `${analyticsContent}\n`, { reason: "analytics scaffold" });

  const finalFeatureIds =
    mergedDevcontainer.features && typeof mergedDevcontainer.features === "object" && !Array.isArray(mergedDevcontainer.features)
      ? Object.keys(mergedDevcontainer.features).sort()
      : [];

  const lessonMetadata = {
    title: projectName,
    duration: 45,
    prerequisites: [] as string[],
    outcomes: [] as Array<{ text: string; caseGuid?: string; align?: string }>,
    assessments: [] as Array<{ id: string; format: string; path: string }>,
    stack: {
      template: input.template,
      browsers: selectedBrowsers.map((browser) => browser.id),
      features: finalFeatureIds,
    },
    lrmi: {
      educationalAlignment: [] as Array<Record<string, unknown>>,
    },
  };
  ensureFile(fileRecords, fileOps, "lesson.json", `${JSON.stringify(lessonMetadata, null, 2)}\n`, {
    reason: "lesson metadata scaffold",
    overwrite: true,
  });

  const generationSpec = {
    template: input.template,
    browsers: selectedBrowsers.map((browser) => browser.id),
    features: input.features ?? [],
    preset: input.preset ?? null,
    variables: input.variables ?? {},
    semverLock: !!input.semverLock,
  };
  ensureFile(fileRecords, fileOps, ".comhra/lesson.gen.json", `${JSON.stringify(generationSpec, null, 2)}\n`, {
    reason: "generation spec",
    overwrite: true,
  });

  if (input.semverLock) {
    let templateVersion: string | null = null;
    const manifestPath = path.join(repoRoot, "templates", input.template, "devcontainer-template.json");
    try {
      const manifest: any = await fs.readJson(manifestPath);
      if (manifest && typeof manifest.version === "string") {
        templateVersion = manifest.version;
      }
    } catch {
      templateVersion = null;
    }

    const pkgVersion = await getPackageVersion();
    const lockData = {
      template: {
        id: input.template,
        version: templateVersion,
      },
      features: finalFeatureIds,
      browsers: selectedBrowsers.map((browser) => browser.id),
      catalog: {
        version: pkgVersion,
      },
    };
    ensureFile(fileRecords, fileOps, ".comhra.lock.json", `${JSON.stringify(lockData, null, 2)}\n`, {
      reason: "semver lock",
      overwrite: true,
    });
  }

  if (input.inserts) {
    for (const insert of input.inserts) {
      const normalizedPath = insert.path.replace(/^[\\/]+/, "").split(path.sep).join("/");
      let buffer: Buffer;
      if (Buffer.isBuffer(insert.content)) {
        buffer = Buffer.from(insert.content as Uint8Array);
      } else {
        buffer = Buffer.from(insert.content, "utf8");
      }
      const existed = fileRecords.has(normalizedPath);
      setFileRecord(fileRecords, normalizedPath, buffer, insert.mode);
      markFileOperation(fileOps, normalizedPath, existed ? "update" : "create", "custom insert");
    }
  }

  const envEntries =
    mergedDevcontainer.containerEnv && typeof mergedDevcontainer.containerEnv === "object"
      ? mergedDevcontainer.containerEnv
      : {};
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(envEntries)) {
    env[key] = typeof value === "string" ? value : JSON.stringify(value);
  }

  const portEntries = Array.isArray(mergedDevcontainer.forwardPorts) ? mergedDevcontainer.forwardPorts : [];
  const ports: MergePlan["ports"] = [];
  const seenPorts = new Set<number>();
  for (const entry of portEntries) {
    const port = parsePort(entry);
    if (port === null || seenPorts.has(port)) {
      continue;
    }
    seenPorts.add(port);
    const attr =
      mergedDevcontainer.portsAttributes && typeof mergedDevcontainer.portsAttributes === "object"
        ? mergedDevcontainer.portsAttributes[String(port)]
        : undefined;
    const visibility =
      attr && typeof attr === "object" && typeof (attr as Record<string, unknown>).visibility === "string"
        ? ((attr as Record<string, unknown>).visibility as string)
        : undefined;
    ports.push({
      port,
      label:
        attr && typeof attr === "object" && typeof (attr as Record<string, unknown>).label === "string"
          ? ((attr as Record<string, unknown>).label as string)
          : undefined,
      visibility:
        visibility === "org" || visibility === "public"
          ? (visibility as "org" | "public")
          : DEFAULT_PORT_VISIBILITY,
    });
  }
  ports.sort((a, b) => a.port - b.port);

  const plan: MergePlan = {
    files: Array.from(fileOps.entries())
      .map(([pathName, op]) => ({ path: pathName, op: op.op, ...(op.reason ? { reason: op.reason } : {}) }))
      .sort((a, b) => a.path.localeCompare(b.path)),
    ports,
    runServices: Array.isArray(mergedDevcontainer.runServices) ? [...mergedDevcontainer.runServices] : [],
    env,
    notes: uniq(notes),
  };

  if (input.dryRun) {
    return { plan };
  }

  return { plan, files: toOutputFiles(fileRecords) };
}

/**
 * Lists browser sidecars bundled with the catalog.
 *
 * @param includeExperimental - Include experimental browsers that may change
 * @returns Array of browser sidecar definitions
 *
 * @example
 * ```typescript
 * const browsers = listBrowserOptions();
 * console.log(browsers.map(browser => browser.label));
 * ```
 *
 * @public
 */
export function listBrowserOptions(includeExperimental = false): BrowserSidecar[] {
  return includeExperimental ? BROWSER_SIDECARS : BROWSER_SIDECARS.filter((browser) => !browser.experimental);
}
