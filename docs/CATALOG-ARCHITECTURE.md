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
