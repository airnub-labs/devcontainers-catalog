import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
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

function serializeDevcontainerTemplate(data: any, placeholders: Placeholder[]): string {
  let json = JSON.stringify(data, null, 2);
  for (const placeholder of placeholders) {
    const pattern = new RegExp(`"${placeholder.token}"`, "g");
    if (placeholder.quoted) {
      json = json.replace(pattern, `"${placeholder.original}"`);
    } else {
      json = json.replace(pattern, placeholder.original);
    }
  }
  json = restoreSections(json);
  if (!json.endsWith("\n")) {
    json += "\n";
  }
  return json;
}

function mergeDevcontainerJson(base: any, addition: any): { merged: any; warnings: string[] } {
  const warnings: string[] = [];
  const merged: any = { ...base };

  const baseRun = Array.isArray(base.runServices) ? base.runServices : [];
  const addRun = Array.isArray(addition.runServices) ? addition.runServices : [];
  merged.runServices = uniq([...baseRun, ...addRun]);

  const basePorts = Array.isArray(base.forwardPorts) ? base.forwardPorts : [];
  const addPorts = Array.isArray(addition.forwardPorts) ? addition.forwardPorts : [];
  merged.forwardPorts = uniq([...basePorts, ...addPorts]);

  const baseAttrs = base.portsAttributes || {};
  const addAttrs = addition.portsAttributes || {};
  merged.portsAttributes = { ...baseAttrs };
  for (const [key, value] of Object.entries(addAttrs)) {
    merged.portsAttributes[key] = {
      ...(typeof baseAttrs[key] === "object" ? baseAttrs[key] : {}),
      ...(value as Record<string, unknown>),
    };
  }

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

  return { merged, warnings };
}

function extractServiceBlocks(composeContent: string): Map<string, string> {
  const lines = composeContent.split(/\r?\n/);
  const blocks = new Map<string, string>();
  let inServices = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inServices) {
      if (/^\s*services\s*:/i.test(line)) {
        inServices = true;
      }
      continue;
    }
    if (/^\S/.test(line) && !line.startsWith(" ")) {
      break;
    }
    const serviceMatch = line.match(/^  ([a-zA-Z0-9_-]+):\s*$/);
    if (!serviceMatch) {
      continue;
    }
    let start = i;
    // Include preceding comments with same indent.
    while (start - 1 >= 0 && lines[start - 1].startsWith("  #")) {
      start -= 1;
    }
    let end = i + 1;
    for (; end < lines.length; end++) {
      const candidate = lines[end];
      if (candidate.startsWith("  ") && !candidate.startsWith("    ") && candidate.trim() && !candidate.trim().startsWith("#")) {
        break;
      }
      if (!candidate.startsWith("  ") && candidate.trim()) {
        break;
      }
    }
    const block = lines.slice(start, end).join("\n").trimEnd();
    blocks.set(serviceMatch[1], block);
    i = end - 1;
  }
  return blocks;
}

function appendServiceBlock(baseContent: string, block: string): string {
  const trimmed = baseContent.trimEnd();
  const separator = trimmed.endsWith("\n") ? "\n" : "\n";
  return `${trimmed}${separator}\n${block}\n`;
}

function hasService(content: string, serviceName: string): boolean {
  const pattern = new RegExp(`^  ${serviceName}:`, "m");
  return pattern.test(content);
}

function readJsonFile(filePath: string): any {
  return fs.readJson(filePath);
}

export type GenerateStackOptions = {
  repoRoot: string;
  templateId: string;
  outDir: string;
  force?: boolean;
  browsers: BrowserSidecar[];
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

async function mergeComposeFile(outDir: string, browsers: BrowserSidecar[], repoRoot: string) {
  if (!browsers.length) {
    return;
  }
  const composePath = path.join(outDir, "docker-compose.yml");
  let composeContent = await fs.readFile(composePath, "utf8");
  for (const browser of browsers) {
    const sidecarComposePath = path.join(repoRoot, browser.templatePath, "docker-compose.yml");
    if (!await fs.pathExists(sidecarComposePath)) {
      continue;
    }
    const sidecarContent = await fs.readFile(sidecarComposePath, "utf8");
    const blocks = extractServiceBlocks(sidecarContent);
    for (const [serviceName, block] of blocks.entries()) {
      if (serviceName === "devcontainer") {
        continue;
      }
      if (hasService(composeContent, serviceName)) {
        continue;
      }
      composeContent = appendServiceBlock(composeContent, block);
    }
  }
  if (!composeContent.endsWith("\n")) {
    composeContent += "\n";
  }
  await fs.writeFile(composePath, composeContent, "utf8");
}

async function mergeDevcontainerFile(outDir: string, browsers: BrowserSidecar[], repoRoot: string) {
  const devcontainerPath = path.join(outDir, ".devcontainer", "devcontainer.json");
  const rawContent = await fs.readFile(devcontainerPath, "utf8");
  const { data: baseData, placeholders } = parseDevcontainerTemplate(rawContent);
  let mergedData = { ...baseData };
  const warnings: string[] = [];

  for (const browser of browsers) {
    const browserDevcontainerPath = path.join(repoRoot, browser.templatePath, ".devcontainer", "devcontainer.json");
    if (!await fs.pathExists(browserDevcontainerPath)) {
      continue;
    }
    const addition = await readJsonFile(browserDevcontainerPath);
    const result = mergeDevcontainerJson(mergedData, addition);
    mergedData = result.merged;
    warnings.push(...result.warnings);
  }

  const existingRun = Array.isArray(mergedData.runServices) ? mergedData.runServices : [];
  mergedData.runServices = uniq([
    ...existingRun,
    ...browsers.map((browser) => browser.serviceName),
  ]);

  const existingForward = Array.isArray(mergedData.forwardPorts) ? mergedData.forwardPorts : [];
  for (const browser of browsers) {
    for (const port of browser.ports) {
      if (!existingForward.some((entry: any) => String(entry) === String(port))) {
        existingForward.push(port);
      }
    }
  }
  mergedData.forwardPorts = existingForward;

  mergedData.portsAttributes = mergedData.portsAttributes || {};
  for (const browser of browsers) {
    for (const [port, meta] of Object.entries(browser.portLabels)) {
      const key = String(port);
      mergedData.portsAttributes[key] = {
        ...(mergedData.portsAttributes[key] || {}),
        ...meta,
      };
    }
  }

  mergedData.containerEnv = mergedData.containerEnv || {};
  for (const browser of browsers) {
    for (const [key, value] of Object.entries(browser.containerEnv || {})) {
      if (Object.prototype.hasOwnProperty.call(mergedData.containerEnv, key)) {
        if (mergedData.containerEnv[key] !== value) {
          warnings.push(`containerEnv already defines ${key}; keeping existing value.`);
        }
        continue;
      }
      mergedData.containerEnv[key] = value;
    }
  }

  const serialized = serializeDevcontainerTemplate(mergedData, placeholders);
  await fs.writeFile(devcontainerPath, serialized, "utf8");

  if (warnings.length) {
    for (const warning of uniq(warnings)) {
      console.warn(chalk.yellow(warning));
    }
  }
}

export async function generateStackTemplate(options: GenerateStackOptions) {
  const templateDir = path.join(options.repoRoot, "templates", options.templateId, ".template");
  if (!await fs.pathExists(templateDir)) {
    throw new Error(`Template '${options.templateId}' not found under templates/`);
  }

  await safeWriteDir(options.outDir, !!options.force);
  await fs.copy(templateDir, options.outDir, { overwrite: true, errorOnExist: false });

  await mergeComposeFile(options.outDir, options.browsers, options.repoRoot);
  await mergeDevcontainerFile(options.outDir, options.browsers, options.repoRoot);
}

export function listBrowserOptions(): BrowserSidecar[] {
  return BROWSER_SIDECARS;
}
