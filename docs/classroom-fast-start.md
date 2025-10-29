# Classroom Fast Start Guide

This guide walks instructors through producing a fast-start lesson image and scaffold so students launch into an identical workspace locally or in Codespaces.

## 1. Describe the Lesson

1. Copy `examples/lesson-manifests/intro-ai-week02.yaml` and update the metadata (`org`, `course`, `lesson`).
2. Choose a base preset from `images/presets/` and list it under `spec.base_preset`.
3. Add VS Code extensions and settings. The generator lowercases IDs and enforces `remote.downloadExtensionsLocally: "always"` for parity.
4. Declare optional services (`redis`, `supabase`, `kafka`, etc.). The generator copies their compose fragments into the build context.
5. List any secrets you expect to provide at runtime in `spec.secrets_placeholders`.

## 2. Generate Preset + Scaffold

```bash
make gen LESSON_MANIFEST=examples/lesson-manifests/intro-ai-week02.yaml
```

This writes two artifacts using a stable slug derived from `org-course-lesson`:

- `images/presets/generated/<lesson-slug>/` — build context used to produce a lesson-specific image.
- `templates/generated/<lesson-slug>/.devcontainer/devcontainer.json` — scaffold that references the published lesson image.

## 3. Build and Publish the Lesson Image

```bash
make lesson-build LESSON_MANIFEST=examples/lesson-manifests/intro-ai-week02.yaml
make lesson-push  LESSON_MANIFEST=examples/lesson-manifests/intro-ai-week02.yaml
```

The targets use `yq` (if available) to derive `LESSON_SLUG` and publish `ghcr.io/airnub-labs/templates/lessons/<lesson-slug>:<tag>`. Override `LESSON_SLUG` manually when `yq` is not installed.

> **Multi-arch builds matter:** the bundled `publish-lesson-images` workflow runs Docker Buildx for `linux/amd64` and `linux/arm64` so Apple Silicon laptops and cloud-hosted Codespaces pull the same image. Keep both architectures enabled unless you have a very specific reason to diverge.

## 4. Wire Student Repositories

- **Fast path:** copy the generated `.devcontainer/devcontainer.json` into the Classroom Workspace Starter repo. Students immediately pull the prebuilt image.
- **Custom path:** copy a template from `templates/` and adjust features or services. Initial start will take longer because Features run on create.

When services are required, run `docker compose` from the generated preset context (or vendor the fragments into the workspace repo) so both local Docker and Codespaces behave the same way.

Generated lesson artifacts under `images/presets/generated/` and `templates/generated/` are intentionally gitignored—regenerate them with `make gen` whenever you update a manifest so reviewers always see current outputs.

## 5. Keep Everything in Sync

- Regenerate after manifest changes; the generator is idempotent and overwrites existing outputs.
- Rebuild when base presets receive updates or security patches.
- Periodically refresh vendored service fragments (Supabase, Kafka) so they match upstream defaults.

With this flow, every student receives the same workspace with predictable start times, whether they launch in a browser or on a local machine.
