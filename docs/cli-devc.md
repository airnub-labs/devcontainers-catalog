# devc — Dev Container Generator (education-agnostic, lesson-capable)

`@airnub/devc` hardens the catalog workflows while staying useful outside of education. It can:

- Validate manifests against the catalog schema (local checkout or remote ref).
- Generate **prebuild contexts** and **workspace scaffolds** from any working directory.
- Assemble and refresh `aggregate.compose.yml` bundles, copying or fetching service fragments on demand.
- Patch existing workspaces with new services or extensions.
- Build/push multi-arch images with `docker buildx --provenance=false`.

## Catalog discovery

The CLI no longer assumes you run it from the catalog. It locates catalog assets in three tiers:

1. `--catalog-root=/path/to/catalog` (explicit override).
2. Auto-discovery by walking up from `cwd` for a checkout containing `schemas/` or `services/`.
3. Remote fallback — downloads the pinned ref (default `main`) from GitHub into `~/.cache/airnub-devc/<ref>/`.

Related globals (available to every command):

- `--catalog-root <path>` — use a local checkout.
- `--catalog-ref <ref>` — remote ref when a checkout is absent (defaults to `main`).
- `--workspace-root <path>` — point at a workspace when not running from inside it.

## Commands

```
devc validate <manifest>
    Schema validation for LessonEnv manifests.

devc generate <manifest> [opts]
    Emits images/presets/generated/<slug>/ and templates/generated/<slug>/ from any folder.

devc scaffold <manifest> --out <dir>
    Copies a ready-to-use scaffold (with aggregate compose + fragments) into another repo.

devc build --ctx <dir> --tag <image>
    Multi-arch buildx (linux/amd64, linux/arm64) with --provenance=false baked in.

devc doctor <manifest>
    Checks for missing service fragments locally or in the catalog cache.

devc add service <name...>
    Materialises service fragments inside an existing workspace and refreshes aggregate.compose.yml.

devc add extension <extId...>
    Idempotently appends VS Code extensions to .devcontainer/devcontainer.json.

devc sync [--manifest <path>]
    Rebuilds aggregate.compose.yml for the current workspace (from manifest or on-disk fragments).
```

Service-aware commands respect `--fetch-missing-fragments` and `--fetch-ref <ref>` to pin remote fragment sources. When the CLI is operating from a remote catalog cache, fetching is enabled by default.

## Workspace vs. catalog mode

- **Catalog mode** — running from a checkout: outputs land in `images/presets/generated/` and `templates/generated/` relative to your `cwd`.
- **Workspace mode** — running from `.devcontainer` directories: `devc add` and `devc sync` keep fragments under `.devcontainer/services/` and regenerate `aggregate.compose.yml` with consistent networks, profiles, and health checks.

Both modes honour the “local = remote = low-power” contract: generated devcontainers reference prebuilt images, and service fragments are safe to run locally or in Codespaces without tweaks.

## Example runbook (CI-friendly)

```bash
# Validate manifest using remote fallback (no checkout required)
devc validate examples/lesson-manifests/intro-ai-week02.yaml --catalog-ref main

# Generate both outputs into ./out/ using the published catalog
devc generate examples/lesson-manifests/intro-ai-week02.yaml \
  --out-images ./out/images \
  --out-templates ./out/templates \
  --catalog-ref main

# Build and push a throwaway lesson image (multi-arch, provenance disabled)
devc build \
  --ctx ./out/images/my-school-intro-ai-week02 \
  --tag ghcr.io/airnub-labs/ci-e2e-sandboxes/my-school-intro-ai-week02:ubuntu-24.04

# Patch an existing scaffold with Temporal + Prefect fragments
cd templates/generated/my-school-intro-ai-week02

# Copy fragments locally (fetching from the catalog cache if needed)
devc add service temporal prefect

devc sync
```

## Guardrails recap

- Never embed secrets; generated folders surface `.env.example` and `.env.defaults` when manifests request them.
- `aggregate.compose.yml` always uses the `devnet` network and service-specific profiles for clean toggles.
- Service fragments copied into workspaces match their catalog READMEs so instructors know expectations and ports.
