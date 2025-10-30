# From Lesson Manifest → Image → Student Scaffold

The lesson manifest captures everything needed to produce a prebuilt lesson image and a student-ready scaffold. The `@airnub/devc` CLI validates the manifest against `schemas/lesson-env.schema.json` so the SaaS and CLI stay aligned.

## 1. Draft the Manifest

Start from `examples/lessons/intro-ai-week02.yaml` and adjust:

* `metadata.org`, `metadata.course`, `metadata.lesson` → rolled into the image name `ghcr.io/airnub-labs/templates/lessons/<org-course-lesson>:<tag>`.
* `spec.base_preset` → points at a catalog preset under `images/presets/` for the image build context.
* `spec.services` → compose fragments that should be embedded locally (Supabase, Redis, Kafka, etc.).
* `spec.env` and `spec.secrets_placeholders` → non-secret defaults vs. placeholders for Codespaces secrets.

## 2. Generate the Scaffold

```bash
npx @airnub/devc generate lesson \
  -m examples/lessons/intro-ai-week02.yaml \
  -o ../intro-ai-week02 \
  --catalog-ref main
```

Outputs include:

* `.devcontainer/devcontainer.json` referencing the future lesson image.
* `.devcontainer/services/*` for every selected service fragment.
* `.devcontainer/.env.example` with merged env placeholders.
* `.github/workflows/prebuild.yml` calling back into the CLI to publish the image.
* `lesson.yaml` — a copy of the manifest for easy updates.

## 3. Publish the Lesson Image

Run locally or wire into CI using the workflow:

```bash
npx @airnub/devc publish lesson \
  -m lesson.yaml \
  --catalog-ref main \
  --provenance=false
```

The command wraps `devcontainer build` with multi-arch buildx, `--provenance=false`, and pushes to GHCR.

## 4. Keep Students in Sync

When catalog assets change, rerun `generate lesson` with the new `--catalog-ref`. Files outside the managed blocks remain untouched, so instructors can keep hand-written instructions alongside the generated `.devcontainer` payload.

All generated files carry the catalog ref and CLI version so support can trace which catalog release produced the scaffold.
