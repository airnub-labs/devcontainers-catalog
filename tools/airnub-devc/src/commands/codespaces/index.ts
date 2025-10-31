import { Command } from "commander";
import chalk from "chalk";
import {
  type AuthMode,
  type CreateCodespaceRequest,
  type PortRequest,
  type RepoRef,
  makeCodespacesAdapter
} from "@airnub/sdk-codespaces-adapter";

type GlobalAuthOptions = {
  apiUrl?: string;
};

type RepoOption = { repo?: string; ref?: string };

type PortsOption = { ports?: string[] };

type KeyValueOption = { env?: string[]; secret?: string[] };

function resolveAuth(): AuthMode {
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (appId && installationId && privateKey) {
    return {
      kind: "github-app",
      appId: Number(appId),
      installationId: Number(installationId),
      privateKeyPem: privateKey
    };
  }

  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (!token) {
    throw new Error("Set GITHUB_TOKEN or GH_TOKEN for GitHub API access.");
  }
  return { kind: "pat", token };
}

function parseRepo(opts: RepoOption): RepoRef {
  if (!opts.repo) {
    throw new Error("--repo <owner/repo> is required");
  }
  const match = opts.repo.match(/^([^/]+)\/([^#]+)(?:#(.+))?$/);
  if (!match) {
    throw new Error(`Invalid repo format '${opts.repo}'. Use owner/repo or owner/repo#ref.`);
  }
  const [, owner, repo, refFromRepo] = match;
  const ref = opts.ref ?? refFromRepo ?? undefined;
  return { owner, repo, ref };
}

function parsePorts(option: PortsOption): PortRequest[] {
  if (!option.ports?.length) return [];
  return option.ports.map((value) => {
    const [portStr, visibility = "private", label] = value.split(":");
    const port = Number(portStr);
    if (!Number.isInteger(port)) {
      throw new Error(`Invalid port specification '${value}'. Use <port>:<visibility>[:label].`);
    }
    const normalizedVisibility = visibility as PortRequest["visibility"];
    if (![`private`, `org`, `public`].includes(normalizedVisibility)) {
      throw new Error(`Unsupported visibility '${visibility}' in '${value}'.`);
    }
    return { port, visibility: normalizedVisibility, label: label?.trim() || undefined };
  });
}

function parseKeyValue(values: string[] | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of values ?? []) {
    const idx = entry.indexOf("=");
    if (idx === -1) {
      throw new Error(`Expected KEY=VALUE format but received '${entry}'.`);
    }
    const key = entry.slice(0, idx);
    const value = entry.slice(idx + 1);
    result[key] = value;
  }
  return result;
}

async function withAdapter<T>(opts: GlobalAuthOptions, fn: (adapter: ReturnType<typeof makeCodespacesAdapter>) => Promise<T>) {
  const adapter = makeCodespacesAdapter({ baseUrl: opts.apiUrl });
  const auth = resolveAuth();
  await adapter.ensureAuth(auth, { baseUrl: opts.apiUrl });
  return fn(adapter);
}

function formatCodespaceTable(spaces: Array<{ name: string; state: string; repo: RepoRef; machine?: string; webUrl: string }>) {
  if (!spaces.length) {
    console.log(chalk.yellow("No codespaces match the requested filters."));
    return;
  }
  console.log(chalk.bold(`${"Name".padEnd(24)} ${"State".padEnd(12)} ${"Machine".padEnd(18)} Repository`));
  for (const cs of spaces) {
    const machine = cs.machine ?? "default";
    console.log(`${cs.name.padEnd(24)} ${cs.state.padEnd(12)} ${machine.padEnd(18)} ${cs.repo.owner}/${cs.repo.repo}`);
    console.log(`  ${chalk.blue(cs.webUrl)}`);
  }
}

export function registerCodespacesCommands(program: Command): void {
  const codespaces = program.command("codespaces").description("Manage GitHub Codespaces");

  codespaces
    .command("list")
    .description("List accessible codespaces")
    .option("--repo <owner/repo>", "filter by repository")
    .option("--state <state>", "filter by state")
    .option("--api-url <url>", "GitHub API URL for Enterprise")
    .action(async (opts: { repo?: string; state?: string; apiUrl?: string }) => {
      const repoFilter = opts.repo ? parseRepo({ repo: opts.repo }) : undefined;
      await withAdapter({ apiUrl: opts.apiUrl }, async (adapter) => {
        const spaces = await adapter.listCodespaces({
          owner: repoFilter?.owner,
          repo: repoFilter?.repo,
          state: opts.state
        });
        formatCodespaceTable(spaces);
      });
    });

  codespaces
    .command("get")
    .description("Show codespace details")
    .argument("<name>", "codespace name")
    .option("--api-url <url>", "GitHub API URL for Enterprise")
    .action(async (name: string, opts: GlobalAuthOptions) => {
      await withAdapter({ apiUrl: opts.apiUrl }, async (adapter) => {
        const space = await adapter.getCodespaceByName(name);
        if (!space) {
          console.error(chalk.red(`Codespace ${name} not found.`));
          process.exitCode = 1;
          return;
        }
        console.log(JSON.stringify(space, null, 2));
      });
    });

  codespaces
    .command("create")
    .description("Create a new codespace")
    .requiredOption("--repo <owner/repo>", "target repository")
    .option("--ref <ref>", "git ref to provision")
    .option("--devcontainer-path <path>", "path to devcontainer.json")
    .option("--display-name <name>", "codespace display name")
    .option("--machine <type>", "machine type")
    .option("--region <name>", "preferred region")
    .option("--idle-timeout <minutes>", "idle timeout in minutes", (value) => Number(value))
    .option("--retention <minutes>", "retention period in minutes", (value) => Number(value))
    .option("--ports <spec>", "port mapping <port>:<visibility>[:label]", (value, previous: string[] = []) => {
      previous.push(value);
      return previous;
    }, [])
    .option("--env <KEY=VALUE>", "environment variable", (value, previous: string[] = []) => {
      previous.push(value);
      return previous;
    }, [])
    .option("--secret <KEY=VALUE>", "secret value to encrypt", (value, previous: string[] = []) => {
      previous.push(value);
      return previous;
    }, [])
    .option("--start-immediately", "start codespace after provisioning", true)
    .option("--school-mode", "enforce private ports", true)
    .option("--api-url <url>", "GitHub API URL for Enterprise")
    .action(async (opts: CreateOptions & GlobalAuthOptions & PortsOption & KeyValueOption) => {
      const repo = parseRepo(opts);
      const ports = parsePorts(opts);
      const environmentVariables = parseKeyValue(opts.env);
      const secrets = parseKeyValue(opts.secret);
      const request: CreateCodespaceRequest = {
        repo,
        devcontainerPath: opts.devcontainerPath,
        displayName: opts.displayName,
        machine: opts.machine,
        region: opts.region,
        idleTimeoutMinutes: opts.idleTimeout,
        retentionPeriodMinutes: opts.retention,
        environmentVariables: Object.keys(environmentVariables).length ? environmentVariables : undefined,
        secrets: Object.keys(secrets).length ? secrets : undefined,
        ports,
        startImmediately: opts.startImmediately,
        schoolMode: opts.schoolMode
      };

      await withAdapter({ apiUrl: opts.apiUrl }, async (adapter) => {
        const plan = await adapter.planCreate(request);
        if (plan.notes.length) {
          console.log(chalk.gray("Plan notes:"));
          for (const note of plan.notes) {
            const color = note.level === "error" ? chalk.red : note.level === "warn" ? chalk.yellow : chalk.blue;
            console.log(` - ${color(note.level.toUpperCase())}: ${note.message}`);
          }
        }
        if (!plan.actions.length) {
          console.error(chalk.red("Plan contains errors; creation skipped."));
          process.exitCode = 1;
          return;
        }
        const space = await adapter.create(request);
        console.log(chalk.green(`Codespace created: ${space.name} (${space.state})`));
        console.log(space.webUrl);
      });
    });

  codespaces
    .command("start")
    .description("Start a stopped codespace")
    .argument("<name>", "codespace name")
    .option("--api-url <url>", "GitHub API URL for Enterprise")
    .action(async (name: string, opts: GlobalAuthOptions) => {
      await withAdapter({ apiUrl: opts.apiUrl }, async (adapter) => {
        const space = await adapter.start({ name });
        console.log(chalk.green(`Codespace ${space.name} is ${space.state}`));
      });
    });

  codespaces
    .command("stop")
    .description("Stop a running codespace")
    .argument("<name>", "codespace name")
    .option("--api-url <url>", "GitHub API URL for Enterprise")
    .action(async (name: string, opts: GlobalAuthOptions) => {
      await withAdapter({ apiUrl: opts.apiUrl }, async (adapter) => {
        await adapter.stop({ name });
        console.log(chalk.yellow(`Stop signal sent to ${name}`));
      });
    });

  codespaces
    .command("delete")
    .description("Delete a codespace")
    .argument("<name>", "codespace name")
    .option("--api-url <url>", "GitHub API URL for Enterprise")
    .action(async (name: string, opts: GlobalAuthOptions) => {
      await withAdapter({ apiUrl: opts.apiUrl }, async (adapter) => {
        await adapter.delete({ name });
        console.log(chalk.red(`Deleted codespace ${name}`));
      });
    });

  codespaces
    .command("ports")
    .description("Update codespace port visibility")
    .argument("<name>", "codespace name")
    .requiredOption("--ports <spec>", "port mapping <port>:<visibility>[:label]", (value, previous: string[] = []) => {
      previous.push(value);
      return previous;
    }, [])
    .option("--api-url <url>", "GitHub API URL for Enterprise")
    .action(async (name: string, opts: PortsOption & GlobalAuthOptions) => {
      const ports = parsePorts(opts);
      await withAdapter({ apiUrl: opts.apiUrl }, async (adapter) => {
        await adapter.setPorts({ name }, ports);
        console.log(chalk.green(`Updated ports for ${name}`));
      });
    });

  codespaces
    .command("secrets")
    .description("Set codespaces secrets")
    .requiredOption("--scope <scope>", "secret scope repo|org|user")
    .option("--repo <owner/repo>", "repository context for repo scope")
    .option("--org <org>", "organization context for org scope")
    .requiredOption("--secret <KEY=VALUE>", "secret name and value", (value, previous: string[] = []) => {
      previous.push(value);
      return previous;
    }, [])
    .option("--api-url <url>", "GitHub API URL for Enterprise")
    .action(async (opts: { scope: "repo" | "org" | "user"; org?: string } & RepoOption & KeyValueOption & GlobalAuthOptions) => {
      const entries = parseKeyValue(opts.secret);
      await withAdapter({ apiUrl: opts.apiUrl }, async (adapter) => {
        const ctx: { repo?: RepoRef; org?: string } = {};
        if (opts.scope === "repo") {
          ctx.repo = parseRepo(opts);
        } else if (opts.scope === "org") {
          if (!opts.org) throw new Error("--org is required for org secrets");
          ctx.org = opts.org;
        }
        await adapter.setSecrets(opts.scope, entries, ctx);
        console.log(chalk.green(`Updated ${Object.keys(entries).length} secret(s) for ${opts.scope}`));
      });
    });
}

type CreateOptions = RepoOption & PortsOption & {
  devcontainerPath?: string;
  displayName?: string;
  machine?: string;
  region?: string;
  idleTimeout?: number;
  retention?: number;
  startImmediately?: boolean;
  schoolMode?: boolean;
};
