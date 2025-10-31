# Coding Agent Prompt — Complete CodespacesAdapter + Side‑loaded noVNC Observability

**Repo:** `airnub-labs/devcontainers-catalog`
**Branch:** create `feat/codespaces-adapter-complete-and-novnc-observability`
**Scope:** Finish the CodespacesAdapter (SDK + optional CLI), close classroom‑scale gaps, and add cross‑container **process observability** for side‑loaded GUI services like **noVNC/webtop** so they are visible/manageable from the main devcontainer.

---

## Part A — Complete the CodespacesAdapter

### 1) Types & Interface

Create/ensure these files under `packages/sdk-codespaces-adapter/src/` and wire exports in `index.ts`:

* `types.ts`, `github-auth.ts`, `github-client.ts`, `adapter.ts`, `ports.ts`, `errors.ts`.

**types.ts**

```ts
export type AuthMode =
  | { kind: "pat"; token: string }
  | { kind: "github-app"; appId: number; installationId: number; privateKeyPem: string };

export type RepoRef = { owner: string; repo: string; ref?: string };
export type Region = string;
export type PortVisibility = "private" | "org" | "public";

export type CreateCodespaceRequest = {
  repo: RepoRef;
  devcontainerPath?: string;         // path to .devcontainer/devcontainer.json
  machine?: string;                  // codespaces machine type
  region?: Region;                   // optional region
  displayName?: string;              // human-readable name
  idleTimeoutMinutes?: number;       // default 60
  retentionPeriodMinutes?: number;   // default 1440
  environmentVariables?: Record<string, string>;
  secrets?: Record<string, string>;  // plaintext at call time; adapter encrypts per-scope
  ports?: Array<{ port: number; visibility: PortVisibility; label?: string }>;
  startImmediately?: boolean;        // default true
  schoolMode?: boolean;              // default true → enforce private ports only
};

export type CodespaceInfo = {
  id: string;
  name: string;
  state: string;                     // available|starting|stopped|...
  webUrl: string;
  createdAt: string;                 // ISO
  lastUsedAt?: string;               // ISO
  region?: Region;
  machine?: string;
  repo: RepoRef;
};

export type PlanNote = { level: "info" | "warn" | "error"; message: string };
export type Plan = {
  actions: Array<
    | { op: "create-codespace"; req: CreateCodespaceRequest }
    | { op: "update-ports"; req: Array<{ port:number; visibility: PortVisibility; label?: string }>; target: { id?: string; name?: string } }
    | { op: "stop-codespace"; target: { id?: string; name?: string } }
    | { op: "start-codespace"; target: { id?: string; name?: string } }
    | { op: "delete-codespace"; target: { id?: string; name?: string } }
    | { op: "set-secrets"; scope: "repo" | "org" | "user"; entries: string[]; repo?: RepoRef; org?: string }
  >;
  notes: PlanNote[];
};

export interface ICodespacesAdapter {
  ensureAuth(auth: AuthMode, opts?: { baseUrl?: string }): Promise<void>;

  listCodespaces(params?: { owner?: string; repo?: string; state?: string }): Promise<CodespaceInfo[]>;
  getCodespaceByName(name: string): Promise<CodespaceInfo | null>;
  getCodespace(id: string): Promise<CodespaceInfo | null>;
  listMachines(repo: RepoRef): Promise<string[]>;

  planCreate(req: CreateCodespaceRequest): Promise<Plan>;
  create(req: CreateCodespaceRequest): Promise<CodespaceInfo>;
  stop(target: { id?: string; name?: string }): Promise<void>;
  start(target: { id?: string; name?: string }): Promise<CodespaceInfo>;
  delete(target: { id?: string; name?: string }): Promise<void>;

  setPorts(target: { id?: string; name?: string }, ports: Array<{ port:number; visibility: PortVisibility; label?: string }>): Promise<void>;
  setSecrets(scope: "repo" | "org" | "user", entries: Record<string,string>, ctx?: { repo?: RepoRef; org?: string }): Promise<void>;

  openUrl(target: { id?: string; name?: string }): Promise<string>;
}
```

### 2) Auth — `github-auth.ts`

* PAT passthrough.
* GitHub App: sign JWT → exchange for installation token; cache with expiry.
* Support `baseUrl` overrides for GHE.

### 3) GitHub Client — `github-client.ts`

Implement thin Octokit wrappers:

* Codespaces lifecycle: list/get/create/start/stop/delete/export/publish.
* Machines: list available machine types for repo/codespace.
* Devcontainer preflight: HEAD/GET the `devcontainerPath` in the repo at `ref`.
* Secrets: user/org/repo **development‑environments** secrets — get public key, libsodium seal, put.
* Add rate‑limit/backoff wrappers; throw typed errors from `errors.ts`.

### 4) Adapter — `adapter.ts`

* `planCreate(req)`: build a **Plan** with notes:

  * missing devcontainer.json → warn
  * machine not available → error
  * `schoolMode && ports.visibility!==private` → error
  * large machines under `schoolMode` → warn
* `create(req)`: call create; short‑poll until `available|stopped` (≤3 min); then `setPorts`.
* `setPorts()`: shell out to `gh codespace ports visibility` + update label when supported; meaningful error if `gh` missing.
* `setSecrets()`: scope‑aware secrets using libsodium.
* `openUrl()`: return Codespace URL (or synthesize from name).

### 5) CLI (optional) — `tools/airnub-devc/src/commands/codespaces/*.ts`

Add thin wrappers for `list/create/start/stop/delete/ports/secrets`. Include flags: `--repo`, `--ref`, `--machine`, `--region`, `--devcontainer-path`, `--display-name`, `--ports 8080:private:App`, `--school-mode`.

### 6) Tests

* Use `nock` for REST, stub child_process for `gh`.
* Unit coverage: auth flows, create/list, machine validation, secrets, plan notes.
* Golden plan tests for `planCreate()`.

### 7) Docs

* `packages/sdk-codespaces-adapter/README.md` with PAT/App examples, enterprise base URL, TCP‑only note, `schoolMode` defaults, and Comhrá integration snippet.

---

## Part B — Side‑loaded noVNC (or Webtop) **Process Observability**

**Problem:** When **noVNC/webtop** runs as a sidecar (not inside the main devcontainer), you lose process visibility and can’t monitor/stop it from the devcontainer UI.

**Goal:** Provide **cross‑container observability & control** from the devcontainer using lightweight, safe mechanisms that work in Codespaces and local Docker.

### Design

Add a tiny **Sidecar Agent** running in each GUI sidecar container, exposing a read‑only metrics/health endpoint and optional control endpoints. The devcontainer will:

* auto‑discover agents via Compose DNS service names,
* poll `/metrics` and `/healthz` for status,
* expose a `devcontainer task` to **stop/restart** the sidecar via Docker Engine API (local) or `docker compose` (local) or **Codespaces CLI** fallback.

#### 1) Sidecar Agent (new) — `packages/sidecar-agent/`

* Minimal Node/Express (or Go) HTTP server.
* Endpoints:

  * `GET /healthz` → `{ status:"ok", service:"webtop", version }`
  * `GET /metrics` → JSON: `{ cpu, mem, uptime, proc: [{name,pid,cpu,mem}], ports:[...] }`
  * `POST /control/stop` (optional, default **disabled** in Codespaces)
  * `POST /control/restart` (optional)
* Reads process stats from `/proc` (Linux) or `pidusage` library; no privileged ops required for metrics.
* Bind to `0.0.0.0:4318` (example). **Do not** expose publicly; stay on the Docker network only.

#### 2) Compose wiring

For **webtop**/**linux-chrome**/**neko** templates, add:

```yaml
services:
  webtop:
    environment:
      - SIDECAR_AGENT_ENABLE=1
    ports:
      - "3012:3000"       # app UI (existing)
      # no public port for agent
    expose:
      - "4318"            # agent metrics (internal only)
```

Modify Dockerfiles or entrypoints to start the agent **alongside** the main service (e.g., `supervisord`, or a small bash wrapper that backgrounds the agent and execs the main cmd).

#### 3) Devcontainer Observer (client)

Add a tiny client in `tools/airnub-devc/src/lib/sidecar-observer.ts`:

* Discovers service names from `.devcontainer/devcontainer.json` `runServices` and/or an annotations block:

  ```jsonc
  {
    "customizations": {
      "airnub": {
        "sidecars": [
          { "name": "webtop", "agentPort": 4318 },
          { "name": "neko",   "agentPort": 4318 }
        ]
      }
    }
  }
  ```
* Polls `http://<service>:4318/metrics` on the Docker network from inside the devcontainer.
* Presents a VS Code command (via your extension or simple terminal output) to show status.

#### 4) Control paths (optional)

* **Local Docker**: implement `airnub-devc sidecar stop webtop` → `docker compose stop webtop`.
* **Codespaces**: use `gh codespace ssh -c <name> -- <docker compose stop webtop>` if Docker socket is available inside the codespace; otherwise, hide control and keep **metrics only**. (You cannot manage sibling containers if the environment forbids it; the agent still gives telemetry.)

#### 5) Security defaults

* Agent listens only on the Docker network, **not** forwarded.
* Control endpoints disabled by default in Codespaces; enable only via `SIDECAR_AGENT_CONTROL=1` locally.
* No secrets exposed; metrics are non‑sensitive.

#### 6) DX additions

* Add a VS Code task: `Show Sidecar Status` → runs `airnub-devc sidecar status` to print a small table.
* Optional: a minimal web dashboard served from the devcontainer (`http://localhost:4573/_sidecars`) that fetches metrics and renders status.

---

## Acceptance Criteria

* **CodespacesAdapter**: all methods implemented; plan/dry-run includes notes; unit tests pass.
* **Ports & school mode**: default private; `public` blocked in school mode.
* **noVNC/webtop observability**: sidecar agent added; devcontainer can query `/metrics` over service DNS; local control via compose; metrics-only in Codespaces.
* **Docs**: update services’ READMEs with a “Sidecar Observability” section and security notes.

---

## Post-merge follow-ups (nice-to-have)

* Add a lightweight **Prometheus exporter** mode to the agent and a **Grafana** sidecar preset for instructors.
* Emit **Caliper/xAPI** events for lesson telemetry when sidecars start/stop (integrates with Comhrá analytics).
