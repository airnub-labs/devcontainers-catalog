import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import {
  Document,
  isMap,
  isScalar,
  isSeq,
  parseDocument,
  YAMLMap,
  YAMLSeq,
} from "yaml";
import { safeWriteDir } from "./fsutil.js";
import { BROWSER_SIDECARS, BrowserSidecar, getBrowserSidecar } from "./services.js";

function uniq<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

type Placeholder = {
  token: string;
  original: string;
  quoted: boolean;
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

async function loadDevcontainerTemplate(devcontainerPath: string): Promise<DevcontainerTemplate> {
  const rawContent = await fs.readFile(devcontainerPath, "utf8");
  const { data, placeholders } = parseDevcontainerTemplate(rawContent);
  return { path: devcontainerPath, data, placeholders };
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

function allocateBrowserPorts(browsers: BrowserSidecar[], used: Set<number>): BrowserAllocation[] {
  const allocations: BrowserAllocation[] = [];
  const reserved = new Set<number>(used);
  for (const browser of browsers) {
    const portMap = new Map<number, number>();
    for (const desired of browser.ports) {
      let candidate = desired;
      while (reserved.has(candidate)) {
        candidate += 1;
      }
      reserved.add(candidate);
      portMap.set(desired, candidate);
    }
    allocations.push({ browser, portMap });
  }
  return allocations;
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

function mergeTopLevelMap(baseDoc: Document.Parsed, additionDoc: Document.Parsed, key: string) {
  const additionNode = additionDoc.get(key);
  if (!additionNode || !isMap(additionNode)) {
    return;
  }
  let baseNode = baseDoc.get(key);
  if (!isMap(baseNode)) {
    baseNode = new YAMLMap();
    baseDoc.set(key, baseNode);
  }
  const baseMap = baseNode as YAMLMap;
  for (const pair of additionNode.items) {
    if (!pair?.key) {
      continue;
    }
    const keyValue = isScalar(pair.key) ? pair.key.value : pair.key;
    if (baseMap.has(keyValue as any)) {
      continue;
    }
    baseMap.add(pair.clone(additionDoc.schema));
  }
}

async function mergeComposeFile({
  composeDoc,
  composePath,
  allocations,
  repoRoot,
}: {
  composeDoc: Document.Parsed;
  composePath: string;
  allocations: BrowserAllocation[];
  repoRoot: string;
}) {
  if (!allocations.length) {
    return;
  }

  let servicesNode = composeDoc.get("services");
  if (!isMap(servicesNode)) {
    servicesNode = new YAMLMap();
    composeDoc.set("services", servicesNode);
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
      }
    }

    for (const key of ["volumes", "networks", "configs", "secrets"]) {
      mergeTopLevelMap(composeDoc, additionDoc, key);
    }
  }

  const serialized = ensureTrailingNewline(String(composeDoc));
  await fs.writeFile(composePath, serialized, "utf8");
}

async function mergeDevcontainerFile({
  template,
  allocations,
  repoRoot,
  preserveTemplateSections,
}: {
  template: DevcontainerTemplate;
  allocations: BrowserAllocation[];
  repoRoot: string;
  preserveTemplateSections: boolean;
}) {
  if (!allocations.length) {
    return;
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
  }

  const serialized = serializeDevcontainerTemplate(mergedData, template.placeholders, {
    preserveTemplateSections,
  });
  await fs.writeFile(template.path, serialized, "utf8");

  if (warnings.length) {
    for (const warning of uniq(warnings)) {
      console.warn(chalk.yellow(warning));
    }
  }
}

export type GenerateStackOptions = {
  repoRoot: string;
  templateId: string;
  outDir: string;
  force?: boolean;
  browsers: BrowserSidecar[];
  preserveTemplateSections?: boolean;
};

export function parseBrowserSelection(options: {
  withBrowsersCsv?: string;
  withBrowser?: string[];
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
    selected.push(browser);
  }
  return selected;
}

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

  const allocations = allocateBrowserPorts(options.browsers, collectUsedPorts(template.data, composeDoc));

  await mergeComposeFile({
    composeDoc,
    composePath,
    allocations,
    repoRoot: options.repoRoot,
  });

  await mergeDevcontainerFile({
    template,
    allocations,
    repoRoot: options.repoRoot,
    preserveTemplateSections: !!options.preserveTemplateSections,
  });
}

export function listBrowserOptions(): BrowserSidecar[] {
  return BROWSER_SIDECARS;
}
