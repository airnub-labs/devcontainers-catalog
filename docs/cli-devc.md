# devc — Dev Container Generator (education-agnostic, lesson-capable)

`@airnub/devc` helps you:
- Validate a manifest that describes a dev environment.
- Generate a **prebuild context** (for a prebuilt image).
- Generate a **workspace scaffold** that references the prebuilt image.
- Assemble an **aggregate.compose.yml** that pulls in service fragments (Redis, Supabase, Kafka/KRaft, Temporal, Airflow, Prefect, Dagster).

It’s useful for any developer. It also fully supports classroom “lessons” by treating lessons as a specific type of environment.

## Install

> When published to npm:
```bash
npm i -g @airnub/devc
```

For local dev (repo checkout):

```bash
cd tools/airnub-devc
npm install
npm run build
node dist/index.js --help
```

## Two common flows

1. **Flexible Template Mode**

   Copy a template from `templates/*` into your repo (uses Features; slower cold start, very flexible).

2. **Fast Prebuilt Mode (recommended for classrooms)**

   Use `devc generate` to produce a prebuild context and a scaffold that references the prebuilt image.

   Build/push the image once; students start instantly with identical environments.

## Commands

```
devc validate <manifest>               # schema validation
devc generate <manifest> [opts]        # emits images/presets/generated/<id> + templates/generated/<id>
devc build --ctx <dir> --tag <tag>     # buildx multi-arch + push (provenance disabled)
devc scaffold <manifest> --out <dir>   # copy a ready scaffold to an external repo
devc doctor <manifest>                 # check service fragments presence (and optionally fetch)
```

Key options:

- `--fetch-missing-fragments` fetches service fragments from the catalog repo if not found locally.
- `--fetch-ref <ref>` pin raw fetch to a branch/tag/SHA (default: `main`).
- `--force` allows overwriting existing generated directories.

## Manifest

See `schemas/lesson-env.schema.json` and `examples/lesson-manifests/intro-ai-week02.yaml`.

## Secrets

Never bake secrets into images. Use `.env.example`, Codespaces secrets, or your SaaS secure storage.

Non-secret defaults can live in `.env.defaults`.

## Local = Remote = Low-power

Referencing a prebuilt image avoids feature re-installs and makes low-power devices (e.g., iPad) viable via hosted Dev Container providers.

---

## Example runbook (what the CI will do locally)

```bash
# Validate
node tools/airnub-devc/dist/index.js validate examples/lesson-manifests/intro-ai-week02.yaml

# Generate both outputs
node tools/airnub-devc/dist/index.js generate examples/lesson-manifests/intro-ai-week02.yaml --fetch-missing-fragments

# Build/push a throwaway tag (adjust to your GHCR)
node tools/airnub-devc/dist/index.js build \
  --ctx images/presets/generated/my-school-intro-ai-week02 \
  --tag ghcr.io/airnub-labs/ci-e2e-sandboxes/my-school-intro-ai-week02:ubuntu-24.04

# Scaffold for a classroom workspace repo
node tools/airnub-devc/dist/index.js scaffold \
  examples/lesson-manifests/intro-ai-week02.yaml \
  --out ../my-classroom-workspace \
  --fetch-missing-fragments
```
