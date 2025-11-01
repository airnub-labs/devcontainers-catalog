/**
 * Authentication mode for GitHub API access.
 *
 * Supports two authentication methods:
 * - Personal Access Token (PAT) for individual accounts
 * - GitHub App installations for automation and shared infrastructure
 *
 * @example
 * ```typescript
 * const auth: AuthMode = {
 *   kind: "pat",
 *   token: process.env.GITHUB_TOKEN!
 * };
 * ```
 *
 * @example
 * ```typescript
 * import { readFileSync } from "node:fs";
 * const auth: AuthMode = {
 *   kind: "github-app",
 *   appId: 123456,
 *   installationId: 789012,
 *   privateKeyPem: readFileSync("app-private-key.pem", "utf8")
 * };
 * ```
 *
 * @public
 */
export type AuthMode =
  | { kind: "pat"; token: string }
  | { kind: "github-app"; appId: number; installationId: number; privateKeyPem: string };

/**
 * Reference to a GitHub repository.
 *
 * @example
 * ```typescript
 * const repo: RepoRef = { owner: "airnub-labs", repo: "devcontainers-catalog", ref: "main" };
 * ```
 *
 * @public
 */
export type RepoRef = { owner: string; repo: string; ref?: string };

/**
 * Codespaces region identifier.
 *
 * Regions correspond to GitHub's Codespaces deployment regions.
 *
 * @example "EastUs"
 * @public
 */
export type Region = string;

/**
 * Visibility for forwarded ports in a codespace.
 *
 * @public
 */
export type PortVisibility = "private" | "org" | "public";

/**
 * Configuration for a forwarded port in a codespace.
 *
 * @example
 * ```typescript
 * const ports: PortRequest[] = [
 *   { port: 3000, visibility: "private", label: "Next.js" },
 *   { port: 8080, visibility: "org", label: "Chrome" }
 * ];
 * ```
 *
 * @public
 */
export type PortRequest = { port: number; visibility: PortVisibility; label?: string };

/**
 * Request for creating a new GitHub Codespace.
 *
 * At minimum, you must provide a {@link RepoRef}. All other fields are optional
 * and have sensible defaults.
 *
 * @example
 * ```typescript
 * const request: CreateCodespaceRequest = {
 *   repo: { owner: "airnub-labs", repo: "devcontainers-catalog", ref: "main" },
 *   displayName: "Lesson 2 - Student Alice",
 *   machine: "standardLinux32gb",
 *   devcontainerPath: ".devcontainer/devcontainer.json",
 *   idleTimeoutMinutes: 30,
 *   retentionPeriodMinutes: 10080,
 *   ports: [{ port: 3000, visibility: "private", label: "App" }],
 *   environmentVariables: { STUDENT_ID: "alice-123" },
 *   schoolMode: true
 * };
 * ```
 *
 * @public
 */
export type CreateCodespaceRequest = {
  /** Repository reference (owner, repo, optional ref). */
  repo: RepoRef;

  /** Path to the devcontainer configuration file. */
  devcontainerPath?: string;

  /** Machine type (CPU/memory configuration). */
  machine?: string;

  /** Preferred region for the codespace. */
  region?: Region;

  /** Human-readable name for the codespace. */
  displayName?: string;

  /** Minutes of inactivity before auto-stopping the codespace. */
  idleTimeoutMinutes?: number;

  /** Minutes to retain the codespace after it is stopped. */
  retentionPeriodMinutes?: number;

  /** Environment variables to inject into the container. */
  environmentVariables?: Record<string, string>;

  /** Secrets to set before starting the codespace. */
  secrets?: Record<string, string>;

  /** Port forwarding configurations applied after creation. */
  ports?: PortRequest[];

  /** Start the codespace immediately after creation. */
  startImmediately?: boolean;

  /** Enable school mode (forces private-only ports). */
  schoolMode?: boolean;
};

/**
 * Information about a GitHub Codespace.
 *
 * @example
 * ```typescript
 * const info: CodespaceInfo = {
 *   id: "monalisa-myrepo-abc123",
 *   name: "monalisa-myrepo-abc123",
 *   state: "available",
 *   webUrl: "https://monalisa-myrepo-abc123.github.dev",
 *   createdAt: "2023-10-15T14:30:00Z",
 *   lastUsedAt: "2023-10-15T16:45:00Z",
 *   region: "EastUs",
 *   machine: "standardLinux32gb",
 *   repo: { owner: "monalisa", repo: "myrepo" }
 * };
 * ```
 *
 * @public
 */
export type CodespaceInfo = {
  /** Unique identifier. */
  id: string;

  /** Human-readable name (often same as id). */
  name: string;

  /** Codespace state such as `available`, `stopped`, or `starting`. */
  state: string;

  /** Full HTTPS URL to access the codespace in a browser. */
  webUrl: string;

  /** ISO 8601 timestamp of creation. */
  createdAt: string;

  /** ISO 8601 timestamp of last use. */
  lastUsedAt?: string;

  /** Region where the codespace is hosted. */
  region?: Region;

  /** Machine type used by the codespace. */
  machine?: string;

  /** Repository the codespace was created from. */
  repo: RepoRef;
};

/**
 * A single note in a {@link Plan}.
 *
 * @public
 */
export type PlanNote = { level: "info" | "warn" | "error"; message: string };

/**
 * Execution plan for codespace operations.
 *
 * Returned by {@link ICodespacesAdapter.planCreate} to preview actions and
 * validation notes before committing changes.
 *
 * @example
 * ```typescript
 * const plan = await adapter.planCreate({ repo, displayName, machine: "invalidMachine" });
 * plan.notes.forEach(note => console.log(`${note.level}: ${note.message}`));
 * ```
 *
 * @public
 */
export type Plan = {
  /** Ordered list of operations to execute. */
  actions: Array<
    | { op: "create-codespace"; req: CreateCodespaceRequest }
    | { op: "update-ports"; req: PortRequest[]; target: { id?: string; name?: string } }
    | { op: "stop-codespace"; target: { id?: string; name?: string } }
    | { op: "start-codespace"; target: { id?: string; name?: string } }
    | { op: "delete-codespace"; target: { id?: string; name?: string } }
    | { op: "set-secrets"; scope: "repo" | "org" | "user"; entries: string[]; repo?: RepoRef; org?: string }
  >;

  /** Validation notes and warnings associated with the plan. */
  notes: PlanNote[];
};

/**
 * Contract implemented by {@link CodespacesAdapter}.
 *
 * Implementations must support authentication, lifecycle management, and
 * secret/port configuration for Codespaces.
 *
 * @public
 */
export interface ICodespacesAdapter {
  /** Authenticate against GitHub. */
  ensureAuth(auth: AuthMode, opts?: { baseUrl?: string }): Promise<void>;

  /** List accessible codespaces. */
  listCodespaces(params?: { owner?: string; repo?: string; state?: string }): Promise<CodespaceInfo[]>;

  /** Fetch a codespace by its name. */
  getCodespaceByName(name: string): Promise<CodespaceInfo | null>;

  /** Fetch a codespace by ID or name. */
  getCodespace(id: string): Promise<CodespaceInfo | null>;

  /** List available machine types for a repository. */
  listMachines(repo: RepoRef): Promise<string[]>;

  /** Dry-run planner for codespace creation. */
  planCreate(req: CreateCodespaceRequest): Promise<Plan>;

  /** Create a codespace. */
  create(req: CreateCodespaceRequest): Promise<CodespaceInfo>;

  /** Stop a running codespace. */
  stop(target: { id?: string; name?: string }): Promise<void>;

  /** Start a codespace. */
  start(target: { id?: string; name?: string }): Promise<CodespaceInfo>;

  /** Delete a codespace. */
  delete(target: { id?: string; name?: string }): Promise<void>;

  /** Update port visibility and labels. */
  setPorts(target: { id?: string; name?: string }, ports: PortRequest[]): Promise<void>;

  /** Configure encrypted secrets for Codespaces. */
  setSecrets(
    scope: "repo" | "org" | "user",
    entries: Record<string, string>,
    ctx?: { repo?: RepoRef; org?: string }
  ): Promise<void>;

  /** Retrieve the browser URL for a codespace. */
  openUrl(target: { id?: string; name?: string }): Promise<string>;
}
