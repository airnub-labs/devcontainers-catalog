# Platform Architecture — Classroom SaaS on Dev Containers

## Personas

- **Curriculum designers** define lesson manifests, select presets, and decide which backing services a classroom needs.
- **Instructors** trigger the generator, review the produced preset context, and kick off prebuild pipelines to GHCR.
- **Students** consume a ready-to-run template that points at the published image and optional service bundle.
- **Platform operators** maintain the catalog, service fragments, and GitHub Actions that publish new images.

## Lifecycle Overview

1. A curriculum designer uses a UI (or edits YAML) to produce a manifest matching `schemas/lesson-env.schema.json`.
2. The manifest is committed alongside course assets and referenced in CI.
3. The generator CLI (`tools/generate-lesson`) reads the manifest and emits:
   - `images/presets/generated/<org>/<course>/<lesson>/` — build context used for prebuilds.
   - `templates/generated/<org>/<course>/<lesson>/` — starter repo scaffold for students.
   - `services/` fragments copied into the preset context when requested.
4. CI (or a manual run) executes `make lesson-build` / `make lesson-push` to build and publish the preset image to GHCR.
5. Lesson repositories pin the published image in `.devcontainer/devcontainer.json` so Codespaces and local Docker machines start instantly.
6. Students launch the lesson workspace. Optional service stacks can be started with `docker compose` using the copied fragments.

## Secrets and Configuration

- Manifests list secret placeholders so instructors remember to map Codespaces secrets or `.env` files before class.
- Generated presets do not include secret material; they only document expected names and env vars.
- When using Supabase, prefer the CLI to manage credentials dynamically.

## Cost and Quotas

- Prebuild images once per lesson and reuse them across cohorts to reduce GHCR storage churn.
- Encourage instructors to stop Codespaces after use and to monitor container uptime with GitHub limits in mind.
- Service fragments expose default ports but do not auto-start; instructors control when to incur resource costs.

## Local Parity Rules

- Every preset and service fragment runs via Docker Compose locally without vendor-specific tooling beyond the Supabase CLI.
- Templates avoid repository-specific scripts so they work in Codespaces, local VS Code, or other `devcontainer` hosts.
- Keep `remote.downloadExtensionsLocally` set to `always` so extensions are cached for offline classrooms.
