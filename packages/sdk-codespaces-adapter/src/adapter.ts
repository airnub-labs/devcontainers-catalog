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
  RepoRef,
  UpdatePortsRequest
} from "./types.js";
import { ValidationError } from "./errors.js";

const DEFAULT_POLL_INTERVAL = 5000;
const DEFAULT_POLL_TIMEOUT = 180_000;

export class CodespacesAdapter implements ICodespacesAdapter {
  private readonly auth: GitHubAuthManager;
  private readonly client: GitHubClient;
  private readonly pollInterval: number;
  private readonly pollTimeout: number;

  constructor(private readonly options: AdapterOptions = {}) {
    this.auth = new GitHubAuthManager({ baseUrl: options.baseUrl });
    this.client = new GitHubClient(this.auth, { baseUrl: options.baseUrl });
    this.pollInterval = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL;
    this.pollTimeout = options.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT;
  }

  async ensureAuth(auth: AuthMode): Promise<void> {
    await this.auth.ensure(auth);
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
      await this.client.updatePorts({ name: codespaceName }, portsResult.ports);
    }

    const finalState = await this.client.getCodespaceByName(codespaceName);
    if (!finalState) {
      throw new ValidationError(`Codespace ${codespaceName} could not be retrieved after creation`);
    }
    return finalState;
  }

  async stop(target: { id?: string; name?: string }): Promise<void> {
    await this.client.stopCodespace(target);
  }

  async start(target: { id?: string; name?: string }): Promise<CodespaceInfo> {
    return this.client.startCodespace(target);
  }

  async delete(target: { id?: string; name?: string }): Promise<void> {
    await this.client.deleteCodespace(target);
  }

  async setPorts(target: { id?: string; name?: string }, ports: UpdatePortsRequest): Promise<void> {
    const result = normalizePortRequests(ports);
    await this.client.updatePorts(target, result.ports);
  }

  async setSecrets(
    scope: "repo" | "org" | "user",
    entries: Record<string, string>,
    ctx?: { repo?: RepoRef; org?: string }
  ): Promise<void> {
    await this.client.setSecrets(scope, entries, ctx);
  }

  async openUrl(target: { id?: string; name?: string }): Promise<string> {
    return this.client.openUrl(target);
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
