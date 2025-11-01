import type { Octokit } from "@octokit/rest";
import type { RepoRef } from "./types.js";
import { RateLimitError } from "./errors.js";

async function withBackoff<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      const headers = error?.response?.headers ?? {};
      const retryAfter = Number(headers["retry-after"] ?? headers["Retry-After"]);
      if (status === 403 && (headers["x-ratelimit-remaining"] === "0" || !Number.isNaN(retryAfter))) {
        const delay = !Number.isNaN(retryAfter)
          ? retryAfter * 1000
          : Math.min(30000, 1000 * Math.pow(2, attempt));
        if (attempt > 5) {
          throw new RateLimitError("GitHub API rate limit exceeded", Number.isNaN(retryAfter) ? undefined : retryAfter);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
}

export class GithubClient {
  constructor(private readonly octokit: Octokit) {}

  async listCodespaces(params?: { owner?: string; repo?: string; state?: string }) {
    if (!params?.owner || !params?.repo) {
      const res: any = await withBackoff(() => this.octokit.request("GET /user/codespaces", params ?? {}));
      return res.data.codespaces ?? [];
    }
    const res: any = await withBackoff(() =>
      this.octokit.request("GET /repos/{owner}/{repo}/codespaces", {
        owner: params.owner!,
        repo: params.repo!,
        state: params?.state
      })
    );
    return res.data.codespaces ?? [];
  }

  async getCodespaceByName(name: string) {
    try {
      const res: any = await withBackoff(() =>
        this.octokit.request("GET /user/codespaces/{codespace_name}", { codespace_name: name })
      );
      return res.data;
    } catch (error: any) {
      if (error?.status === 404) return null;
      throw error;
    }
  }

  async getCodespace(id: string) {
    return this.getCodespaceByName(id);
  }

  async listRepoMachines(repo: RepoRef) {
    const res: any = await withBackoff(() =>
      this.octokit.request("GET /repos/{owner}/{repo}/codespaces/machines", {
        owner: repo.owner,
        repo: repo.repo,
        ref: repo.ref
      })
    );
    return (res.data.machines ?? [])
      .map((machine: any) => machine.name ?? machine.display_name ?? machine.machine_type ?? "")
      .filter((name: string) => Boolean(name));
  }

  async devcontainerExists(repo: RepoRef, devcontainerPath?: string) {
    if (!devcontainerPath) return true;
    try {
      const res: any = await withBackoff(() =>
        this.octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
          owner: repo.owner,
          repo: repo.repo,
          path: devcontainerPath,
          ref: repo.ref
        })
      );
      return Boolean(res);
    } catch (error: any) {
      if (error?.status === 404) return false;
      throw error;
    }
  }

  async createCodespace(req: {
    repo: RepoRef;
    displayName?: string;
    machine?: string;
    devcontainerPath?: string;
    location?: string;
    idleTimeoutMinutes?: number;
    retentionPeriodMinutes?: number;
    env?: Record<string, string>;
  }) {
    return withBackoff(() =>
      this.octokit.request("POST /repos/{owner}/{repo}/codespaces", {
        owner: req.repo.owner,
        repo: req.repo.repo,
        ref: req.repo.ref,
        display_name: req.displayName,
        machine: req.machine,
        devcontainer_path: req.devcontainerPath,
        location: req.location,
        idle_timeout_minutes: req.idleTimeoutMinutes,
        retention_period_minutes: req.retentionPeriodMinutes,
        env: req.env
      })
    );
  }

  async start(name: string) {
    return withBackoff(() =>
      this.octokit.request("POST /user/codespaces/{codespace_name}/start", { codespace_name: name })
    );
  }

  async stop(name: string) {
    return withBackoff(() =>
      this.octokit.request("POST /user/codespaces/{codespace_name}/stop", { codespace_name: name })
    );
  }

  async delete(name: string) {
    return withBackoff(() =>
      this.octokit.request("DELETE /user/codespaces/{codespace_name}", { codespace_name: name })
    );
  }

  async userPublicKey() {
    const res: any = await withBackoff(() =>
      this.octokit.request("GET /user/codespaces/secrets/public-key")
    );
    return res.data as { key_id: string; key: string };
  }

  async orgPublicKey(org: string) {
    const res: any = await withBackoff(() =>
      this.octokit.request("GET /orgs/{org}/codespaces/secrets/public-key", { org })
    );
    return res.data as { key_id: string; key: string };
  }

  async repoPublicKey(repo: RepoRef) {
    const res: any = await withBackoff(() =>
      this.octokit.request("GET /repos/{owner}/{repo}/codespaces/secrets/public-key", {
        owner: repo.owner,
        repo: repo.repo
      })
    );
    return res.data as { key_id: string; key: string };
  }

  async putUserSecret(name: string, encrypted_value: string, key_id: string) {
    await withBackoff(() =>
      this.octokit.request("PUT /user/codespaces/secrets/{secret_name}", {
        secret_name: name,
        encrypted_value,
        key_id
      })
    );
  }

  async putOrgSecret(org: string, name: string, encrypted_value: string, key_id: string) {
    await withBackoff(() =>
      this.octokit.request("PUT /orgs/{org}/codespaces/secrets/{secret_name}", {
        org,
        secret_name: name,
        encrypted_value,
        key_id
      })
    );
  }

  async putRepoSecret(repo: RepoRef, name: string, encrypted_value: string, key_id: string) {
    await withBackoff(() =>
      this.octokit.request("PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name}", {
        owner: repo.owner,
        repo: repo.repo,
        secret_name: name,
        encrypted_value,
        key_id
      })
    );
  }
}
