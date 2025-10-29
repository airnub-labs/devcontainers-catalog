# AGENTS.md — Catalog Guardrails (Do Not Break)

This repository hosts the **DevContainers Catalog**: reusable **Features**, **Templates (source)**, **Presets (prebuilt image contexts)**, and **docs**.
All contributors (human or agent) **MUST** follow the policies below. CI will enforce them.

---

## 0) Non-Negotiable, Never-Regress Principles

1. **Local = Remote (Exact Parity)**
   Every devcontainer **must work locally** the **exact same** as on Codespaces and any Dev Container spec-compliant platform.

   * No host-specific assumptions.
   * No hard-coded paths to Codespaces.
   * No reliance on desktop OS tooling outside the container.

2. **Education SaaS Support (First-Class)**
   Everything in this catalog **must continue enabling** the classroom SaaS vision:

   * **Templates (SOURCE)** for flexible scaffolds instructors can copy into lesson repos.
   * **Presets (ARTIFACT/Prebuilt Images)** for fast-start cohorts (no feature re-installs).
   * **Service fragments** (Redis, Supabase, Kafka/KRaft, etc.) for “whole ecosystem” lessons.
   * **Lesson Manifest schema** compatibility and forward evolution.

3. **Device Agnostic + Low-Power Friendly**
   Students with only an internet connection must have an **equal experience** to those with high-powered machines.

   * Presets must be runnable via hosted providers (e.g., Codespaces) + **webtop/noVNC** access patterns for iPad/Chromebook.
   * Heavy compute is **prebuilt/reused**; never force clients to compile big toolchains.

> These three are **red lines**. CI blocks merges that violate them.

---

## 1) Directory Ownership

| Path                  | Owner/Role                   | Notes                                                                                     |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `features/*`          | Dev Container **Features**   | Idempotent installers. **No daemons. No secrets.**                                        |
| `templates/*`         | Dev Container **Templates**  | **Source** folders that scaffold `.devcontainer/` into lesson/workspace repos.            |
| `images/presets/*`    | **Prebuilt Preset Contexts** | **Artifact build contexts** used to bake/publish images to GHCR for fast classroom start. |
| `services/*`          | **Compose fragments**        | Pluggable YAML for Redis, Supabase, Kafka/KRaft, etc. No secrets.                         |
| `schemas/*`           | **Manifests & schemas**      | LessonEnv schema + examples. Backwards compatible changes only (SemVer).                  |
| `docs/*`              | **Documentation**            | Beginner-friendly; update alongside code changes.                                         |
| `.github/workflows/*` | **CI automation**            | Publishes features/images; smoke tests parity local vs remote.                            |

---

## 2) Source vs Artifact (Do Not Confuse)

* **Templates (`templates/*`) = SOURCE**

  * Copied into a repo; can include **Features** for flexibility.
  * May be slower on cold start (Features run at first boot).

* **Presets (`images/presets/*`) = ARTIFACT**

  * Minimal folders that exist only to **build & publish** OCI images (GHCR).
  * External repos reference `"image": "ghcr.io/..."` → **instant class start**.

**Rule:** Never add workspace-specific logic to Preset contexts. Keep them general and cache-friendly.

---

## 3) Invariants & Design Rules

* **No Secrets in Git or Images.**
  Use Codespaces/Provider secrets or local `.env` (git-ignored). Provide `.env.example` if needed.

* **No Long-Running Services in Features.**
  Services must live in `services/*` compose fragments, not Feature installers.

* **Multi-arch by Default.**
  All images and presets should build for `linux/amd64` and `linux/arm64`.

* **Minimal Base, Upgradable via ARG.**
  Base Dockerfiles accept `ARG UBUNTU_VERSION=24.04` (or similar) for easy bumps. Avoid baking Node/Python in base unless it’s a preset intentionally including them.

* **Extensions & Settings Hygiene.**

  * VS Code extension IDs **lowercase**.
  * Set `"remote.downloadExtensionsLocally": "always"` in presets to reduce first-open latency.
  * For Node presets, run `corepack enable || true` in post-create.

* **No Host Assumptions.**
  Use container DNS and loopbacks; expose services to `127.0.0.1` when needed. No reliance on host package managers.

---

## 4) Education SaaS Contract

### 4.1 Lesson Manifest (Schema-first)

* **Schema:** `schemas/lesson-env.schema.json`
* **Examples:** `examples/lesson-manifests/*.yaml`
* Manifest describes **base preset**, **services**, **VS Code extensions/settings**, **env**, optional **starter_repo**, and **image_tag_strategy**.
* **Policy:** Backwards compatible changes only (bump **minor** for additive, **major** for breaking).

### 4.2 Generator (Thin, Reproducible)

* Tool reads the manifest → emits:

  * a **generated preset build context** under `images/presets/generated/<org>/<course>/<lesson>/`
  * a **generated template scaffold** under `templates/generated/<org>/<course>/<lesson>/` (references the prebuilt image)
* Optional CI workflow for prebuilding & pushing to GHCR.

### 4.3 Service Fragments (Plug-and-Play)

* `services/redis/*.yml`, `services/supabase/*`, `services/kafka/*.yml`, etc.
* Composable with the main dev container; used both locally and on Codespaces.

### 4.4 Low-Power Devices (Webtop/noVNC)

* Presets must be compatible with **webtop/noVNC** flows for iPad/Chromebook usage on a remote provider.
* Do not require local window servers; any GUI access must be optional and proxied via web when enabled.

---

## 5) CI Gates (Merge Blockers)

**All PRs must pass these checks:**

1. **Parity Smoke Tests (Local vs Remote)**

   * Bring up a representative template locally (Docker) and in Codespaces.
   * Verify `postCreateCommand`/`postStartCommand` complete identically; verify simple task (`node --version`, `python --version`, `redis-cli PING`, etc., where applicable).

2. **Preset Pull-and-Run**

   * For at least one preset image, pull from GHCR and start **without** running any Features.
   * Confirm VS Code extensions are installed via `"remote.downloadExtensionsLocally": "always"`.

3. **Service Fragments Compose Lint**

   * Validate `services/*/*.yml` with `docker compose config`.
   * Ensure no `secrets:` values are hard-coded.

4. **Schema Compatibility**

   * Validate all `examples/lesson-manifests/*.yaml` against `schemas/lesson-env.schema.json`.
   * Reject breaking schema changes unless version is bumped to **major**.

5. **Multi-arch Build Check**

   * Ensure at least one preset builds for `linux/amd64,linux/arm64`, or has a queued multi-arch build pipeline.

6. **Content Hygiene**

   * Lowercase VS Code extension IDs.
   * No references to repo-local absolute paths.
   * No Features starting daemons or embedding secrets.

---

## 6) Naming & Publishing

* **Features** → `ghcr.io/airnub-labs/devcontainer-features/<feature-id>:<semver>`
* **Templates (source)** → `ghcr.io/airnub-labs/devcontainer-templates/<template-id>:<semver>` (for distribution via Template spec)
* **Presets (images)** → `ghcr.io/airnub-labs/templates/<preset-name>:<tag>`

  * **Tags:** `ubuntu-24.04`, or lesson-scoped tags if needed (e.g., `org-course-lesson-YYYY.MM.DD`)

**Always publish via CI.** Never publish the parent folder as a package.

---

## 7) Helpful Commands

* Test Features:
  `npx --yes @devcontainers/cli@latest features test --project-root . --features-root features`
* Build a preset context:
  `devcontainer build --workspace-folder images/presets/<preset> --image-name ghcr.io/airnub-labs/templates/<preset>:ubuntu-24.04`
* Multi-arch (via buildx):
  `docker buildx build --platform linux/amd64,linux/arm64 images/presets/<preset>`

---

## 8) Don’ts (Hard Stops)

* ❌ Reintroduce `.devcontainer/` or workspace files at repo root.
* ❌ Start background services in **Feature** installers.
* ❌ Bake secrets or school-specific assets into images.
* ❌ Add host-specific logic that breaks **local = remote** parity.
* ❌ Force high-powered hardware; must remain runnable via hosted provider + web UI (webtop/noVNC).

---

## 9) Definition of Done (for any change)

* [ ] Passes **CI Gates** in §5 (parity, preset run, fragments lint, schema, multi-arch, hygiene).
* [ ] Docs updated (beginner-friendly): explain **what changed** and **how to use it**.
* [ ] Does not violate §0 Core Principles.
* [ ] Preserves **Source vs Artifact** clarity and **SaaS** compatibility.

---

**Thanks for keeping the catalog reliable, accessible, and classroom-ready.**
