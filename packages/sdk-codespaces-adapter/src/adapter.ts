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

/**
 * High-level client for managing GitHub Codespaces.
 *
 * This adapter wraps the GitHub REST API and provides convenience methods
 * for common codespace operations. It handles:
 * - Authentication (PAT or GitHub App)
 * - Rate limiting with exponential backoff
 * - Polling for codespace readiness
 * - Secret encryption using libsodium
 *
 * **Lifecycle:**
 * 1. Create an adapter with {@link makeCodespacesAdapter}
 * 2. Authenticate with {@link CodespacesAdapter.ensureAuth | ensureAuth}
 * 3. Perform operations (create, list, etc.)
 *
 * @example
 * ```typescript
 * const adapter = new CodespacesAdapter();
 * await adapter.ensureAuth({ kind: "pat", token: "ghp_..." });
 *
 * const codespace = await adapter.create({
 *   repo: { owner: "airnub-labs", repo: "devcontainers-catalog" },
 *   displayName: "My Workspace",
 *   machine: "standardLinux32gb",
 *   ports: [{ port: 3000, visibility: "private", label: "App" }]
 * });
 * ```
 *
 * @see {@link makeCodespacesAdapter} for the factory function
 * @see {@link ICodespacesAdapter} for the interface contract
 * @public
 */
export class CodespacesAdapter implements ICodespacesAdapter {
  private client?: GithubClient;
  private baseUrl?: string;

  /**
   * Authenticates the adapter with GitHub.
   *
   * Must be called before any other methods. Supports:
   * - Personal Access Token (PAT)
   * - GitHub App installation tokens
   *
   * @param auth - Authentication credentials
   * @param opts - Optional configuration overrides
   * @param opts.baseUrl - Custom GitHub API URL (for Enterprise)
   * @returns Promise that resolves when authentication succeeds
   * @throws {Error} When authentication fails
   *
   * @example
   * ```typescript
   * // PAT authentication
   * await adapter.ensureAuth({ kind: "pat", token: process.env.GITHUB_TOKEN! });
   *
   * // GitHub App authentication
   * import { readFileSync } from "node:fs";
   * await adapter.ensureAuth({
   *   kind: "github-app",
   *   appId: 123456,
   *   installationId: 789012,
   *   privateKeyPem: readFileSync("private-key.pem", "utf8")
   * });
   * ```
   */
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

  /**
   * Lists codespaces accessible to the authenticated user.
   *
   * @param params - Optional filters
   * @param params.owner - Filter by repository owner
   * @param params.repo - Filter by repository name
   * @param params.state - Filter by state ("available", "stopped", etc.)
   * @returns Array of codespace info objects
   * @throws {ValidationError} When not authenticated
   */
  async listCodespaces(params?: { owner?: string; repo?: string; state?: string }) {
    return this.assertClient().listCodespaces(params);
  }

  /**
   * Retrieves a codespace by its name.
   *
   * @param name - Codespace name (e.g., `airnub-devcontainers-main-abc123`)
   * @returns Codespace info or `null` if not found
   * @throws {ValidationError} When not authenticated
   */
  async getCodespaceByName(name: string) {
    return this.assertClient().getCodespaceByName(name);
  }

  /**
   * Retrieves a codespace by its ID or name.
   *
   * Alias for {@link CodespacesAdapter.getCodespaceByName | getCodespaceByName}
   * for convenience when the identifier type is ambiguous.
   *
   * @param id - Codespace ID or name
   * @returns Codespace info or `null` if not found
   * @throws {ValidationError} When not authenticated
   */
  async getCodespace(id: string) {
    return this.assertClient().getCodespace(id);
  }

  /**
   * Lists available machine types for a repository.
   *
   * Machine types determine the CPU, memory, and storage available to the codespace.
   * Use this to present a dropdown of supported options before creation.
   *
   * @param repo - Repository reference
   * @returns Array of machine type names
   * @throws {ValidationError} When not authenticated
   */
  async listMachines(repo: RepoRef) {
    return this.assertClient().listRepoMachines(repo);
  }

  /**
   * Plans a codespace creation by validating inputs and returning actions.
   *
   * This is a dry-run method that checks:
   * - Whether the machine type is available for the repository
   * - Whether the devcontainer path exists
   * - Whether `schoolMode` conflicts with port visibility settings
   *
   * Use this to preview operations before calling {@link CodespacesAdapter.create | create}.
   *
   * @param req - Codespace creation request
   * @returns Plan with actions and validation notes
   * @throws {ValidationError} When not authenticated
   */
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

  /**
   * Creates a new GitHub Codespace.
   *
   * This method:
   * 1. Creates the codespace via the GitHub API
   * 2. Polls until the codespace is ready or stopped
   * 3. Applies port visibility settings if provided
   * 4. Returns the final codespace state
   *
   * @param req - Codespace creation request
   * @returns Created codespace information
   * @throws {ValidationError} When GitHub does not return a codespace name or the adapter is not authenticated
   */
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

  /**
   * Stops a running codespace.
   *
   * @param target - Codespace identifier (name or id)
   * @throws {ValidationError} When neither name nor id is provided or the adapter is not authenticated
   */
  async stop(target: { id?: string; name?: string }): Promise<void> {
    const name = target.name ?? target.id;
    if (!name) throw new ValidationError("codespace name or id required");
    await this.assertClient().stop(name);
  }

  /**
   * Starts a stopped codespace and waits for it to become available.
   *
   * @param target - Codespace identifier
   * @returns Updated codespace information
   * @throws {ValidationError} When neither name nor id is provided or the adapter is not authenticated
   */
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

  /**
   * Permanently deletes a codespace.
   *
   * @param target - Codespace identifier
   * @throws {ValidationError} When neither name nor id is provided or the adapter is not authenticated
   */
  async delete(target: { id?: string; name?: string }): Promise<void> {
    const name = target.name ?? target.id;
    if (!name) throw new ValidationError("codespace name or id required");
    await this.assertClient().delete(name);
  }

  /**
   * Updates port visibility and labels for a codespace.
   *
   * @param target - Codespace identifier
   * @param ports - Array of port configurations
   * @throws {ValidationError} When neither name nor id is provided or the adapter is not authenticated
   */
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

  /**
   * Sets encrypted secrets for codespaces.
   *
   * Secrets are encrypted using libsodium and the repository/org/user public key
   * before being sent to GitHub.
   *
   * @param scope - Secret scope
   * @param entries - Key-value pairs of secret names and values
   * @param ctx - Context for repo or org secrets
   * @throws {ValidationError} When required context is missing or the adapter is not authenticated
   */
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

  /**
   * Gets the web URL for a codespace.
   *
   * @param target - Codespace identifier
   * @returns Full HTTPS URL to access the codespace in a browser
   * @throws {ValidationError} When the codespace cannot be found or the adapter is not authenticated
   */
  async openUrl(target: { id?: string; name?: string }): Promise<string> {
    const name = target.name ?? target.id;
    if (!name) throw new ValidationError("codespace name or id required");
    const cs = await this.getCodespace(name);
    if (!cs) throw new ValidationError("codespace not found");
    return cs.webUrl;
  }
}

/**
 * Creates a new {@link CodespacesAdapter} instance.
 *
 * @returns A fresh adapter instance (not authenticated)
 *
 * @example
 * ```typescript
 * import { makeCodespacesAdapter } from "@airnub/sdk-codespaces-adapter";
 *
 * const adapter = makeCodespacesAdapter();
 * await adapter.ensureAuth({ kind: "pat", token: process.env.GITHUB_TOKEN! });
 * ```
 */
export function makeCodespacesAdapter(): ICodespacesAdapter {
  return new CodespacesAdapter();
}
