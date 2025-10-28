# Dev Container Spec Alignment

This repository separates **Features**, **Templates**, and **Images** to align with the Dev Container specification.

- **Features** (`features/*`) are OCI-friendly installers. Each feature lives under `src/<feature>/` with only a `devcontainer-feature.json`, an idempotent `install.sh`, and documentation, plus matching smoke tests in `test/<feature>/`. No lifecycle hooks or project scaffolding are embedded.
- **Templates** (`templates/*`) package ready-to-use `.devcontainer` payloads. They apply features, wire up multi-container topologies, and expose template options that toggle behaviour without hard-coding project secrets or clone manifests.
- **Images** (`images/*`) provide prebuilt bases published to GHCR for faster Codespaces start times. Templates can opt in through template options (`usePrebuiltImage`).

The repository includes CI workflows to validate features, build/push images, and smoke-test each template with `devcontainer build` to ensure parity with the spec across Linux host architectures.

## Multi-repository onboarding

Templates intentionally avoid embedding repo-clone manifests. Downstream workspaces can layer their own `postCreate` hooks or Codespaces settings after materializing a template, keeping the catalog assets reusable across many projects.

## Sidecar development experience

- The classroom template wires a `webtop` sidecar into Docker Compose for a browser-accessible desktop. Policies mount read-only, and the forwarded port is labeled "Desktop (webtop)" for discoverability.
- Score checks rely on `yq` (with a `grep` fallback) to inspect Compose payloads, avoiding brittle string comparisons and honouring the Dev Container spec guidance around multi-container workspaces.
