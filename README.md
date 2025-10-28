# Devcontainers Catalog (Airnub Labs)

Catalog of **Dev Container Features**, **Templates**, and **prebuilt Images** for Codespaces + local Dev Containers.

- Features (OCI): `ghcr.io/airnub-labs/devcontainer-features/<feature-id>:<semver>`
- Images: `ghcr.io/airnub-labs/<image-name>:<semver>`
- Templates: versioned template payloads (see `templates/*`)

## Contents
- `features/` – idempotent installers for tools (no services)
- `templates/` – opinionated multi-container stacks
- `images/` – base & dev images (multi-arch)
- `docs/` – spec-alignment, catalog matrix, maintainers, security

## Publish & Test
Publishing is automated via GitHub Actions:
- Features ➜ GHCR (OCI) per subfolder
- Images ➜ GHCR (multi-arch)
- Templates ➜ materialized and smoke-tested

See `docs/CATALOG.md` and `.github/workflows/*`.
