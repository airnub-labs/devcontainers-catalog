import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';
import { WorkspaceManifest, WorkspacePort, GeneratorInput, GeneratorOutput, validateManifest } from '@airnub/devcontainers-catalog-manifest';

const STACK_DEFAULTS: Record<string, { displayName: string; description: string; ports: WorkspacePort[] }> = {
  'nextjs-supabase@1.0.0': {
    displayName: 'Next.js + Supabase Starter',
    description: 'Full-stack starter with Next.js and Supabase, suitable for modern web lessons.',
    ports: [
      {
        port: 3000,
        label: 'Web App',
        purpose: 'Student application preview',
        recommendedPrivacy: 'PRIVATE'
      },
      {
        port: 54322,
        label: 'Supabase API',
        purpose: 'Supabase local development API',
        recommendedPrivacy: 'PRIVATE'
      }
    ]
  }
};

const BROWSER_PORTS: Record<string, WorkspacePort> = {
  'neko-chrome': {
    port: 8080,
    label: 'Neko Chrome UI',
    purpose: 'Streamed Chrome session for students on low-power devices',
    recommendedPrivacy: 'PRIVATE'
  },
  'neko-firefox': {
    port: 8081,
    label: 'Neko Firefox UI',
    purpose: 'Streamed Firefox session for students on low-power devices',
    recommendedPrivacy: 'PRIVATE'
  },
  'kasm-chrome': {
    port: 8443,
    label: 'Kasm Chrome HTTPS',
    purpose: 'Browser-based desktop via HTTPS',
    recommendedPrivacy: 'PRIVATE'
  }
};

const DEFAULT_SCHEMA_VERSION = '1.0.0';

function ensureStack(stackId: string): void {
  if (!STACK_DEFAULTS[stackId]) {
    const knownStacks = Object.keys(STACK_DEFAULTS).join(', ');
    throw new Error(`Unknown stackId: ${stackId}. Known stacks: ${knownStacks}`);
  }
}

function createReadme(stackId: string, browsers: string[]): string {
  const browserList = browsers.length > 0 ? browsers.map((id) => `- ${id}`).join('\\n') : '- none';
  return `# ${STACK_DEFAULTS[stackId].displayName}\\n\\n${STACK_DEFAULTS[stackId].description}\\n\\n` +
    '## Safety checklist\\n\\n' +
    '- Update sidecar passwords before inviting students.\\n' +
    '- Keep all forwarded ports in **Private** mode unless explicitly required otherwise.\\n' +
    '- Share the `/classroom-browser` link with Chromebook/iPad users.\\n\\n' +
    '## Included browsers\\n\\n' +
    `${browserList}\\n\\n` +
    '## Running locally\\n\\n' +
    'Use VS Code Dev Containers or GitHub Codespaces to open the workspace.\\n';
}

function createClassroomBrowserReadme(): string {
  return '# Classroom Browser\\n\\n' +
    'This directory is a placeholder for static assets that can be served to students as an entry point.\\n\\n' +
    '- Default credentials are defined via environment variables (e.g. `NEKO_PASSWORD`).\\n' +
    '- Always rotate the password before the first lesson.\\n' +
    '- Remind students to keep their ports in Private visibility mode unless your policy says otherwise.\\n';
}

function createDevcontainerJson(stackId: string, browsers: string[]): string {
  const composeFile = '.devcontainer/docker-compose.yml';
  const basePorts = STACK_DEFAULTS[stackId].ports.map((port) => port.port);
  const extraPorts = browsers.map((browserId) => {
    const browserPort = BROWSER_PORTS[browserId];
    if (!browserPort) {
      throw new Error(`Unsupported browser sidecar: ${browserId}`);
    }
    return browserPort.port;
  });
  const remoteEnv = browsers.reduce<Record<string, string>>((acc, browserId) => {
    const envVar = browserId.startsWith('kasm') ? 'KASM_PASSWORD' : 'NEKO_PASSWORD';
    acc[envVar] = '${' + envVar + ':-ChangeThisPassword!}';
    return acc;
  }, {});

  return JSON.stringify(
    {
      name: STACK_DEFAULTS[stackId].displayName,
      dockerComposeFile: [composeFile],
      service: 'workspace',
      postCreateCommand: 'npm install',
      customizations: {
        vscode: {
          settings: {
            'terminal.integrated.defaultProfile.linux': 'bash'
          },
          extensions: ['ms-azuretools.vscode-docker', 'esbenp.prettier-vscode']
        }
      },
      forwardPorts: [...basePorts, ...extraPorts],
      remoteEnv: Object.keys(remoteEnv).length ? remoteEnv : undefined
    },
    null,
    2
  );
}

function createComposeFile(stackId: string, browsers: string[]): string {
  const stackPorts = STACK_DEFAULTS[stackId].ports;
  const browserServices = browsers
    .map((browserId) => {
      const baseImage = browserId.startsWith('kasm')
        ? 'ghcr.io/linuxserver/kasm:chrome'
        : browserId === 'neko-firefox'
        ? 'ghcr.io/m1k1o/neko:firefox'
        : 'ghcr.io/m1k1o/neko:chrome';
      const envVar = browserId.startsWith('kasm') ? 'KASM_PASSWORD' : 'NEKO_PASSWORD';
      const port = BROWSER_PORTS[browserId]?.port ?? 0;
      return `  ${browserId}:\\n` +
        `    image: ${baseImage}\\n` +
        '    restart: unless-stopped\\n' +
        '    environment:\\n' +
        `      - ${envVar}=\\${${envVar}:-ChangeThisPassword!}\\n` +
        '    ports:\\n' +
        `      - "${port}:${port}"\\n` +
        '    labels:\\n' +
        '      - "devcontainer.metadata=true"\\n';
    })
    .join('\\n');

  const workspacePorts = stackPorts
    .map((port) => `      - "${port.port}:${port.port}"`)
    .join('\\n');

  return "version: '3.8'\\n" +
    'services:\\n' +
    '  workspace:\\n' +
    '    build:\\n' +
    '      context: ..\\n' +
    '      dockerfile: Dockerfile\\n' +
    '    volumes:\\n' +
    '      - ..:/workspace:cached\\n' +
    '    command: sleep infinity\\n' +
    '    ports:\\n' +
    workspacePorts +
    '\\n' +
    (browserServices ? browserServices + '\\n' : '');
}

function createDockerfile(): string {
  return 'FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm\\n\\n' +
    'RUN mkdir -p /workspace && chown node:node /workspace\\n';
}

export async function generateCatalogWorkspace(input: GeneratorInput): Promise<GeneratorOutput> {
  ensureStack(input.stackId);

  const outDir = mkdtempSync(path.join(os.tmpdir(), 'catalog-workspace-'));
  await mkdir(outDir, { recursive: true });
  await mkdir(path.join(outDir, '.devcontainer'), { recursive: true });
  await mkdir(path.join(outDir, 'classroom-browser'), { recursive: true });

  const manifestPorts: WorkspacePort[] = [
    ...STACK_DEFAULTS[input.stackId].ports,
    ...input.browsers.map((browserId) => {
      const port = BROWSER_PORTS[browserId];
      if (!port) {
        throw new Error(`Unsupported browser sidecar: ${browserId}`);
      }
      return port;
    })
  ];

  const manifest: WorkspaceManifest = {
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    stackId: input.stackId,
    catalogCommit: input.pin,
    browsers: input.browsers,
    ports: manifestPorts,
    env: [
      {
        name: 'NEKO_PASSWORD',
        description: 'Password for neko-based browser sidecars',
        required: input.browsers.some((id) => id.startsWith('neko'))
      },
      {
        name: 'KASM_PASSWORD',
        description: 'Password for kasm-based browser sidecars',
        required: input.browsers.some((id) => id.startsWith('kasm'))
      }
    ].filter((envVar) => envVar.required),
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
  const devcontainerJson = createDevcontainerJson(input.stackId, input.browsers);
  writeFileSync(path.join(outDir, '.devcontainer/devcontainer.json'), devcontainerJson, 'utf-8');
  const composeFile = createComposeFile(input.stackId, input.browsers);
  writeFileSync(path.join(outDir, '.devcontainer/docker-compose.yml'), composeFile, 'utf-8');
  const dockerfile = createDockerfile();
  writeFileSync(path.join(outDir, 'Dockerfile'), dockerfile, 'utf-8');

  const manifestPath = path.join(outDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  validateManifest(manifest);

  return {
    outDir,
    manifestPath,
    manifestJson: manifest
  };
}

export function cleanupGeneratedWorkspace(output: GeneratorOutput): void {
  rmSync(output.outDir, { recursive: true, force: true });
}
