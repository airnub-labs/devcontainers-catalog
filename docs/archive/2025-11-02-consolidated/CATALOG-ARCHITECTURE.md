> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-02
> **Reason:** Consolidated into comprehensive catalog design document
> **See Instead:** [docs/architecture/catalog-design.md](../architecture/catalog-design.md)
>
> This document has been merged with CATALOG.md into a single
> comprehensive catalog design guide. All unique information from both documents
> has been preserved and organized in the consolidated version.

---

# Catalog Architecture

## Structure
- `features/*` — idempotent installers (no services).
- `templates/*` — opinionated environments, including `stack-*` flavors.
- `images/*` — prebuilt bases.

## “Stack” = Template
A **stack** here is a Template that bundles a validated combo:
- `dev` (primary container)
- `redis` sidecar
- GUI sidecar (`webtop` or `novnc`)
- Chrome CDP port labels
- Supabase: CLI-managed local by default; compose-based flavor optional.

## Template payloads
Each template publishes `.template/.devcontainer/*` so consumers can copy these files into their repo.

## Reproducibility
Include `stack.lock.json` (or a README section) pinning:
- Feature versions (semver or tags)
- Image digests used by `dev` and sidecars

## CI expectations
- Validate feature schemas & idempotent installation
- Build/push images multi-arch
- Materialize template payloads to a temp dir and run smoke tests (ports reachable, binaries present)
