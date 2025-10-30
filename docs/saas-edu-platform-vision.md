# Airnub Education Platform — Dev Containers for Teaching at Scale

Teach architecture and AI with identical, fast-start, reproducible environments. Instructors compose environments (Dev Container + support services) once; students open a link and start coding immediately — in Codespaces or locally — with the exact same stack.

## 1. Why this, why now

- **Friction kills learning.** Waiting for Features (Node/Python/pnpm) or services to install wastes class time.
- **Architecture matters.** Students should experience real ecosystems (e.g., Dev Container + Supabase, or Kafka with KRaft) — locally and in the cloud — not toy demos.
- **Reproducibility.** Every student gets the same environment, with lesson materials preloaded.

**Our answer:** A catalog of Dev Container Templates (scaffolds) + Prebuilt Image Presets (fast-start images) + a Lesson Manifest that declares the whole environment, so a SaaS UI can generate and publish everything in one click.

## 2. Core concepts

### Source vs. Artifact (mental model)

- `templates/` → Dev Container Templates (scaffolds you copy into a repo).
  - Flexible and editable per repo.
  - First boot may install Features → slower.
- `images/presets/` → Prebuildable Image Presets (each has a `devcontainer.json`).
  - Use `devcontainer build` to bake and push an image to GHCR.
  - External repos reference `"image": "ghcr.io/..."` → fast start.

This split serves both worlds: agile development (templates) and instant classrooms (presets).

## 3. Classroom fast-start (instructor → students)

### Instructor (once, before class)

1. Pick a preset: `images/presets/full/` (Node + pnpm + Python/Jupyter) or create your own.
2. Build and push:

   ```bash
   devcontainer build \
     --workspace-folder images/presets/full \
     --image-name ghcr.io/airnub-labs/templates/full:ubuntu-24.04 \
     --push
   ```

3. Create the lesson repo with this minimal `.devcontainer/devcontainer.json`:

   ```json
   {
     "name": "lesson-01",
     "image": "ghcr.io/airnub-labs/templates/full:ubuntu-24.04",
     "workspaceFolder": "/work",
     "customizations": {
       "vscode": {
         "settings": { "remote.downloadExtensionsLocally": "always" },
         "extensions": [ "dbaeumer.vscode-eslint", "esbenp.prettier-vscode" ]
       }
     }
   }
   ```

4. Add your lesson materials (code, notebooks, prompts) to the repo.

### Students

- Open the lesson repo in Codespaces (or locally with Dev Containers).
- The container pulls the prebuilt image → no Feature installs → class begins immediately.

A more detailed step-by-step guide is in `docs/quick-start-fast-classroom.md`.

## 4. Beyond “hello world”: full ecosystems out of the box

To truly teach architecture, instructors must flip a UI switch and get a real environment:

- **Simple:** Dev Container + Redis + Supabase (API, Postgres, Studio, Inbucket, Realtime).
- **Advanced:** Dev Container + Kafka (KRaft) + producers/consumers; optional schema registry; dashboards.

### Design goals

- **Local parity:** Same compose stack runs locally and in Codespaces.
- **Prebuilt:** Heavy toolchains pre-baked into the image; services wired via compose fragments.
- **Secrets-safe:** No secrets in images; injected at runtime via Codespaces or local `.env`.

## 5. The Lesson Environment Manifest (declarative)

A single manifest that the SaaS UI reads and writes — the contract for everything to generate.

Example (`examples/lesson-manifests/intro-ai-week02.yaml`):

```yaml
apiVersion: airnub.devcontainers/v1
kind: LessonEnv
metadata:
  org: "my-school"
  course: "intro-ai"
  lesson: "week02-prompts"
spec:
  base_preset: "full"            # images/presets/full
  image_tag_strategy: "ubuntu-24.04"

  vscode_extensions:
    - dbaeumer.vscode-eslint
    - esbenp.prettier-vscode
  settings:
    remote.downloadExtensionsLocally: "always"

  services:
    - name: "redis"
    - name: "supabase"
    # - name: "kafka-kraft"    # uncomment to include Kafka in KRaft mode
    # - name: "kafka-producer"
    # - name: "kafka-consumer"

  env:
    NODE_OPTIONS: "--max-old-space-size=2048"

  secrets_placeholders:
    - SUPABASE_SERVICE_ROLE_KEY

  starter_repo:
    url: "https://github.com/airnub-labs/lesson-starters/intro-ai-week02"
    path: "/workspace"   # where to place it inside the container
```

We recommend adding a JSON Schema: `/schemas/lesson-env.schema.json` to validate manifests.

## 6. Generator pipeline (lightweight, automatable)

Add a tiny tool (`tools/generate-lesson/`) that:

1. Reads the manifest.
2. Generates a prebuild context under `images/presets/generated/<org>/<course>/<lesson>/` by:
   - Starting from the selected preset.
   - Injecting extensions, settings, and environment variables.
   - Assembling compose fragments for requested services.
3. Generates a repo scaffold under `templates/generated/<org>/<course>/<lesson>/`:
   - `.devcontainer/devcontainer.json` with `"image": "ghcr.io/..."`.
   - Adds any lesson materials (from `starter_repo`).
4. (Optional) Emits a GitHub Actions workflow to build and push the image on commit.

This keeps the SaaS UI thin (it just emits and manages manifests) and the repo pipeline reproducible.

## 7. Service “compose fragments” (plug-and-play)

Ship ready-to-merge compose YAML bits under `/services/*`. The generator merges these into the final `compose.yaml`.

### 7.1 Redis (simple)

`services/redis/docker-compose.redis.yml`

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: ["redis-server", "--save", "60", "1", "--loglevel", "warning"]
```

### 7.2 Supabase (complete stack)

- **Option A — via official Supabase CLI (recommended for local):**
  - Generator writes a `postStartCommand` that runs `supabase start` if not already running, or
  - Generator references Supabase’s official `docker-compose.yml` into the final compose (volume paths carefully mapped).
- **Option B — curated “mini Supabase” compose** (Postgres + Studio + Realtime + API + Inbucket).

Supabase’s official stack evolves; safest is to vendor their compose and update periodically.

### 7.3 Kafka in KRaft mode (single broker for local dev)

`services/kafka/docker-compose.kafka-kraft.yml`

```yaml
services:
  kafka:
    image: bitnami/kafka:3.7
    restart: unless-stopped
    environment:
      - KAFKA_ENABLE_KRAFT=yes
      - KAFKA_CFG_PROCESS_ROLES=broker,controller
      - KAFKA_CFG_NODE_ID=1
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka:9093
      - KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true
      - KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR=1
      - KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1
      - KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR=1
    ports:
      - "9092:9092"
    healthcheck:
      test: ["CMD", "bash", "-lc", "kafka-topics.sh --bootstrap-server localhost:9092 --list"]
      interval: 10s
      timeout: 5s
      retries: 20
```

Optional producer/consumer utilities (for demos):

`services/kafka/docker-compose.kafka-utils.yml`

```yaml
services:
  kafka-producer:
    image: edenhill/kafkacat:1.6.0
    depends_on: [kafka]
    entrypoint: ["/bin/sh", "-lc", "while true; do echo \"hello $(date)\" | kafkacat -b kafka:9092 -t demo-topic; sleep 2; done"]

  kafka-consumer:
    image: edenhill/kafkacat:1.6.0
    depends_on: [kafka]
    entrypoint: ["kafkacat", "-b", "kafka:9092", "-t", "demo-topic", "-C"]
```

These examples are strictly for local development and teaching. Production setups need replication, security, and observability.

### 7.4 Orchestrators (Airflow, Prefect, Dagster, Temporal)

Instructors often want an orchestration control plane next to data stores and APIs. Minimal fragments keep these stacks lightweight so they run the same in Codespaces and on laptops:

- **Airflow** — SequentialExecutor + SQLite with a seeded admin user. Mounts `./airflow` for DAGs and logs. (`services/airflow/d
ocker-compose.airflow.yml`)
- **Prefect** — Prefect 2 server with `./prefect` mapped to persist profiles. (`services/prefect/docker-compose.prefect.yml`)
- **Dagster** — `dagster dev` backed by the lesson’s `./dagster/workspace.yaml`. (`services/dagster/docker-compose.dagster.yml`)
- **Temporal** — Temporalite plus the Temporal UI (8081) with health checks and CORS allowances. (`services/temporal/docker-co
mpose.temporal.yml`)

The aggregate compose generator deduplicates networks/volumes and preserves health checks so these orchestrators can sit alongs
ide Redis, Supabase, Kafka, or custom services without port conflicts. Temporal defaults to Temporalite for minimal setup while
leaving room to add admin tooling later.

## 8. Local parity with Codespaces

Design for identical behavior:

- No host-specific assumptions (use container-internal hostnames, expose ports to `127.0.0.1`).
- Stick to non-privileged features by default; avoid Docker-in-Docker unless required.
- Keep container alive: `command: ["sleep", "infinity"]` (avoids bash-without-tty exits).
- Secrets: use Codespaces secrets in the cloud; `.env` (git ignored) locally.
- Volumes: prefer named volumes for data services where feasible.

## 9. Versioning, provenance, and publishing

- OCI labels on images with org/course/lesson/version, git SHA, schema version.
- Tagging strategy:
  - Stable baseline: `:ubuntu-24.04`
  - Lesson-locked: `:org-course-lesson-vYYYY.MM.DD`
- GitHub Actions for prebuilds (per preset or per generated lesson preset).
- Makefile convenience (at repo root):

  ```makefile
  .PHONY: build-full push-full build-node push-node build-python push-python
  REGISTRY ?= ghcr.io/airnub-labs/templates
  TAG      ?= ubuntu-24.04

  build-full:
  devcontainer build --workspace-folder images/presets/full --image-name $(REGISTRY)/full:$(TAG)

  push-full: build-full
  devcontainer build --workspace-folder images/presets/full --image-name $(REGISTRY)/full:$(TAG) --push
  ```

## 10. Platform architecture (SaaS overview)

### Personas

- **Org Admin** — manages schools/departments, billing, quotas, policies.
- **Teacher** — designs lessons, picks features/services, uploads materials, publishes images.
- **TA** — assists with lesson rollout, reviews student repos.
- **Student** — opens unique lesson link; gets a repo and environment; starts coding.

### Core components

- **Catalog (this repo):** base, templates (scaffolds), presets (prebuild contexts).
- **Manifest Service:** API + UI to create and update `LessonEnv` manifests.
- **Generator Service:** consumes manifests → produces preset contexts + lesson repo scaffolds; kicks CI.
- **Publisher:** builds and pushes images to GHCR; creates/updates lesson repos (or integrates with GitHub Classroom to create per-student repos).
- **Joiner:** issues unique links for each student; provisions access/secrets; redirects to Codespaces or local instructions.

### Secrets and config

- No secrets in images. Use Codespaces secrets or `.env` locally. Provide `.env.example` in lesson repos.

### RBAC

- **Org Admin:** org policies, budgets.
- **Teacher:** create manifests, publish images, manage lessons.
- **TA:** manage cohorts, moderate submissions.
- **Student:** read and write to their own lesson repo; no registry push.

### Cost and performance

- Prebuild images once, reuse across a cohort.
- Share base layers across presets to keep pulls fast.
- Optional image cache in region (for large classes).

### Observability

- Minimal, privacy-respecting telemetry (duration to ready, cache hit rates).
- Non-personal usage stats to improve catalog presets.

## 11. What exists today / positioning

Pieces exist (GitHub Classroom + Codespaces, Gitpod, Replit for Edu, Binder/JupyterHub), but they don’t combine:

- click-to-compose Dev Container + support services,
- prebuild to GHCR,
- auto-provision per-student repos with identical environments,
- focus on non-dev learners and AI lessons.

That’s our edge.

## 12. Minimal changes to the catalog to enable SaaS

You’re already close. Add:

- `/schemas/lesson-env.schema.json` + `examples/lesson-manifests/...`
- `tools/generate-lesson/` (MVP CLI):
  - reads manifest,
  - generates preset build context + repo scaffold,
  - can emit CI workflow file.
- `/services/*` compose fragments:
  - redis, supabase (vendor official compose), kafka-kraft, kafka-utils (optional).
- Docs:
  - `docs/quick-start-fast-classroom.md` (already created),
  - `docs/saas-edu-platform-vision.md` (this doc),
  - `docs/services.md` (how fragments are merged, secrets handling).
- Consistency:
  - Keep extension IDs lowercase.
  - Avoid duplicate extension installers.
  - Keep base preset minimal and generic.

## 13. Roadmap (suggested)

- **M0 (catalog polish):** finalize presets, add services fragments, add schema and examples, add generator MVP + Makefile targets.
- **M1 (SaaS alpha):** hosted UI to create manifests; back end invokes generator; publish to GHCR; create lesson starter repos; issue per-student links.
- **M2 (classroom management):** cohorts, RBAC, TA roles, Codespaces quotas, image caches, templated grading.
- **M3 (AI-first curricula):** preloaded notebooks, model sandboxes, dataset mounts, safe API keys distribution.

## 14. Appendix — example files

### 14.1 Minimal lesson repo `.devcontainer/devcontainer.json`

```json
{
  "name": "lesson-kafka-demo",
  "image": "ghcr.io/airnub-labs/templates/full:ubuntu-24.04",
  "workspaceFolder": "/work",
  "customizations": {
    "vscode": {
      "settings": { "remote.downloadExtensionsLocally": "always" },
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  }
}
```

### 14.2 Generated compose (merged example)

```yaml
services:
  dev:
    build:
      context: .
      dockerfile: .devcontainer/Dockerfile
    command: ["sleep", "infinity"]
    volumes:
      - .:/work

# + redis fragment
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

# + kafka fragment (KRaft)
  kafka:
    image: bitnami/kafka:3.7
    environment:
      - KAFKA_ENABLE_KRAFT=yes
      - KAFKA_CFG_PROCESS_ROLES=broker,controller
      - KAFKA_CFG_NODE_ID=1
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka:9093
    ports: ["9092:9092"]
```

**Final word:** Instructors should compose once, validate once, and teach with confidence. Students should click one link and learn — not wait for installs. Your catalog structure (base → templates → presets) is a perfect foundation. Add the manifest, generator, and service fragments, and you’ve got a SaaS-ready engine for teaching real-world architecture — both locally and in Codespaces.

## Agentic UX: Chat → Manifest → Image → Scaffold

**Goal:** An instructor types:  
> “Spin up an Intro to AI lesson with Python + Prefect + Redis, include Supabase, seed the Week-02 prompt engineering materials.”

**Platform flow:**
1. **LLM Orchestrator** parses the request → proposes a **Lesson Manifest**.
2. **Manifest Validator (MCP)** validates against `schemas/lesson-env.schema.json`.
3. **Catalog Generator (MCP)**:
   - Emits a lesson build context under `images/presets/generated/<slug>/`
   - Injects OCI provenance labels (org/course/lesson/schema/git SHA)
   - Copies requested **service fragments** and emits an **aggregate** `docker-compose.classroom.yml`.
   - Writes a student scaffold under `templates/generated/<slug>/.devcontainer/` referencing the **prebuilt image** (fast start).
   - Optionally materializes **lesson content** from the `starter_repo` (declared in the manifest).
4. **Builder (MCP)** builds and pushes a **multi-arch** lesson image to GHCR.
5. **Provisioner (SaaS)** creates per-student repos (or a shared workspace) from the scaffold.
6. Students open Codespaces or local Dev Containers → **instant identical environment**.

### Agent Roles

- **Instructor Agent (LLM)**: converses with the instructor; drafts/edits manifests; explains trade-offs.
- **Catalog Agent (MCP)**: lists presets, services; validates manifests; generates artifacts.
- **Builder Agent (MCP)**: builds/pushes images; stamps OCI labels; posts logs.
- **Provisioner Agent (SaaS)**: creates repos, grants access, injects secrets (via platform secrets).

### MCP Contract

See **docs/agents-mcp-contract.md** for method names and I/O shapes. The SaaS binds these to internal services that call into this catalog repo’s generator and CI.

### Parity & Device Inclusivity

- **Local = Remote**: Presets and fragments never assume host-specific quirks.
- **Low-power devices**: Prebuilt images + optional noVNC/webtop enable GUI flows without local power.

### Security & Privacy

- No secrets in images or templates.
- Secrets live in the host platform (Codespaces) or instructor-provided `.env` files.
- Aggregate compose uses a private network; only documented ports are mapped.

### Observability

- All agent actions emit logs and artifacts (manifests, config, image tags).
- Build logs and scaffold hashes are retained for auditing.
- Optional telemetry is opt-in and documented.
