# AGENTS.md — Catalog Guardrails

This repository now hosts only the **Devcontainers Catalog**: reusable Features, Templates, Images, and supporting docs.

## Directory Ownership

| Path | Role | Notes |
| --- | --- | --- |
| `features/*` | Dev Container Features | Keep installers idempotent. No long-running services or secrets. |
| `templates/*` | Dev Container Templates | Provide reusable `.devcontainer` payloads that stay repo-agnostic. |
| `images/*` | Base and dev images | Publish to GHCR via CI. Keep Dockerfiles minimal and multi-arch friendly. |
| `docs/*` | Catalog documentation | Update alongside code changes. |
| `.github/workflows/*` | CI automation | Workflows publish features/images and smoke-test templates. |

## Non-negotiable Invariants

1. Features install tooling only. Avoid starting daemons or embedding project secrets.
2. Templates must not clone repositories automatically. Provide options for behaviour toggles instead of hard-coded paths.
3. Images should build on Ubuntu 24.04, support amd64 + arm64, and lean on `ghcr.io/airnub-labs/devcontainer-images/dev-base` / `ghcr.io/airnub-labs/devcontainer-images/dev-web` where applicable.
4. Documentation reflects the catalog-only scope (no workspace-specific instructions).
5. CI workflows stay functional: feature validation, template smoke tests, and image builds.

## Naming & Publishing

- **Features** → `ghcr.io/airnub-labs/devcontainer-features/<feature-id>:<semver>`
- **Templates & stacks** → `ghcr.io/airnub-labs/devcontainer-templates/<template-id>:<semver>` (stacks keep their `stack-` prefix).
- **Images** → `ghcr.io/airnub-labs/devcontainer-images/<image-name>:<semver>`
- Always publish via CI (`publish-features`, `publish-templates`, `build-images`). Never push the parent `devcontainer-features` folder as a package.

## Helpful Commands

- `npx --yes @devcontainers/cli@latest features test --project-root . --features-root features`
- `devcontainer build --workspace-folder <path>` (after materializing a template)
- `docker buildx build --platform linux/amd64,linux/arm64 images/dev-base`

## Don’ts

- ❌ Reintroduce `.devcontainer/` or `.code-workspace` folders at the repo root.
- ❌ Commit `apps/` checkouts or workspace-local assets.
- ❌ Start background services inside feature installers.

Thanks for keeping the catalog lean and reusable! 🎛️
