# From Lesson Manifest → Image → Student Scaffold

The lesson manifest captures everything needed to produce a prebuilt lesson image and a student-ready scaffold. The `@airnub/devc` CLI validates the manifest against `schemas/lesson-env.schema.json` so the SaaS and CLI stay aligned.

## Golden paths at a glance

| Mode | Commands | Cold start | Warm start |
| --- | --- | --- | --- |
| **Fast (Prebuilt)** | `devc validate examples/lesson-manifests/intro-ai-week02.yaml`<br>`devc generate examples/lesson-manifests/intro-ai-week02.yaml --out-images images/presets/generated --out-templates templates/generated`<br>`devc build --ctx images/presets/generated/airnub-intro-ai-week02 --tag ghcr.io/airnub-labs/templates/lessons/airnub-intro-ai-week02:ubuntu-24.04-airnub-intro-ai-week02-v1`<br>`devc scaffold examples/lesson-manifests/intro-ai-week02.yaml --out workspaces/intro-ai-week02` | ~2 minutes to publish the first image (including buildx). | <1 minute to regenerate scaffold or rebuild once image is cached. |
| **Flexible (Feature)** | `devcontainer templates apply --template-id ghcr.io/airnub-labs/devcontainer-templates/stack-nextjs-supabase-webtop:1.0.0 --workspace-folder .`<br>`devc add service temporal prefect` | 3–4 minutes for the initial feature installs. | Seconds to reopen the environment after the first build. |

## 1. Draft the Manifest

Start from `examples/lessons/intro-ai-week02.yaml` and adjust:

* `metadata.org`, `metadata.course`, `metadata.lesson` → rolled into the image name `ghcr.io/airnub-labs/templates/lessons/<org-course-lesson>:<tag>`.
* `spec.base_preset` → points at a catalog preset under `images/presets/` for the image build context.
* `spec.services` → compose fragments that should be embedded locally (Supabase, Redis, Kafka, etc.).
* `spec.env` and `spec.secrets_placeholders` → non-secret defaults vs. placeholders for Codespaces secrets.

## 2. Generate the Scaffold

```bash
devc generate examples/lesson-manifests/intro-ai-week02.yaml \
  --out-images images/presets/generated \
  --out-templates templates/generated \
  --fetch-missing-fragments \
  --git-sha $(git rev-parse HEAD)
```

Outputs include:

* `.devcontainer/devcontainer.json` referencing the future lesson image.
* `.devcontainer/services/*` for every selected service fragment.
* `.devcontainer/.env.example` with merged env placeholders.
* `.github/workflows/prebuild.yml` calling back into the CLI to publish the image.
* `lesson.yaml` — a copy of the manifest for easy updates.

## 3. Publish the Lesson Image

Run locally or wire into CI using the CLI. `devc build` enforces canonical tags and multi-arch settings:

```bash
devc doctor lesson.yaml --tag ghcr.io/airnub-labs/templates/lessons/airnub-intro-ai-week02:ubuntu-24.04-airnub-intro-ai-week02-v1

devc build \
  --ctx images/presets/generated/airnub-intro-ai-week02 \
  --tag ghcr.io/airnub-labs/templates/lessons/airnub-intro-ai-week02:ubuntu-24.04-airnub-intro-ai-week02-v1 \
  --push \
  --manifest lesson.yaml \
  --version v1 \
  --git-sha $(git rev-parse HEAD)
```

The command wraps `docker buildx build` with multi-arch targets, `--provenance=false`, and pushes to GHCR. Use `--oci-output <dir>` when you need an offline OCI archive instead of a push.

## 4. Keep Students in Sync

When catalog assets change, rerun `devc generate` with the new `--catalog-ref` or call `devc sync` from inside the scaffold. Files outside the managed blocks remain untouched, so instructors can keep hand-written instructions alongside the generated `.devcontainer` payload.

All generated files carry the catalog ref and CLI version so support can trace which catalog release produced the scaffold.
