import type {
  ICodespacesAdapter,
  AuthMode,
  CreateCodespaceRequest,
  CodespaceInfo,
  Plan,
  PortRequest,
  RepoRef
} from "./types.js";
import { ValidationError } from "./errors.js";
import { makeOctokit } from "./github-auth.js";
import { GithubClient } from "./github-client.js";
import * as Gh from "./gh.js";

export class CodespacesAdapter implements ICodespacesAdapter {
  private client?: GithubClient;
  private baseUrl?: string;

  async ensureAuth(auth: AuthMode, opts?: { baseUrl?: string }) {
    const { octokit, baseUrl } = await makeOctokit(auth, opts);
    this.client = new GithubClient(octokit);
    this.baseUrl = baseUrl;
  }

  private assertClient(): GithubClient {
    if (!this.client) {
      throw new ValidationError("ensureAuth must be called before using the adapter");
    }
    return this.client;
  }

  async listCodespaces(params?: { owner?: string; repo?: string; state?: string }) {
    return this.assertClient().listCodespaces(params);
  }

  async getCodespaceByName(name: string) {
    return this.assertClient().getCodespaceByName(name);
  }

  async getCodespace(id: string) {
    return this.assertClient().getCodespace(id);
  }

  async listMachines(repo: RepoRef) {
    return this.assertClient().listRepoMachines(repo);
  }

  async planCreate(req: CreateCodespaceRequest): Promise<Plan> {
    const client = this.assertClient();
    const notes: Plan["notes"] = [];
    const actions: Plan["actions"] = [];

    if (req.schoolMode && req.ports?.some((port) => port.visibility !== "private")) {
      notes.push({ level: "error", message: "schoolMode=true forbids public or org-visible ports" });
    }

    if (req.machine) {
      try {
        const availableMachines = await client.listRepoMachines(req.repo);
        if (!availableMachines.includes(req.machine)) {
          notes.push({
            level: "error",
            message: `Machine '${req.machine}' is not available for ${req.repo.owner}/${req.repo.repo}`
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        notes.push({ level: "warn", message: `Unable to validate machine availability: ${message}` });
      }
    }

    if (req.devcontainerPath) {
      const exists = await client.devcontainerExists(req.repo, req.devcontainerPath);
      if (!exists) {
        notes.push({ level: "warn", message: `devcontainer not found at ${req.devcontainerPath}` });
      }
    }

    actions.push({ op: "create-codespace", req });
    if (req.ports?.length) {
      actions.push({ op: "update-ports", req: req.ports, target: { name: req.displayName } });
    }

    return { actions, notes };
  }

  async create(req: CreateCodespaceRequest): Promise<CodespaceInfo> {
    const client = this.assertClient();
    const response = await client.createCodespace({
      repo: req.repo,
      displayName: req.displayName,
      machine: req.machine,
      devcontainerPath: req.devcontainerPath,
      location: req.region,
      idleTimeoutMinutes: req.idleTimeoutMinutes,
      retentionPeriodMinutes: req.retentionPeriodMinutes,
      env: req.environmentVariables
    });

    const codespaceName = (response as any)?.data?.name ?? (response as any)?.data?.codespace?.name;
    if (!codespaceName) {
      throw new ValidationError("GitHub did not return a codespace name");
    }

    const readyBy = Date.now() + 2 * 60_000;
    while (Date.now() < readyBy) {
      const state = await this.getCodespace(codespaceName);
      if (state && (state.state === "available" || state.state === "stopped")) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    if (req.ports?.length) {
      await this.setPorts({ name: codespaceName }, req.ports);
    }

    const finalState = await this.getCodespace(codespaceName);
    if (!finalState) {
      throw new ValidationError("Codespace not found after creation");
    }
    return finalState;
  }

  async stop(target: { id?: string; name?: string }): Promise<void> {
    const name = target.name ?? target.id;
    if (!name) throw new ValidationError("codespace name or id required");
    await this.assertClient().stop(name);
  }

  async start(target: { id?: string; name?: string }): Promise<CodespaceInfo> {
    const name = target.name ?? target.id;
    if (!name) throw new ValidationError("codespace name or id required");
    const client = this.assertClient();
    await client.start(name);
    const readyBy = Date.now() + 2 * 60_000;
    while (Date.now() < readyBy) {
      const refreshed = await this.getCodespace(name);
      if (refreshed && refreshed.state === "available") {
        return refreshed;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    const fallback = await this.getCodespace(name);
    if (!fallback) {
      throw new ValidationError("Codespace not found after start");
    }
    return fallback;
  }

  async delete(target: { id?: string; name?: string }): Promise<void> {
    const name = target.name ?? target.id;
    if (!name) throw new ValidationError("codespace name or id required");
    await this.assertClient().delete(name);
  }

  async setPorts(target: { id?: string; name?: string }, ports: PortRequest[]): Promise<void> {
    const name = target.name ?? target.id;
    if (!name) throw new ValidationError("codespace name or id required");
    for (const entry of ports) {
      await Gh.setPortVisibility(name, entry.port, entry.visibility);
      if (entry.label) {
        await Gh.setPortLabel(name, entry.port, entry.label);
      }
    }
  }

  async setSecrets(scope: "repo" | "org" | "user", entries: Record<string, string>, ctx?: { repo?: RepoRef; org?: string }) {
    const client = this.assertClient();
    const items = Object.entries(entries);
    if (!items.length) return;

    let key: { key_id: string; key: string };
    if (scope === "repo") {
      if (!ctx?.repo) {
        throw new ValidationError("Repository context required when setting repo secrets");
      }
      key = await client.repoPublicKey(ctx.repo);
    } else if (scope === "org") {
      if (!ctx?.org) {
        throw new ValidationError("Organization context required when setting org secrets");
      }
      key = await client.orgPublicKey(ctx.org);
    } else {
      key = await client.userPublicKey();
    }

    const { sealForGitHub } = await import("./seal.js");
    for (const [name, value] of items) {
      const { encrypted_value } = await sealForGitHub(key.key, value);
      if (scope === "repo") {
        await client.putRepoSecret(ctx!.repo!, name, encrypted_value, key.key_id);
      } else if (scope === "org") {
        await client.putOrgSecret(ctx!.org!, name, encrypted_value, key.key_id);
      } else {
        await client.putUserSecret(name, encrypted_value, key.key_id);
      }
    }
  }

  async openUrl(target: { id?: string; name?: string }): Promise<string> {
    const name = target.name ?? target.id;
    if (!name) throw new ValidationError("codespace name or id required");
    const cs = await this.getCodespace(name);
    if (!cs) throw new ValidationError("codespace not found");
    return cs.webUrl;
  }
}

export function makeCodespacesAdapter(): ICodespacesAdapter {
  return new CodespacesAdapter();
}
