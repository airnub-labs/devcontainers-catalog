import { Octokit } from "@octokit/rest";
import { debug } from "debug";
import { GitHubAuthManager } from "./github-auth.js";
import { mapCodespace } from "./mappers.js";
import { CodespaceInfo, CreateCodespaceRequest, PortRequest, RepoRef } from "./types.js";
import { NotFoundError, RateLimitError } from "./errors.js";
import { sealSecret } from "./secrets.js";

const log = debug("sdk-codespaces-adapter:github-client");

type ClientOptions = { baseUrl?: string };

type ListParams = { owner?: string; repo?: string; state?: string };

type CodespaceTarget = { id?: string; name?: string };

type SecretScope = "repo" | "org" | "user";

type PublicKeyResponse = { key: string; key_id: string };

export class GitHubClient {
  private baseUrl?: string;

  constructor(private readonly auth: GitHubAuthManager, options: ClientOptions = {}) {
    this.baseUrl = options.baseUrl;
  }

  setBaseUrl(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private async octokit(): Promise<Octokit> {
    const token = await this.auth.token();
    return new Octokit({
      auth: token,
      baseUrl: this.baseUrl
    });
  }

  async ensureRepoAccess(repo: RepoRef): Promise<void> {
    await this.exec(async (client) => {
      await client.repos.get({ owner: repo.owner, repo: repo.repo });
    });
  }

  async pathExists(repo: RepoRef, path: string): Promise<boolean> {
    try {
      await this.exec(async (client) => {
        await client.request("HEAD /repos/{owner}/{repo}/contents/{path}", {
          owner: repo.owner,
          repo: repo.repo,
          path,
          ref: repo.ref,
          headers: { "If-None-Match": "" }
        });
      });
      return true;
    } catch (error) {
      if ((error as any)?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  private toKnownError(error: any): Error {
    if (error?.status === 404) {
      return new NotFoundError("Requested resource could not be found");
    }

    const retryAfter = parseInt(error?.response?.headers?.["retry-after"], 10);
    const isRateLimit = error?.status === 429 || error?.response?.headers?.["x-ratelimit-remaining"] === "0";
    if (isRateLimit) {
      return new RateLimitError("GitHub rate limit exceeded", Number.isFinite(retryAfter) ? retryAfter : undefined);
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(typeof error === "string" ? error : JSON.stringify(error));
  }

  private isRetryable(error: any): boolean {
    if (!error) return false;
    const status = error.status ?? error?.response?.status;
    if (status === 429) return true;
    if (status === 502 || status === 503 || status === 504) return true;
    const remaining = error?.response?.headers?.["x-ratelimit-remaining"];
    return remaining === "0";
  }

  private retryDelayMs(error: any, attempt: number): number {
    const retryAfter = parseInt(error?.response?.headers?.["retry-after"], 10);
    if (Number.isFinite(retryAfter)) {
      return retryAfter * 1000;
    }
    return Math.min(30_000, 1000 * 2 ** attempt);
  }

  private async exec<T>(fn: (client: Octokit) => Promise<T>): Promise<T> {
    const client = await this.octokit();
    const maxAttempts = 3;
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await fn(client);
      } catch (error) {
        if (attempt < maxAttempts - 1 && this.isRetryable(error)) {
          const waitMs = this.retryDelayMs(error, attempt);
          log("retrying request after %dms due to %o", waitMs, error?.status ?? error);
          await delay(waitMs);
          attempt += 1;
          continue;
        }
        log("GitHub request failed", error);
        throw this.toKnownError(error);
      }
    }
  }

  private filterCodespaces(list: CodespaceInfo[], params?: ListParams): CodespaceInfo[] {
    if (!params) return list;
    return list.filter((cs) => {
      const matchesOwner = params.owner ? cs.repo.owner.toLowerCase() === params.owner.toLowerCase() : true;
      const matchesRepo = params.repo ? cs.repo.repo.toLowerCase() === params.repo.toLowerCase() : true;
      const matchesState = params.state ? cs.state.toLowerCase() === params.state.toLowerCase() : true;
      return matchesOwner && matchesRepo && matchesState;
    });
  }

  async listCodespaces(params?: ListParams): Promise<CodespaceInfo[]> {
    const list = await this.exec(async (client) =>
      client.paginate(client.codespaces.listForAuthenticatedUser, { per_page: 100 }),
    );
    const mapped = list.map(mapCodespace);
    return this.filterCodespaces(mapped, params);
  }

  async getCodespaceByName(name: string): Promise<CodespaceInfo | null> {
    try {
      const response = await this.exec((client) =>
        client.codespaces.getForAuthenticatedUser({ codespace_name: name }),
      );
      return mapCodespace(response.data);
    } catch (error) {
      if ((error as any)?.name === "NotFoundError" || (error as any)?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getCodespace(id: string): Promise<CodespaceInfo | null> {
    const list = await this.listCodespaces();
    return list.find((item) => item.id === id) ?? null;
  }

  async listMachines(repo: RepoRef): Promise<string[]> {
    const response = await this.exec((client) =>
      client.request("GET /repos/{owner}/{repo}/codespaces/machines", {
        owner: repo.owner,
        repo: repo.repo,
        ref: repo.ref
      }),
    );
    return (response.data.machines ?? []).map((m: any) => m.name).filter(Boolean);
  }

  async createCodespace(req: CreateCodespaceRequest): Promise<CodespaceInfo> {
    const response = await this.exec((client) =>
      client.request("POST /repos/{owner}/{repo}/codespaces", {
        owner: req.repo.owner,
        repo: req.repo.repo,
        ref: req.repo.ref,
        devcontainer_path: req.devcontainerPath,
        display_name: req.displayName,
        machine: req.machine,
        location: req.region,
        idle_timeout_minutes: req.idleTimeoutMinutes,
        retention_period_minutes: req.retentionPeriodMinutes,
        env: req.environmentVariables,
        secrets: req.secrets,
        ports: req.ports?.map((p) => ({
          port: p.port,
          visibility: p.visibility,
          display_name: p.label
        })),
        start_codespace: req.startImmediately ?? true
      }),
    );
    return mapCodespace(response.data);
  }

  async startCodespace(target: CodespaceTarget): Promise<CodespaceInfo> {
    const name = await this.resolveName(target);
    const response = await this.exec((client) =>
      client.request("POST /user/codespaces/{codespace_name}/start", {
        codespace_name: name
      }),
    );
    return mapCodespace(response.data);
  }

  async stopCodespace(target: CodespaceTarget): Promise<void> {
    const name = await this.resolveName(target);
    await this.exec((client) =>
      client.request("POST /user/codespaces/{codespace_name}/stop", {
        codespace_name: name
      }),
    );
  }

  async deleteCodespace(target: CodespaceTarget): Promise<void> {
    const name = await this.resolveName(target);
    await this.exec((client) =>
      client.request("DELETE /user/codespaces/{codespace_name}", {
        codespace_name: name
      }),
    );
  }

  async updatePorts(target: CodespaceTarget, ports: PortRequest[]): Promise<void> {
    if (!ports.length) return;
    const name = await this.resolveName(target);
    await this.exec(async (client) => {
      for (const port of ports) {
        await client.request("PATCH /user/codespaces/{codespace_name}/ports/{port}", {
          codespace_name: name,
          port: port.port,
          visibility: port.visibility,
          display_name: port.label
        });
      }
    });
  }

  async setSecrets(scope: SecretScope, entries: Record<string, string>, ctx?: { repo?: RepoRef; org?: string }): Promise<void> {
    if (!entries || Object.keys(entries).length === 0) return;
    await this.exec(async (client) => {
      const key = await this.fetchPublicKey(client, scope, ctx);
      for (const [name, value] of Object.entries(entries)) {
        const encrypted = sealSecret(key.key, value);
        await this.putSecret(client, scope, name, encrypted, key.key_id, ctx);
      }
    });
  }

  async openUrl(target: CodespaceTarget): Promise<string> {
    const name = await this.resolveName(target);
    const codespace = await this.getCodespaceByName(name);
    if (!codespace) {
      throw new NotFoundError(`Codespace ${name} not found`);
    }
    return codespace.webUrl;
  }

  private async resolveName(target: CodespaceTarget): Promise<string> {
    if (target.name) return target.name;
    if (!target.id) {
      throw new NotFoundError("Codespace target must include id or name");
    }
    const codespace = await this.getCodespace(target.id);
    if (!codespace) {
      throw new NotFoundError(`Codespace with id ${target.id} not found`);
    }
    return codespace.name;
  }

  private async fetchPublicKey(client: Octokit, scope: SecretScope, ctx?: { repo?: RepoRef; org?: string }): Promise<PublicKeyResponse> {
    if (scope === "repo") {
      if (!ctx?.repo) throw new NotFoundError("Repository context required for repo secrets");
      const response = await client.request("GET /repos/{owner}/{repo}/codespaces/secrets/public-key", {
        owner: ctx.repo.owner,
        repo: ctx.repo.repo
      });
      return response.data as PublicKeyResponse;
    }

    if (scope === "org") {
      if (!ctx?.org) throw new NotFoundError("Organization context required for org secrets");
      const response = await client.request("GET /orgs/{org}/codespaces/secrets/public-key", {
        org: ctx.org
      });
      return response.data as PublicKeyResponse;
    }

    const response = await client.request("GET /user/codespaces/secrets/public-key", {});
    return response.data as PublicKeyResponse;
  }

  private async putSecret(
    client: Octokit,
    scope: SecretScope,
    name: string,
    encryptedValue: string,
    keyId: string,
    ctx?: { repo?: RepoRef; org?: string }
  ): Promise<void> {
    const payload = {
      secret_name: name,
      encrypted_value: encryptedValue,
      key_id: keyId
    } as any;

    if (scope === "repo") {
      const repo = ctx?.repo;
      if (!repo) throw new NotFoundError("Repository context required for repo secrets");
      await client.request("PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name}", {
        owner: repo.owner,
        repo: repo.repo,
        ...payload
      });
      return;
    }

    if (scope === "org") {
      const org = ctx?.org;
      if (!org) throw new NotFoundError("Organization context required for org secrets");
      await client.request("PUT /orgs/{org}/codespaces/secrets/{secret_name}", {
        org,
        ...payload
      });
      return;
    }

    await client.request("PUT /user/codespaces/secrets/{secret_name}", payload);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
