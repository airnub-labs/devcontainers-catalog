# Coding Agent Prompt — SDK: CodespacesAdapter (for Comhrá)

## Goal

Add a **thin, typed SDK** inside `devcontainers-catalog` that exposes all capabilities Comhrá needs to **provision, manage, and observe** GitHub Codespaces as part of the lesson auto-scaffolding workflow. The adapter must be:

* **Stateless** (idempotent functions; no long polling baked in)
* **Pluggable** (auth via PAT *or* GitHub App installation)
* **Deterministic** (dry-run plan; stable outputs; version locked)
* **Safe for classrooms** (port visibility defaults, password checks for sidecars)
* **Tiny surface** (single interface + helpers)

> This work **does not** change runtime templates; it only provides an SDK that Comhrá calls after it invokes the catalog generator.

---

## Repo layout changes

```
root/
  packages/
    sdk-core/                  # (existing or new) shared types & utils
    sdk-codespaces-adapter/    # NEW: CodespacesAdapter (this task)
      src/
        index.ts
        adapter.ts
        github-auth.ts
        github-client.ts
        mappers.ts
        ports.ts
        plan.ts
        errors.ts
        types.ts
      test/
        adapter.spec.ts
        ports.spec.ts
        plan.spec.ts
      package.json
      tsconfig.json
      README.md
  tools/airnub-devc/
    src/lib/adapters/codespaces.ts        # re-export thin wrapper for CLI use (optional)
    src/commands/codespaces/*.ts          # new CLI commands (optional, see below)
```

---

## Public API (TypeScript)

Create `packages/sdk-codespaces-adapter/src/types.ts`:

```ts
export type AuthMode =
  | { kind: "pat"; token: string }
  | { kind: "github-app"; appId: number; installationId: number; privateKeyPem: string };

export type RepoRef = { owner: string; repo: string; ref?: string };
export type Region = "WestEurope" | "EastUS" | "SoutheastAsia" | string; // pass-through
export type PortVisibility = "private" | "org" | "public";

export type CreateCodespaceRequest = {
  repo: RepoRef;
  devcontainerPath?: string;  // path to .devcontainer/devcontainer.json
  machine?: string;           // codespaces machine type
  region?: Region;            // optional region
  displayName?: string;       // e.g. "comhra-lesson-abc-student-123"
  idleTimeoutMinutes?: number;
  retentionPeriodMinutes?: number; // auto-delete window
  environmentVariables?: Record<string, string>;
  secrets?: Record<string, string>; // names -> plaintext (adapter encrypts & sets at repo scope)
  ports?: Array<{ port: number; visibility: PortVisibility; label?: string }>;
  startImmediately?: boolean; // default true
};

export type CodespaceInfo = {
  id: string;
  name: string;             // displayName or GH name
  state: "created" | "starting" | "available" | "stopping" | "stopped" | "deleting" | "deleted" | string;
  webUrl: string;           // URL to open in browser
  createdAt: string;        // ISO
  lastUsedAt?: string;      // ISO
  region?: Region;
  machine?: string;
  repo: RepoRef;
};

export type PortRequest = { port: number; visibility: PortVisibility; label?: string };

export type PlanNote = { level: "info" | "warn" | "error"; message: string };
export type Plan = {
  actions: Array<
    | { op: "create-codespace"; req: CreateCodespaceRequest }
    | { op: "update-ports"; req: PortRequest[]; target: { id?: string; name?: string } }
    | { op: "stop-codespace"; target: { id?: string; name?: string } }
    | { op: "start-codespace"; target: { id?: string; name?: string } }
    | { op: "delete-codespace"; target: { id?: string; name?: string } }
    | { op: "set-secrets"; scope: "repo" | "org" | "user"; entries: string[]; repo?: RepoRef; org?: string }
  >;
  notes: PlanNote[];
};

export interface ICodespacesAdapter {
  ensureAuth(auth: AuthMode, opts?: { baseUrl?: string }): Promise<void>;

  // Discovery
  listCodespaces(params?: { owner?: string; repo?: string; state?: string }): Promise<CodespaceInfo[]>;
  getCodespaceByName(name: string): Promise<CodespaceInfo | null>;
  getCodespace(id: string): Promise<CodespaceInfo | null>;
  listMachines(repo: RepoRef): Promise<string[]>; // machine types for a repo

  // Lifecycle
  planCreate(req: CreateCodespaceRequest): Promise<Plan>; // dry-run
  create(req: CreateCodespaceRequest): Promise<CodespaceInfo>; // executes create (+ optional ports)
  stop(target: { id?: string; name?: string }): Promise<void>;
  start(target: { id?: string; name?: string }): Promise<CodespaceInfo>;
  delete(target: { id?: string; name?: string }): Promise<void>;

  // Configuration
  setPorts(target: { id?: string; name?: string }, ports: PortRequest[]): Promise<void>;
  setSecrets(scope: "repo" | "org" | "user", entries: Record<string,string>, ctx?: { repo?: RepoRef; org?: string }): Promise<void>;

  // Utilities
  openUrl(target: { id?: string; name?: string }): Promise<string>; // returns web URL
}
```

Create `packages/sdk-codespaces-adapter/src/index.ts` to export `ICodespacesAdapter` and a factory:

```ts
export * from "./types";
export { makeCodespacesAdapter } from "./adapter";
```

---

## Implementation Details

### `github-auth.ts`

* Provide token acquisition for **PAT** and **GitHub App** (JWT → installation token). Cache token in-memory with expiry.
* Support **enterprise** base URL via env/config (e.g., `GITHUB_API_URL`).

### `github-client.ts`

* Wrap Octokit (REST) with small helpers; respect **rate limits** and **abuse detection** backoff.
* Functions:

  * `listCodespaces`, `getCodespace`, `getCodespaceByName`
  * `createCodespace` (repo/user scoped), `startCodespace`, `stopCodespace`, `deleteCodespace`
  * `listMachinesForRepo`
  * `updatePortVisibility` / `updatePortLabel`
  * `putSecret{User,Org,Repo}` (libsodium public key → sealed box)

### `ports.ts`

* Normalize port requests; default visibility to **private**; validate ranges.
* Map **labels** to Codespaces **port display names** when supported; otherwise write note in `Plan`.

### `plan.ts`

* Build **dry-run plans** (`Plan`) from `CreateCodespaceRequest`:

  * Validate repo access and devcontainer path exists (HEAD query to repo contents API).
  * Validate machine type is available (list machines API).
  * Add notes for: default passwords detected in sidecars, public port requests, missing secrets.

### `adapter.ts`

* Implement `ICodespacesAdapter` using the above modules.
* `create(req)` steps:

  1. Ensure repo access + machine availability.
  2. Call create API (startImmediately default true).
  3. Poll until `state ∈ {"available","stopped"}` or timeout (configurable, default 3 minutes).
  4. If `ports` provided, call `setPorts`.
  5. Return `CodespaceInfo`.
* `setSecrets()` uses GitHub secrets API with proper scoping.

### `errors.ts`

* Define friendly error classes: `AuthError`, `NotFoundError`, `ValidationError`, `RateLimitError` (with retryAfter).

---

## CLI (optional, thin wrappers)

Add convenience commands to `tools/airnub-devc` that shell to the SDK (for manual ops/testing):

```
airnub-devc codespaces list --repo owner/repo
airnub-devc codespaces create --repo owner/repo --devcontainerPath .devcontainer/devcontainer.json \
  --machine standardLinux32 --displayName comhra-lesson-xyz --ports 8080:private,59000:private
airnub-devc codespaces stop --name comhra-lesson-xyz
airnub-devc codespaces delete --name comhra-lesson-xyz
```

---

## Classroom-safe defaults & policies

* **Port visibility**: default `private`. Explicit flag required for `org/public`.
* **Sidecar passwords**: when the generation plan indicates default credentials (e.g., `student`/`admin`), include a `PlanNote` at `warn` level.
* **Idle timeout**: default 30–60 min; instructor override allowed.
* **Retention**: default 24–72 hours; Comhrá can shorten/extend per lesson.
* **Display names**: recommend `comhra-<lessonSlug>-<studentId>`.

---

## Security & Auth

* Prefer **GitHub App** over PAT for classroom scale (tenant-scoped, revocable tokens).
* Do **not** persist plaintext secrets; accept at call time and forward to GitHub Secrets API with libsodium encryption.
* Allow enterprise hostname override; validate SSL.

---

## Tests

* Use `nock` to stub GitHub REST endpoints.
* Cover: auth flows, create/stop/delete, port updates, secrets scoping, plan notes, rate limit backoff.

---

## README.md (package)

* Purpose, quick start (PAT & App auth), minimal examples for create/list/update ports.
* Note on **Codespaces constraints** (TCP forwarding only; UDP not supported; label limitations).
* Link to `devcontainers-catalog` generator docs.

---

## Integration example (Comhrá side)

```ts
import { makeCodespacesAdapter } from "@airnub/sdk-codespaces-adapter";
import { generateStack } from "@airnub/devc-sdk"; // your catalog SDK

// 1) Generate the lesson repo
const { plan, files } = await generateStack({
  template: "stack-nextjs-supabase-browsers",
  browsers: ["neko-chrome","neko-firefox"],
  features: ["ghcr.io/devcontainers/features/node:1"],
  semverLock: true,
});

// 2) Create Codespace for a student
const codespaces = makeCodespacesAdapter({ baseUrl: process.env.GITHUB_API_URL });
await codespaces.ensureAuth(
  { kind: "github-app", appId, installationId, privateKeyPem },
  { baseUrl: process.env.GITHUB_API_URL }
);

const cs = await codespaces.create({
  repo: { owner: "school", repo: "lesson-123-student-456" },
  devcontainerPath: ".devcontainer/devcontainer.json",
  displayName: "comhra-lesson-123-student-456",
  machine: "standardLinux32",
  ports: [
    { port: 8080, visibility: "private", label: "App" },
    { port: 8081, visibility: "private", label: "Neko Firefox" }
  ],
  idleTimeoutMinutes: 60,
  retentionPeriodMinutes: 1440
});

console.log("Open:", await codespaces.openUrl({ id: cs.id }));
```

---

## Acceptance Criteria

* `packages/sdk-codespaces-adapter` builds & publishes (internal version `v0.1.0`).
* Unit tests cover ≥80% of adapter logic.
* Dry-run `Plan` shows actions + notes; no template placeholders leak to outputs.
* CLI commands (optional) successfully list/create/stop/delete against a test org (behind a feature flag in CI).

---

## Stretch (later)

* **Prebuilds:** helpers to configure Codespaces prebuilds for a lesson repo.
* **Webhooks:** thin verifier for Codespaces events → emit `LessonSession` state to Comhrá.
* **Cost guardrails:** map machine types to budget hints; block large instances under `--school-mode`.
