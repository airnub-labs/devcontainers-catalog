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

/**
 * Low-level GitHub REST API client for Codespaces operations.
 *
 * This class wraps Octokit and provides typed helpers for the operations used
 * by {@link CodespacesAdapter}. It normalizes rate-limit handling and error
 * behavior, returning `null` for 404s where appropriate.
 *
 * @example
 * ```typescript
 * const { octokit } = await makeOctokit({ kind: "pat", token: "ghp_..." });
 * const client = new GithubClient(octokit);
 * const codespaces = await client.listCodespaces();
 * ```
 *
 * @internal
 */
export class GithubClient {
  constructor(private readonly octokit: Octokit) {}

  /**
   * Lists codespaces accessible to the authenticated user.
   *
   * @param params - Optional owner/repo/state filters
   * @returns Raw codespace objects returned by GitHub
   */
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

  /**
   * Retrieves a codespace by its name.
   *
   * @param name - Codespace name
   * @returns Codespace data or null if not found
   */
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

  /**
   * Retrieves a codespace by ID (alias for {@link getCodespaceByName}).
   *
   * @param id - Codespace identifier
   */
  async getCodespace(id: string) {
    return this.getCodespaceByName(id);
  }

  /**
   * Lists machine types available for a repository.
   *
   * @param repo - Repository reference
   * @returns Array of machine names supported by GitHub
   */
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

  /**
   * Determines whether a devcontainer file exists in the repository.
   *
   * @param repo - Repository reference
   * @param devcontainerPath - Path to the devcontainer file
   * @returns True when the file exists, false if not found
   */
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

  /**
   * Calls the GitHub API to create a codespace.
   *
   * @param req - Request payload for the API call
   */
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

  /**
   * Starts a codespace via the GitHub API.
   *
   * @param name - Codespace name
   */
  async start(name: string) {
    return withBackoff(() =>
      this.octokit.request("POST /user/codespaces/{codespace_name}/start", { codespace_name: name })
    );
  }

  /**
   * Stops a codespace via the GitHub API.
   *
   * @param name - Codespace name
   */
  async stop(name: string) {
    return withBackoff(() =>
      this.octokit.request("POST /user/codespaces/{codespace_name}/stop", { codespace_name: name })
    );
  }

  /**
   * Deletes a codespace via the GitHub API.
   *
   * @param name - Codespace name
   */
  async delete(name: string) {
    return withBackoff(() =>
      this.octokit.request("DELETE /user/codespaces/{codespace_name}", { codespace_name: name })
    );
  }

  /**
   * Fetches the user-level Codespaces public key for secret encryption.
   */
  async userPublicKey() {
    const res: any = await withBackoff(() =>
      this.octokit.request("GET /user/codespaces/secrets/public-key")
    );
    return res.data as { key_id: string; key: string };
  }

  /**
   * Fetches the organization Codespaces public key.
   *
   * @param org - Organization login
   */
  async orgPublicKey(org: string) {
    const res: any = await withBackoff(() =>
      this.octokit.request("GET /orgs/{org}/codespaces/secrets/public-key", { org })
    );
    return res.data as { key_id: string; key: string };
  }

  /**
   * Fetches the repository Codespaces public key.
   *
   * @param repo - Repository reference
   */
  async repoPublicKey(repo: RepoRef) {
    const res: any = await withBackoff(() =>
      this.octokit.request("GET /repos/{owner}/{repo}/codespaces/secrets/public-key", {
        owner: repo.owner,
        repo: repo.repo
      })
    );
    return res.data as { key_id: string; key: string };
  }

  /**
   * Stores an encrypted user secret for Codespaces.
   */
  async putUserSecret(name: string, encrypted_value: string, key_id: string) {
    await withBackoff(() =>
      this.octokit.request("PUT /user/codespaces/secrets/{secret_name}", {
        secret_name: name,
        encrypted_value,
        key_id
      })
    );
  }

  /**
   * Stores an encrypted organization secret for Codespaces.
   *
   * @param org - Organization login
   */
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

  /**
   * Stores an encrypted repository secret for Codespaces.
   *
   * @param repo - Repository reference
   */
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
