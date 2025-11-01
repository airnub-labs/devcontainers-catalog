import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { type Manifest as WorkspaceManifest, type ManifestPort as WorkspacePort, validateManifest } from '@airnub/devcontainers-catalog-manifest';

export interface GeneratorInput {
  stackId: string;
  browsers: string[];
  pin: string;
}

export interface GeneratorOutput {
  outDir: string;
  manifestPath: string;
  manifestJson: WorkspaceManifest;
}

interface SidecarEnvEntry {
  name: string;
  description?: string;
  required?: boolean;
}

type HealthMethod = 'http' | 'tcp' | 'cmd' | 'postgres';

interface SidecarHealth {
  method: HealthMethod | 'http-or-tcp';
  port?: number;
  path?: string;
  cmd?: string[];
  expect?: string;
  interval?: string | number;
  timeout?: string | number;
  retries?: number;
  start_period?: string | number;
  startPeriod?: string | number;
  scheme?: 'http' | 'https';
  tlsSkipVerify?: boolean;
}

interface SidecarDescriptor {
  id: string;
  image: string;
  defaultPort: number;
  label: string;
  purpose: string;
  recommendedPrivacy: WorkspacePort['recommendedPrivacy'];
  notes?: string;
  env?: SidecarEnvEntry[];
  health?: SidecarHealth;
}

interface SidecarRegistryFile {
  sidecars: SidecarDescriptor[];
}

interface NormalizedSidecarHealth {
  method: HealthMethod;
  port?: number;
  path?: string;
  cmd?: string[];
  expect?: string;
  interval: string;
  timeout: string;
  retries: number;
  start_period?: string;
  scheme?: 'http' | 'https';
  tlsSkipVerify?: boolean;
}

function toDuration(value: string | number | undefined, fallback: string): string {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'number') {
    return `${value}s`;
  }
  return value;
}

function shellEscape(arg: string): string {
  if (/^[A-Za-z0-9_\/.=:-]+$/.test(arg)) {
    return arg;
  }
  const escaped = arg.replace(/'/g, "'\"'\"'");
  return "'" + escaped + "'";
}

function normalizeHealthDefinition(sidecar: SidecarDescriptor): NormalizedSidecarHealth | undefined {
  const health = sidecar.health;
  if (!health) {
    return undefined;
  }

  const methodMap: Record<string, HealthMethod> = {
    http: 'http',
    tcp: 'tcp',
    cmd: 'cmd',
    postgres: 'postgres',
    'http-or-tcp': 'http'
  };

  const normalizedMethod = methodMap[health.method];
  if (!normalizedMethod) {
    throw new Error(`Unsupported health method for sidecar ${sidecar.id}: ${health.method}`);
  }

  const retries = health.retries ?? 5;
  const interval = toDuration(health.interval, '10s');
  const timeout = toDuration(health.timeout, '3s');
  const startPeriod = health.start_period ?? health.startPeriod;
  const normalized: NormalizedSidecarHealth = {
    method: normalizedMethod,
    port: health.port,
    path: health.path,
    cmd: health.cmd,
    expect: health.expect,
    interval,
    timeout,
    retries,
    start_period: startPeriod ? toDuration(startPeriod, '0s') : undefined
  };

  if (normalized.method === 'http') {
    const scheme = health.scheme ?? 'http';
    if (scheme !== 'http' && scheme !== 'https') {
      throw new Error(`Unsupported HTTP scheme for sidecar ${sidecar.id}: ${scheme}`);
    }
    normalized.scheme = scheme;
    if (health.tlsSkipVerify !== undefined) {
      normalized.tlsSkipVerify = Boolean(health.tlsSkipVerify);
    }
  }

  if (normalized.method === 'cmd') {
    if (!normalized.cmd || normalized.cmd.length === 0) {
      throw new Error(`Sidecar ${sidecar.id} health definition requires a cmd array`);
    }
  }

  if (normalized.method === 'postgres') {
    normalized.port = normalized.port ?? sidecar.defaultPort;
    if (!normalized.port) {
      throw new Error(`Sidecar ${sidecar.id} postgres healthcheck requires a port`);
    }
  }

  return normalized;
}

function loadSidecarRegistry(): Record<string, SidecarDescriptor> {
  const searchOrder = [
    new URL('../../catalog/sidecars.json', import.meta.url),
    new URL('./catalog/sidecars.json', import.meta.url)
  ];

  for (const candidate of searchOrder) {
    try {
      const filePath = fileURLToPath(candidate);
      const contents = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(contents) as SidecarRegistryFile;
      return Object.fromEntries(
        parsed.sidecars.map((sidecar) => {
          normalizeHealthDefinition(sidecar);
          return [sidecar.id, sidecar];
        })
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to locate sidecar registry (catalog/sidecars.json)');
}

const SIDECAR_REGISTRY = loadSidecarRegistry();

function loadScriptAsset(filename: string): string {
  const searchOrder = [
    new URL(`../../scripts/${filename}`, import.meta.url),
    new URL(`./scripts/${filename}`, import.meta.url)
  ];

  for (const candidate of searchOrder) {
    try {
      const filePath = fileURLToPath(candidate);
      return readFileSync(filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Unable to locate ${filename} in scripts/ directory`);
}

const DEFAULT_SCHEMA_VERSION = '1.0.0';

const STACK_DEFAULTS: Record<string, { displayName: string; description: string; ports: WorkspacePort[] }> = {
  'nextjs-supabase@1.0.0': {
    displayName: 'Next.js + Supabase Starter',
    description: 'Full-stack starter with Next.js and Supabase, suitable for modern web lessons.',
    ports: [
      {
        port: 3000,
        label: 'Web App',
        purpose: 'app',
        recommendedPrivacy: 'PRIVATE'
      },
      {
        port: 54322,
        label: 'Supabase API',
        purpose: 'supabase-api',
        recommendedPrivacy: 'PRIVATE'
      }
    ]
  }
};

function ensureStack(stackId: string): void {
  if (!STACK_DEFAULTS[stackId]) {
    const knownStacks = Object.keys(STACK_DEFAULTS).join(', ');
    throw new Error(`Unknown stackId: ${stackId}. Known stacks: ${knownStacks}`);
  }
}

function getSidecar(browserId: string): SidecarDescriptor {
  const sidecar = SIDECAR_REGISTRY[browserId];
  if (!sidecar) {
    const known = Object.keys(SIDECAR_REGISTRY).join(', ');
    throw new Error(`Unsupported browser sidecar: ${browserId}. Known sidecars: ${known}`);
  }
  return sidecar;
}

function createHealthcheckBlock(sidecar: SidecarDescriptor): string {
  const health = normalizeHealthDefinition(sidecar);
  if (!health) {
    return '';
  }

  const resolvedPort = health.port ?? sidecar.defaultPort;
  let command: string;

  switch (health.method) {
    case 'http': {
      if (!resolvedPort) {
        throw new Error(`HTTP healthcheck for sidecar ${sidecar.id} requires a port`);
      }
      const scheme = health.scheme ?? 'http';
      const path = health.path?.startsWith('/') ? health.path : `/${health.path ?? ''}`;
      const url = `${scheme}://localhost:${resolvedPort}${path}`;
      const wgetCommand = scheme === 'https' && health.tlsSkipVerify
        ? `wget --no-check-certificate -qO- ${url}`
        : `wget -qO- ${url}`;
      const curlCommand = scheme === 'https' && health.tlsSkipVerify
        ? `curl -kfsS ${url}`
        : `curl -fsS ${url}`;
      const attempts = [
        `(${wgetCommand} >/dev/null 2>&1)`,
        `(${curlCommand} >/dev/null 2>&1)`,
        `(command -v nc >/dev/null 2>&1 && nc -z localhost ${resolvedPort})`,
        `(command -v bash >/dev/null 2>&1 && bash -lc 'echo > /dev/tcp/localhost/${resolvedPort}')`
      ];
      command = `(${attempts.join(' || ')})`;
      break;
    }
    case 'tcp': {
      if (!resolvedPort) {
        throw new Error(`TCP healthcheck for sidecar ${sidecar.id} requires a port`);
      }
      command = `((command -v nc >/dev/null 2>&1 && nc -z localhost ${resolvedPort}) || (command -v bash >/dev/null 2>&1 && bash -lc 'echo > /dev/tcp/localhost/${resolvedPort}'))`;
      break;
    }
    case 'cmd': {
      if (!health.cmd || health.cmd.length === 0) {
        throw new Error(`CMD healthcheck for sidecar ${sidecar.id} requires a command`);
      }
      const cmdParts = health.cmd;
      const commandName = cmdParts[0];
      const commandInvocation = cmdParts.map((part) => shellEscape(part)).join(' ');
      const expectClause = health.expect ? ` | grep -q ${shellEscape(health.expect)}` : '';
      const attempts = [
        `(command -v ${shellEscape(commandName)} >/dev/null 2>&1 && ${commandInvocation}${expectClause})`
      ];
      if (resolvedPort) {
        attempts.push(`(command -v nc >/dev/null 2>&1 && nc -z localhost ${resolvedPort})`);
        attempts.push(`(command -v bash >/dev/null 2>&1 && bash -lc 'echo > /dev/tcp/localhost/${resolvedPort}')`);
      }
      command = `(${attempts.join(' || ')})`;
      break;
    }
    case 'postgres': {
      if (!resolvedPort) {
        throw new Error(`Postgres healthcheck for sidecar ${sidecar.id} requires a port`);
      }
      command = `((command -v pg_isready >/dev/null 2>&1 && pg_isready -q) || (command -v nc >/dev/null 2>&1 && nc -z localhost ${resolvedPort}) || (command -v bash >/dev/null 2>&1 && bash -lc 'echo > /dev/tcp/localhost/${resolvedPort}'))`;
      break;
    }
    default: {
      const exhaustiveCheck: never = health.method;
      throw new Error(`Unsupported health method for sidecar ${sidecar.id}: ${exhaustiveCheck}`);
    }
  }

  const lines = [
    '    healthcheck:',
    `      test: ["CMD-SHELL", "${command.replace(/"/g, '\"')}"]`,
    `      interval: ${health.interval}`,
    `      timeout: ${health.timeout}`,
    `      retries: ${health.retries}`
  ];

  if (health.start_period) {
    lines.push(`      start_period: ${health.start_period}`);
  }

  lines.push('');

  return lines.join('\n');
}

function createReadme(stackId: string, browsers: string[]): string {
  const browserList = browsers.length > 0 ? browsers.map((id) => `- ${id}`).join('\n') : '- none';
  return `# ${STACK_DEFAULTS[stackId].displayName}\n\n${STACK_DEFAULTS[stackId].description}\n\n` +
    '## Safety checklist\n\n' +
    '- Update sidecar passwords before inviting students.\n' +
    '- Keep all forwarded ports in **Private** mode unless explicitly required otherwise.\n' +
    '- Share the `/classroom-browser` link with Chromebook/iPad users.\n\n' +
    '## Included browsers\n\n' +
    `${browserList}\n\n` +
    '## Running locally\n\n' +
    'Use VS Code Dev Containers or GitHub Codespaces to open the workspace.\n';
}

function createClassroomBrowserReadme(): string {
  return '# Classroom Browser\n\n' +
    'This directory is a placeholder for static assets that can be served to students as an entry point.\n\n' +
    '- Default credentials are defined via environment variables (e.g. `NEKO_PASSWORD`).\n' +
    '- Always rotate the password before the first lesson.\n' +
    '- Remind students to keep their ports in Private visibility mode unless your policy says otherwise.\n';
}

function createDevcontainerJson(
  stackId: string,
  browsers: string[],
  manifestPorts: WorkspacePort[],
  sidecarLabels: Map<number, string>
): string {
  const composeFile = '.devcontainer/docker-compose.yml';
  const basePorts = STACK_DEFAULTS[stackId].ports.map((port) => port.port);
  const extraPorts = browsers.map((browserId) => getSidecar(browserId).defaultPort);
  const forwardPorts = Array.from(new Set([...basePorts, ...extraPorts]));

  const portsAttributes = manifestPorts.reduce<Record<string, { label: string }>>((acc, port) => {
    acc[String(port.port)] = { label: port.label };
    return acc;
  }, {});

  const remotePortsAttributes = Array.from(manifestPorts.values()).reduce<Record<string, { label: string }>>((acc, port) => {
    const labelSuffix = sidecarLabels.has(port.port) ? ' (sidecar)' : '';
    acc[String(port.port)] = { label: `${port.label}${labelSuffix}` };
    return acc;
  }, {});

  return JSON.stringify(
    {
      name: STACK_DEFAULTS[stackId].displayName,
      dockerComposeFile: [composeFile],
      service: 'workspace',
      postCreateCommand: 'npm install',
      postStartCommand: './scripts/sidecars-status.sh || true',
      customizations: {
        vscode: {
          settings: {
            'terminal.integrated.defaultProfile.linux': 'bash',
            'remote.portsAttributes': remotePortsAttributes
          },
          extensions: ['ms-azuretools.vscode-docker', 'esbenp.prettier-vscode']
        }
      },
      mounts: ['source=/var/run/docker.sock,target=/var/run/docker.sock,type=bind'],
      forwardPorts,
      portsAttributes
    },
    null,
    2
  );
}

function createComposeFile(stackId: string, browsers: string[]): string {
  const stackPorts = STACK_DEFAULTS[stackId].ports;
  const browserServices = browsers
    .map((browserId) => {
      const sidecar = getSidecar(browserId);
      const envVars = sidecar.env ?? [];
      const envSection = envVars.length
        ? '    environment:\n' + envVars.map((entry) => `      - ${entry.name}=\${${entry.name}:-ChangeThisPassword!}`).join('\n') + '\n'
        : '';
      const healthSection = createHealthcheckBlock(sidecar);
      return `  ${browserId}:\n` +
        `    image: ${sidecar.image}\n` +
        '    restart: unless-stopped\n' +
        envSection +
        healthSection +
        '    ports:\n' +
        `      - "${sidecar.defaultPort}:${sidecar.defaultPort}"\n` +
        '    labels:\n' +
        '      - "devcontainer.metadata=true"\n';
    })
    .join('\n');

  const workspacePorts = stackPorts
    .map((port) => `      - "${port.port}:${port.port}"`)
    .join('\n');

  return "version: '3.8'\n" +
    'services:\n' +
    '  workspace:\n' +
    '    build:\n' +
    '      context: ..\n' +
    '      dockerfile: Dockerfile\n' +
    '    volumes:\n' +
    '      - ..:/workspace:cached\n' +
    '    command: sleep infinity\n' +
    '    ports:\n' +
    workspacePorts +
    '\n' +
    (browserServices ? browserServices + '\n' : '');
}

function createDockerfile(): string {
  return 'FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm\n\n' +
    'RUN mkdir -p /workspace && chown node:node /workspace\n';
}

export async function generateCatalogWorkspace(input: GeneratorInput): Promise<GeneratorOutput> {
  ensureStack(input.stackId);

  const outDir = mkdtempSync(path.join(os.tmpdir(), 'catalog-workspace-'));
  await mkdir(outDir, { recursive: true });
  await mkdir(path.join(outDir, '.devcontainer'), { recursive: true });
  await mkdir(path.join(outDir, 'classroom-browser'), { recursive: true });
  await mkdir(path.join(outDir, 'scripts'), { recursive: true });

  const uniquePorts = new Map<number, WorkspacePort>();
  const sidecarLabels = new Map<number, string>();
  STACK_DEFAULTS[input.stackId].ports.forEach((port) => {
    uniquePorts.set(port.port, port);
  });
  input.browsers.forEach((browserId) => {
    const sidecar = getSidecar(browserId);
    sidecarLabels.set(sidecar.defaultPort, sidecar.label);
    uniquePorts.set(sidecar.defaultPort, {
      port: sidecar.defaultPort,
      label: sidecar.label,
      purpose: sidecar.purpose,
      recommendedPrivacy: sidecar.recommendedPrivacy
    });
  });
  const manifestPorts = Array.from(uniquePorts.values());

  const envMap = new Map<string, SidecarEnvEntry & { required: boolean }>();
  input.browsers.forEach((browserId) => {
    const sidecar = getSidecar(browserId);
    (sidecar.env ?? []).forEach((entry) => {
      const existing = envMap.get(entry.name);
      envMap.set(entry.name, {
        ...entry,
        required: Boolean(entry.required) || Boolean(existing?.required)
      });
    });
  });

  const manifest: WorkspaceManifest = {
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    stackId: input.stackId,
    catalogCommit: input.pin,
    browsers: input.browsers,
    ports: manifestPorts,
    env: Array.from(envMap.values()).map((entry) => ({
      name: entry.name,
      description: entry.description,
      required: entry.required
    })),
    paths: {
      devcontainer: '.devcontainer/devcontainer.json',
      compose: '.devcontainer/docker-compose.yml',
      readme: 'README.md',
      classroomBrowser: 'classroom-browser'
    },
    notes: {
      prefersUDP: false,
      codespacesFallback: 'https-ws',
      other: 'Rotate sidecar passwords and keep ports set to Private unless course policy dictates otherwise.'
    }
  };

  const readme = createReadme(input.stackId, input.browsers);
  writeFileSync(path.join(outDir, 'README.md'), readme, 'utf-8');
  const classroomReadme = createClassroomBrowserReadme();
  writeFileSync(path.join(outDir, 'classroom-browser/README.md'), classroomReadme, 'utf-8');
  const devcontainerJson = createDevcontainerJson(input.stackId, input.browsers, manifestPorts, sidecarLabels);
  writeFileSync(path.join(outDir, '.devcontainer/devcontainer.json'), devcontainerJson, 'utf-8');
  const composeFile = createComposeFile(input.stackId, input.browsers);
  writeFileSync(path.join(outDir, '.devcontainer/docker-compose.yml'), composeFile, 'utf-8');
  const dockerfile = createDockerfile();
  writeFileSync(path.join(outDir, 'Dockerfile'), dockerfile, 'utf-8');
  writeFileSync(path.join(outDir, 'scripts/sidecars-status.sh'), loadScriptAsset('sidecars-status.sh'), { encoding: 'utf-8', mode: 0o755 });
  writeFileSync(path.join(outDir, 'scripts/sidecars-watch.sh'), loadScriptAsset('sidecars-watch.sh'), { encoding: 'utf-8', mode: 0o755 });

  const manifestPath = path.join(outDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  const validation = validateManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Invalid manifest: ${JSON.stringify(validation.errors)}`);
  }

  return {
    outDir,
    manifestPath,
    manifestJson: manifest
  };
}

export function cleanupGeneratedWorkspace(output: GeneratorOutput): void {
  rmSync(output.outDir, { recursive: true, force: true });
}
