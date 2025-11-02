# Separation of Concerns — devcontainers-catalog (agnostic) vs comhrá (Edu SaaS)

## Position

**devcontainers-catalog must remain education-agnostic and stateless.** It should not contain any database persistence or platform-specific logic. All persistence, cohort/course concepts, and provider orchestration live in **comhrá (the Education SaaS)** or other consuming platforms.

---

## What Belongs Where

### devcontainers-catalog (agnostic, reusable)

* **Purpose:** A deterministic library of **stacks**, **sidecar browser presets**, and a **generator** that emits ready-to-run Dev Containers + Compose.
* **Inputs:** `stackId`, `browsers[]`, optional compose/devcontainer overrides, **pinned commit/tag**.
* **Outputs:**

  * A concrete **filesystem tree** (devcontainer.json, compose, README, /classroom-browser page, etc.).
  * A machine-readable **`manifest.json`** describing ports, labels, expected env vars, sidecars used, and minimum requirements.
  * Optional **zip artifact** (stdout path) for callers to upload elsewhere.
* **Data & Config:** Sidecar registry in **versioned JSON/YAML** within the repo. **No secrets**, **no org-specific data**, **no telemetry**.
* **Distribution:** Git tags/releases; optionally published as an npm package or OCI artifact (for CI/CD consumption).
* **Testing:** Schema validation of `manifest.json`, port-label lint, collision checks, template integrity checks.

### comhrá-core-platform (Education SaaS)

* **Purpose:** Teacher/Student UX, **persistence**, orchestration, and analytics.
* **Persists:**

  * **Course** (name, org, roster source)
  * **StackInstance** (stores the catalog **`manifest.json`** and pinned **commit SHA**, plus repo URL/branch)
  * **UsageEvents** (e.g., REPO_CREATED, OPENED_CODESPACES, SMOKE_PASS/FAIL)
  * **ProviderProfile** (future: codespaces/devpod/local selection & policies)
* **Orchestrates:**

  * Repo creation in teacher’s GitHub org (MVP)
  * Future: Codespaces automation via **CodespacesAdapter** (create/stop, port visibility, machine caps, prebuilds)
  * Future: non-GitHub backends via **DevPodAdapter** (Docker/K8s/VMs/own AWS)
* **Billing/Policies:** Lives here (tiers, quotas, budgets, SSO/LMS integrations).

---

## Interface Contract (Catalog ⇄ Comhrá)

* **Call:** `generate({ stackId, browsers[], overrides?, pin: <commit|tag> })`
* **Return:** `{ outDir, manifestPath, manifestJson, zipPath? }`
* **Manifest shape (high level):**

  * `stackId`, `catalogCommit`
  * `browsers[]` (ids)
  * `ports[]` → `{ port, label, purpose, recommendedPrivacy }`
  * `env[]` → required **variable names only**, not values (e.g., `NEKO_USER_PASSWORD`)
  * `paths` → where devcontainer/compose/README landed
  * `notes` → capability hints (e.g., prefers UDP; Codespaces fallback = TCP-mux)

**Important:** The **catalog writes no DB**. Comhrá **ingests** `manifest.json` and persists it with Course/StackInstance records.

---

## Data-Flow (MVP)

1. Teacher chooses stack + browsers in Comhrá.
2. Comhrá calls **catalog generator** (pinned commit) → receives `outDir` + `manifest.json`.
3. Comhrá creates a repo in the teacher’s GitHub org and pushes the tree.
4. Comhrá **stores** `manifest.json` + `catalogCommit` in **StackInstance**.
5. UI shows the repo link and **Open in Codespaces** deep link (no Codespaces API in MVP).

---

## Why No DB in devcontainers-catalog

* **Agnostic reusability:** Same catalog can serve education, internal teams, hackathons, or CI pipelines without coupling.
* **Determinism:** Output identity is the git **commit/tag + inputs**; no stateful runtime.
* **Security:** Keeps secrets and org data out of a shared library.
* **Versioning:** Git tags/semver are the source of truth; consumers decide persistence.

---

## Migration/Refactor Plan (if any DB references exist today)

1. **Remove** any DB/service imports from `devcontainers-catalog`.
2. **Add** a first-class `manifest.json` generator and **stdout contract**.
3. **Document** the CLI/library interface in `README` (inputs/outputs, schema, examples).
4. **Update comhrá** to:

   * Consume `manifest.json` and **persist** it as part of `StackInstance`.
   * Store the **pinned catalog commit**.
   * Never reach into catalog internals for state.

---

## Optional Enhancements

* **Publish artifacts** (zip + manifest) in GitHub Releases for well-known stacks.
* **Schema package**: export TypeScript types + JSON schema so comhrá (and others) validate manifests at compile-time and runtime.
* **Conformance CI**: run sample generations across OSes to ensure identical outputs.

---

## FAQ

**Q: Where do we save course/roster/usage data?**
→ In **comhrá** only. The catalog has no concept of courses.

**Q: Where do env values (passwords/tokens) live?**
→ In **comhrá** (or the target provider). The catalog lists only the **names** that must be set.

**Q: Who sets port visibility and transport fallbacks?**
→ **Comhrá/adapters.** The catalog provides recommendations; the adapter/provider applies policies.

**Q: How do we ensure reproducibility?**
→ Comhrá **pins** the catalog commit, stores the manifest alongside the generated repo reference.
