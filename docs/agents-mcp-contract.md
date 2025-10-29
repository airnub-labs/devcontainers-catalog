# MCP Contract — Catalog Methods

> This is the thin interface the SaaS binds to internal services. It is intentionally small and stable.

## Methods

### `catalog.listPresets() -> Preset[]`
Returns preset catalog (id, base image tag, feature summary, docs path).

### `catalog.listServices() -> Service[]`
Returns service fragments (id, description, default ports, docs path).

### `manifest.validate(manifest: LessonEnv) -> ValidationResult`
Validates against `schemas/lesson-env.schema.json` (strict: `additionalProperties: false`).

### `lesson.generate(manifest: LessonEnv) -> GenerationResult`
Emits:
- `images/presets/generated/<slug>/` build ctx (Dockerfile + labels)
- `templates/generated/<slug>/.devcontainer/devcontainer.json`
- `docker-compose.classroom.yml` (aggregate from requested services)
- `README-SERVICES.md` and any copied `.env.example-*`

### `image.buildPush({ slug, tag }) -> BuildResult`
Builds **multi-arch** and pushes to GHCR:
`ghcr.io/airnub-labs/templates/lessons/<slug>:<tag>`

### `scaffold.smokeTest({ slug }) -> SmokeResult`
Runs:
- `devcontainer build` on generated scaffold
- `docker compose -f docker-compose.classroom.yml config` (if present)

## Determinism & Audit

- Same manifest → same outputs (modulo digests/timestamps).
- All images must include OCI labels:
  - `org.opencontainers.image.source`
  - `org.opencontainers.image.revision`
  - `edu.airnub.org`, `edu.airnub.course`, `edu.airnub.lesson`
  - `edu.airnub.schema` (e.g., `airnub.devcontainers/v1`)
