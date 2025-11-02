# Naming Migration Notes

This document tracks the audit performed while unifying all catalog artifacts under the canonical GHCR namespaces.

## Inventory (pre-change)

- Images referenced as `ghcr.io/airnub-labs/dev-web` and `ghcr.io/airnub-labs/dev-base` across:
  - `docs/MIGRATION.md`
  - `docs/docker-containers.md`
  - `docs/CATALOG.md`
  - `AGENTS.md`
  - `VERSIONING.md`
  - `images/dev-*/README.md`
  - Template READMEs and `.template/.devcontainer` payloads
  - `images/dev-web/Dockerfile` and template Dockerfiles that inherit from the base image
- CI workflows published features under the combined namespace `airnub-labs/devcontainer-features` and images under the legacy short names.
- No lingering references to the deprecated `mcp-clis` feature ID were found (`agent-tooling-clis` is already in use).

## Standard namespaces

- **Features:** `ghcr.io/airnub-labs/devcontainer-features/<feature-id>:<semver>`
- **Templates & stacks:** `ghcr.io/airnub-labs/devcontainer-templates/<template-id>:<semver>`
- **Images:** `ghcr.io/airnub-labs/devcontainer-images/<image-name>:<semver>` (with matching `:MAJOR` and `:latest` tags)

## Migration guidance

- Update documentation, templates, and Dockerfiles to consume `devcontainer-images/dev-web` and `devcontainer-images/dev-base`.
- Use the `publish-features`, `publish-templates`, and `build-images` workflows to publish—these pin the correct namespaces and avoid pushing parent folders.
- For downstream repositories, the following snippets handle retagging:

  ```bash
  docker pull ghcr.io/airnub-labs/dev-web:<old>
  docker tag ghcr.io/airnub-labs/dev-web:<old> ghcr.io/airnub-labs/devcontainer-images/dev-web:<semver>
  docker push ghcr.io/airnub-labs/devcontainer-images/dev-web:<semver>

  docker pull ghcr.io/airnub-labs/dev-base:<old>
  docker tag ghcr.io/airnub-labs/dev-base:<old> ghcr.io/airnub-labs/devcontainer-images/dev-base:<semver>
  docker push ghcr.io/airnub-labs/devcontainer-images/dev-base:<semver>
  ```

- Prefer digest pins (`@sha256:<digest>`) once the first release is seeded; keep `:major` tags available for quick starts.
