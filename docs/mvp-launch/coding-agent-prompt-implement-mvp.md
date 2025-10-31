# Coding Agent Prompt — Implement MVP (Repo-Button First) with Adapter-Ready Architecture (Separation-of-Concerns Edition)

> **Goal:** Implement an MVP that launches Codespaces via the **repo button** (no provider APIs) while laying clean, provider-agnostic abstractions for later adapters (Codespaces automation, DevPod, etc.). Enforce strict **separation of concerns**:
>
> * **`devcontainers-catalog`** stays education-agnostic and **stateless** (no DB), exposes a **generator** that emits a filesystem tree **and** a **typed `manifest.json`** + publishable **schema + TS types**.
> * **`comhra-core-platform`** (Edu SaaS) handles **persistence**, **UX**, and future **provider adapters**.

---

## 0) Scope & Repos

* **Primary app (Edu SaaS):** `airnub/comhra-core-platform` (Next.js; OTel wired)
* **Stacks & generator (agnostic):** `airnub-labs/devcontainers-catalog`

You will:

1. **Audit** both repos.
2. Implement the **MVP** (repo-button launch) in **comhrá** using a **pinned** catalog commit.
3. Add **manifest schema + TS types** and a stable **generator contract** to **catalog** (no persistence).
4. Create **adapter-ready** core abstractions in **comhrá** (no provider APIs yet).
5. Update docs and basic telemetry.

**Out of scope now:** programmatic Codespaces lifecycle; port policy/machine sizing/quotas; non-GitHub providers (DevPod); centralized compute billing.

---

## 1) Non-Functional Guardrails

* **Separation of concerns**: *no* DB, secrets, org data, or telemetry in `devcontainers-catalog`.
* **Spec alignment**: output must conform to Dev Containers (works locally & in Codespaces).
* **Reproducibility**: always pin a **catalog commit SHA** in `comhrá` when generating.
* **Security defaults**: sidecar passwords must not be blank; guidance defaults to **Private** ports.
* **Observability** (comhrá): OTel spans for generation & launch clicks; minimal usage events.

---

## 2) Deliverables (High Level)

### In `devcontainers-catalog` (stateless, agnostic)

1. **Generator contract (CLI or library)**

   * **Input**: `{ stackId, browsers[], overrides?, pin: <commit|tag> }`
   * **Output**: `{ outDir, manifestPath, manifestJson, zipPath? }`
   * Writes a deterministic filesystem tree (devcontainer/compose/README, etc.).
   * Emits a **`manifest.json`** describing ports, labels, required env var *names*, sidecars used, notes.
2. **Schema + TS types package**

   * Add **`packages/schema/manifest.schema.json`** (JSON Schema; versioned).
   * Add **`packages/schema/src/types.ts`** (TypeScript types from the schema).
   * Publish as **`@airnub/devcontainers-catalog-manifest`** (or similar) so any consumer validates at build time.
3. **Sidecar registry** (JSON/YAML) — versioned; no secrets.
4. **Docs**: README for generator usage & manifest contract; schema notes; versioning policy.

### In `comhra-core-platform` (Edu SaaS)

1. **Provider-neutral core**

   * **Workspace Manifest type** (import from `@airnub/devcontainers-catalog-manifest`).
   * **Capability Map** (placeholder object only): store a single profile `codespaces-default` with fields like `udpSupported=false`, `portVisibilityModes=['private','org','public']`. **Unused** in logic for MVP.
2. **Persistence (DB)**

   * **Course**: `{ id, name, githubOrg, rosterSource }`
   * **StackInstance**: `{ id, courseId, manifest (json), catalogCommit, repoUrl, branch, createdAt }`
   * **UsageEvent (optional MVP)**: `{ id, stackInstanceId, kind: 'REPO_CREATED'|'OPENED_CODESPACES'|'SMOKE_MARKED_PASS'|'SMOKE_MARKED_FAIL', at }`
   * **ProviderProfile (future)**: shape only, not used.
3. **Generator pipeline**

   * Server action to call the **catalog generator** at a **pinned SHA**.
   * Create/push a repo in the teacher’s GitHub org (via teacher auth / existing flow). **Do not** call Codespaces APIs.
   * Ensure the generated repo contains `/classroom-browser`, sidecar **port labels**, README with **Private-ports guidance** and **password change** notes, and an **optional smoke** script.
   * Save the manifest + repo metadata in `StackInstance`.
4. **Launch flow (no adapter)**

   * Show **Open in Codespaces** deep link for each StackInstance.
   * Offer **Download local ZIP** fallback (the generated tree zipped by catalog output).
5. **UI**

   * Teacher **wizard**: Choose stack → Choose browsers (multi-select: `neko-chrome`, `neko-firefox`, `kasm-chrome`) → Review (pinned SHA, ports, README notices) → Generate Repo → Success (repo link, Codespaces link, ZIP).
   * Course page: list StackInstances; links; createdAt; manual smoke PASS/FAIL toggle.
6. **Docs**

   * Teacher playbook; student quickstart; safety & accessibility notes; screenshots.

---

## 3) Technical Details

### 3.1 Manifest (owned by catalog, consumed by comhrá)

* **Location**: emitted at `manifestPath` within the generated output tree.
* **Validated by** `@airnub/devcontainers-catalog-manifest` schema in comhrá at ingest time.
* **Fields (v1)**:

  * `schemaVersion`: string (e.g., `1.0.0`)
  * `stackId`: string (e.g., `nextjs-supabase@1.0.0`)
  * `catalogCommit`: string (SHA)
  * `browsers`: string[] (IDs: `neko-chrome`, `neko-firefox`, `kasm-chrome`)
  * `ports`: array of `{ port: number, label: string, purpose: string, recommendedPrivacy: 'PRIVATE'|'COURSE'|'PUBLIC' }`
  * `env`: array of `{ name: string, description?: string, required?: boolean }` **(names only; no values)**
  * `paths`: `{ devcontainer: string, compose?: string, readme: string, classroomBrowser?: string }`
  * `notes`: `{ prefersUDP?: boolean, codespacesFallback?: 'tcp-mux'|'https-ws', other?: string }`

### 3.2 Capability Map (placeholder, comhrá)

* `packages/core/types/provider-capabilities.ts`
* `packages/core/config/provider-capabilities.json` with just `codespaces-default` for MVP.
* **No runtime branching** uses it yet.

### 3.3 Catalog expectations (content hygiene)

* Stacks must **not** emit unresolved templating placeholders in `devcontainer.json`.
* Provide consistent **port labels** for sidecars: Neko Chrome UI + TCP-mux; Neko Firefox UI + TCP-mux; Kasm Chrome HTTPS.
* README snippet must explain passwords, Private ports, and `/classroom-browser` usage.

---

## 4) API Surface (comhrá, MVP)

* `POST /api/courses/:courseId/stacks/generate`

  * Body: `{ stackId, browsers[], repoName?, visibility?, branch? }`
  * Response: `{ repoUrl, branch, codespacesDeepLink, manifest }`
* `GET /api/courses/:courseId/stacks`

  * Returns list of StackInstances with repo link, deep link, createdAt, smoke status.

**Note:** Using the **repo button** for Codespaces: construct standard `codespaces/new?repo=<owner/repo>&ref=<branch>` URL.

---

## 5) Acceptance Criteria

* **Catalog**

  * Provides a stable generator with the **input/output contract** above.
  * Emits a **valid `manifest.json`** per schema **and** publishes **schema + TS types** as `@airnub/devcontainers-catalog-manifest`.
  * Contains **no DB**, secrets, org hooks, or telemetry.
* **Comhrá**

  * Stores the **manifest JSON** and **catalog commit SHA** with each `StackInstance`.
  * Creates the repo in the teacher’s org and pushes the generated tree.
  * Shows a working **Open in Codespaces** deep link and **Download ZIP** fallback.
  * Teacher wizard + course page implemented; basic OTel spans & usage events recorded.
  * Generated repos run in Codespaces and locally; sidecar UI reachable via labeled ports; README guidance present.

---

## 6) Review Checklist (PR gate)

* [ ] `devcontainers-catalog` generator returns `{ outDir, manifestPath, manifestJson, zipPath? }`.
* [ ] `manifest.json` validates against `packages/schema/manifest.schema.json`.
* [ ] `@airnub/devcontainers-catalog-manifest` published; comhrá consumes types + validates at ingest.
* [ ] No persistence or provider logic added to catalog.
* [ ] `comhrá` persists `StackInstance` with manifest + catalog SHA; no Codespaces API usage.
* [ ] Repo button deep link works; local ZIP available.
* [ ] README includes Private ports + password-change guidance + `/classroom-browser` link.
* [ ] OTel spans emitted; minimal `UsageEvent`s captured.
* [ ] Docs updated with screenshots.

---

## 7) ADRs to Author

1. **ADR-001: Repo-Button First MVP** — rationale for not using provider APIs; iPad parity; time-to-first-lab.
2. **ADR-002: Separation of Concerns** — catalog is stateless & agnostic; schema/types published; comhrá persists.
3. **ADR-003: Adapter-Ready Core** — Workspace Manifest & Capability Map scaffolding for future Codespaces/DevPod adapters.

---

## 8) Future Hooks (Do Not Implement Now)

* **CodespacesAdapter interface** (create/stop, port visibility, machine caps, idle shutdown, secrets, prebuilds).
* **DevPodAdapter interface** (create/start/stop via DevPod CLI; target Docker/K8s/SSH/Cloud).
* **Provider dropdown** (feature-flagged) and a policy matrix mapped to SaaS tiers.

---

## 9) Execution Order (Summary)

1. Repo audits & notes.
2. Catalog: add generator contract; add `manifest.schema.json` + TS types; update docs.
3. Publish `@airnub/devcontainers-catalog-manifest`.
4. Comhrá: add types; DB migrations; generator pipeline (pinned SHA) → repo creation; persist manifest.
5. UI wizard + course list; deep link + ZIP download.
6. OTel + UsageEvents; docs; screenshots.
7. End-to-end QA in Codespaces (iPad/Chromebook + laptop) & local Docker.
