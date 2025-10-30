# AGENTS.md — Catalog Guardrails (Never-Regress)

This repository is the **Devcontainers Catalog**: reusable **Features**, **Templates**, **Presets/Images**, **Service fragments**, and **schemas** used by a future SaaS platform to deliver **chat-to-classroom** environments.

---

| Path                     | Role                           | Notes |
|--------------------------|--------------------------------|------|
| `features/*`            | Dev Container Features         | Idempotent installers only. No daemons, no secrets. |
| `templates/*`           | Source scaffolds               | Repo-agnostic `.devcontainer` payloads. |
| `images/presets/*`      | Prebuilt image contexts        | Build/publish OCI images (GHCR) via CI. |
| `services/*`            | Compose fragments              | Redis, Supabase, Kafka, Prefect, Airflow, Dagster, Temporal, etc. |
| `schemas/*`             | JSON Schemas                   | Catalog and SaaS contracts (lesson env, chat intents). |
| `tools/*`               | Generators/CLIs                | Deterministic emit of build ctx + student scaffold. |
| `docs/*`                | Catalog docs                   | Updated with every change; source of truth. |
| `.github/workflows/*`   | CI automation                  | Lint, validate schemas, build/push images, smoke tests. |

---

## Non-Negotiable, Never-Regress Principles

### 1) Local = Remote Parity
Dev Containers must behave **identically** on:
- Local Docker / VS Code Dev Containers,
- GitHub Codespaces,
- Any devcontainer-spec compliant host.  
No host-only assumptions (e.g., listeners must prefer **service names** over hostnames).

### 2) Education SaaS Alignment (Chat-to-Classroom)
The catalog must **enable** a SaaS where instructors can, via **chat**, request a lesson, and the platform:
- **Generates a Lesson Manifest** (schema-valid),
- **Builds a prebuilt image** (from a preset; no secrets inside),
- **Emits a student scaffold** that references that image,
- **Optionally seeds lesson content** (no runtime cloning for students),
- **Optionally emits an aggregate docker-compose** for realistic service stacks (Redis, Supabase, Kafka, Prefect, Airflow, Dagster, Temporal, etc.).

This chat-to-classroom flow is a **product invariant**. Never regress.

### 3) Device-Agnostic Access
Students on low-power devices (Chromebook, iPad) must have **equal startup experience**:
- Prebuilt images for fast cold starts.
- GUI workflows available via **webtop/noVNC** when needed (no local GPU assumed).
- No dependency on local hardware accelerators.

### 3a) Use the Generator
- Always materialize workspaces and lesson scaffolds with `@airnub/devc`.
- Do **not** manually vendor compose fragments or preset assets; rely on the generator + manifests.

### 4) MCP + LLM Agent Orchestration (via SaaS)
The SaaS mediates **MCP agents** and **LLM agents** that:
- Accept **instructor chat requests** → derive a **validated manifest**.
- Call catalog MCP methods to **list templates**, **validate manifests**, **generate build contexts**, **publish images**, and **emit scaffolds**.
- Are **deterministic** (idempotent actions; no hidden side-effects) and **auditable** (provenance labels on images, run logs retained).
- Never embed secrets in images or templates; secrets flow via Codespaces/host **Secrets** or `.env` files provided by instructors.

### 5) Safety, Privacy, and Provenance
- **No secrets in Features, Templates, or Presets**. Use placeholders only.
- Images must carry **OCI labels**: source repo, git sha, org/course/lesson identifiers, schema version.
- Telemetry, content collection, or outbound network access from generators/agents must be **explicitly documented** and disabled by default.

---

## Agent Contracts & Guardrails

**MCP Methods (SaaS → Catalog):**
- `catalog.listPresets()` → presets (name, base image, features).
- `catalog.listServices()` → service fragments (name, ports, docs path).
- `manifest.validate(manifest)` → against `schemas/lesson-env.schema.json`.
- `lesson.generate(manifest)` → emits:
  - `images/presets/generated/<slug>/` build context (with OCI labels),
  - `templates/generated/<slug>/.devcontainer/devcontainer.json` scaffold,
  - optional `docker-compose.classroom.yml` aggregate if services selected.
- `image.buildPush({ slug, tag })` → multi-arch to GHCR.
- `scaffold.smokeTest({ slug })` → runs `devcontainer build` and `docker compose config`.

**Determinism:**
- Same manifest = same artifacts (modulo timestamps, digests).
- No network fetches for code at generation time except optional “seed lesson content” that is **declared** in the manifest (`starter_repo`).

**Reproducibility:**
- All emitted files are **derived** only from manifest + catalog sources.
- CI validates schemas, builds/pushes images, and smoke-tests generated scaffolds.

**Privacy & Security:**
- Secrets flow only via the host platform secrets manager or instructor-provided `.env`.
- No credentials baked into images or templates.
- Aggregate Compose uses private networks by default; ports explicitly mapped only as documented.

---

2. **Education SaaS Support (First-Class)**
   Everything in this catalog **must continue enabling** the classroom SaaS vision:

- **Features** → `ghcr.io/airnub-labs/devcontainer-features/<id>:<semver>`
- **Presets/Images** → `ghcr.io/airnub-labs/templates/<preset>:<tag>`
- **Lesson Images** → `ghcr.io/airnub-labs/templates/lessons/<org-course-lesson>:<tag>`

Tags must include a **base tag** (e.g., `ubuntu-24.04`) and may include date/version suffixes.

---

## CI Requirements

- Validate **all** schemas.
- For each example manifest: `lesson.generate` → `image.buildPush` (dry-run in PRs).
- `devcontainer build` on generated scaffold (smoke).
- `docker compose -f docker-compose.classroom.yml config` (if exists).
- Check that images have required **OCI labels**.

---

## Don’ts

- ❌ Start background daemons in feature installers.
- ❌ Embed secrets anywhere in repo or images.
- ❌ Depend on host-only DNS/IPs; always prefer service names in Compose.
- ❌ Remove or weaken the Non-Negotiable principles without an ADR and major-version bump.
