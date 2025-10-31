import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { debug } from "debug";
import { GitHubAuthManager } from "./github-auth.js";
import { GitHubClient } from "./github-client.js";
import { buildCreatePlan } from "./plan.js";
import { normalizePortRequests } from "./ports.js";
import type {
  AdapterOptions,
  AuthMode,
  CodespaceInfo,
  CreateCodespaceRequest,
  ICodespacesAdapter,
  Plan,
  PortRequest,
  RepoRef
} from "./types.js";
import { CliError, CliNotFoundError, ValidationError } from "./errors.js";

const DEFAULT_POLL_INTERVAL = 5_000;
const DEFAULT_POLL_TIMEOUT = 180_000;
const execFileAsync = promisify(execFile);
const log = debug("sdk-codespaces-adapter:adapter");

type CodespaceTarget = { id?: string; name?: string };

type GhResult = { stdout: string; stderr: string };

export class CodespacesAdapter implements ICodespacesAdapter {
  private auth: GitHubAuthManager;
  private client: GitHubClient;
  private readonly pollInterval: number;
  private readonly pollTimeout: number;

  constructor(private readonly options: AdapterOptions = {}) {
    this.auth = new GitHubAuthManager({ baseUrl: options.baseUrl });
    this.client = new GitHubClient(this.auth, { baseUrl: options.baseUrl });
    this.pollInterval = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL;
    this.pollTimeout = options.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT;
  }

  async ensureAuth(auth: AuthMode, opts?: { baseUrl?: string }): Promise<void> {
    const baseUrl = opts?.baseUrl ?? this.options.baseUrl;
    await this.auth.ensure(auth, { baseUrl });
    this.client.setBaseUrl(baseUrl);
  }

  async listCodespaces(params?: { owner?: string; repo?: string; state?: string }): Promise<CodespaceInfo[]> {
    return this.client.listCodespaces(params);
  }

  async getCodespaceByName(name: string): Promise<CodespaceInfo | null> {
    return this.client.getCodespaceByName(name);
  }

  async getCodespace(id: string): Promise<CodespaceInfo | null> {
    return this.client.getCodespace(id);
  }

  async listMachines(repo: RepoRef): Promise<string[]> {
    return this.client.listMachines(repo);
  }

  async planCreate(req: CreateCodespaceRequest): Promise<Plan> {
    return buildCreatePlan(this.client, req);
  }

  async create(req: CreateCodespaceRequest): Promise<CodespaceInfo> {
    await this.client.ensureRepoAccess(req.repo);

    if (req.secrets && Object.keys(req.secrets).length) {
      await this.client.setSecrets("repo", req.secrets, { repo: req.repo });
    }

    const portsResult = normalizePortRequests(req.ports);

    const creationResponse = await this.client.createCodespace({
      ...req,
      startImmediately: req.startImmediately ?? true,
      ports: portsResult.ports
    });

    const codespaceName = creationResponse.name;
    const deadline = Date.now() + this.pollTimeout;
    let currentState = creationResponse.state;

    while (!isReadyState(currentState)) {
      if (Date.now() > deadline) {
        throw new ValidationError(`Timed out waiting for Codespace ${codespaceName} to become available`);
      }
      await delay(this.pollInterval);
      const refreshed = await this.client.getCodespaceByName(codespaceName);
      if (!refreshed) {
        throw new ValidationError(`Codespace ${codespaceName} disappeared during provisioning`);
      }
      currentState = refreshed.state;
    }

    if (portsResult.ports.length) {
      await this.setPorts({ name: codespaceName }, portsResult.ports);
    }

    const finalState = await this.client.getCodespaceByName(codespaceName);
    if (!finalState) {
      throw new ValidationError(`Codespace ${codespaceName} could not be retrieved after creation`);
    }
    return finalState;
  }

  async stop(target: CodespaceTarget): Promise<void> {
    await this.client.stopCodespace(target);
  }

  async start(target: CodespaceTarget): Promise<CodespaceInfo> {
    return this.client.startCodespace(target);
  }

  async delete(target: CodespaceTarget): Promise<void> {
    await this.client.deleteCodespace(target);
  }

  async setPorts(target: CodespaceTarget, ports: PortRequest[]): Promise<void> {
    const result = normalizePortRequests(ports);
    if (!result.ports.length) {
      return;
    }

    const name = await this.resolveCodespaceName(target);
    for (const port of result.ports) {
      await this.runGh(["codespace", "ports", "visibility", `${port.port}:${port.visibility}`, "--codespace", name]);
      if (port.label) {
        try {
          await this.runGh([
            "codespace",
            "ports",
            "update",
            "--codespace",
            name,
            "--port",
            String(port.port),
            "--label",
            port.label
          ]);
        } catch (error) {
          if (error instanceof CliNotFoundError) {
            throw error;
          }
          log("Failed to set label for port %d: %o", port.port, error);
        }
      }
    }
  }

  async setSecrets(
    scope: "repo" | "org" | "user",
    entries: Record<string, string>,
    ctx?: { repo?: RepoRef; org?: string }
  ): Promise<void> {
    await this.client.setSecrets(scope, entries, ctx);
  }

  async openUrl(target: CodespaceTarget): Promise<string> {
    const url = await this.client.openUrl(target);
    if (url) return url;
    const name = await this.resolveCodespaceName(target);
    return `https://github.com/codespaces/${encodeURIComponent(name)}`;
  }

  private async resolveCodespaceName(target: CodespaceTarget): Promise<string> {
    if (target.name) {
      return target.name;
    }
    if (!target.id) {
      throw new ValidationError("Codespace target must include id or name");
    }
    const info = await this.client.getCodespace(target.id);
    if (!info) {
      throw new ValidationError(`Codespace with id ${target.id} not found`);
    }
    return info.name;
  }

  private async runGh(args: string[]): Promise<GhResult> {
    try {
      const result = await execFileAsync("gh", args, { env: process.env });
      const stdout = result.stdout?.toString?.() ?? "";
      const stderr = result.stderr?.toString?.() ?? "";
      if (stderr.trim().length) {
        log("gh %s stderr: %s", args.join(" "), stderr.trim());
      }
      return { stdout, stderr };
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        throw new CliNotFoundError("GitHub CLI (gh) is required to manage codespace ports from this adapter.");
      }
      const stderr = error?.stderr?.toString?.() ?? "";
      const exitCode = typeof error?.exitCode === "number" ? error.exitCode : undefined;
      throw new CliError(`gh ${args.join(" ")} failed: ${stderr || error?.message || "unknown error"}`, exitCode, stderr);
    }
  }
}

function isReadyState(state: string): boolean {
  return ["available", "stopped"].includes(state);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function makeCodespacesAdapter(options?: AdapterOptions): ICodespacesAdapter {
  return new CodespacesAdapter(options);
}
