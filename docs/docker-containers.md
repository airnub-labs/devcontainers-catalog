# Docker container architecture

Catalog assets focus on two container layers:

1. **Primary Dev Container** – defined by each template’s `.devcontainer/devcontainer.json`. It installs tooling through catalog features, optionally using the published images (`ghcr.io/airnub-labs/dev-base` or `dev-web`).
2. **Optional sidecars** – declared through template `dockerComposeFile` entries. Examples include the classroom template’s `webtop` desktop container.

Understanding how these layers interact makes it easier to compose new templates and extend the catalog.

---

## Primary Dev Container

The primary container runs the developer tooling. Templates can either:

- Pull `ghcr.io/airnub-labs/dev-web:latest` (or another published image) for a fast start, **or**
- Build locally from the provided Dockerfile, which itself extends `ghcr.io/airnub-labs/dev-base:latest`.

Each template wires catalog features such as `chrome-cdp`, `supabase-cli`, and `agent-tooling-clis`. Post-create hooks stay lightweight—install dependencies, print versions, and configure policies—but avoid cloning repositories or depending on workspace-specific paths.

### Shared memory & ports

Templates expose only the ports required for the configured services (for example, the Chrome DevTools Protocol port or the webtop desktop port). When sidecars require additional shared memory (like GUI workloads), templates configure `shm_size` in their compose files.

---

## Sidecars

Sidecars run services that complement, but do not replace, the primary dev container. Examples:

- **`webtop` desktop** – provides a browser-accessible desktop for touch-friendly devices. Policies mount from `.devcontainer/policies/*` and can be overridden via template options.

Sidecars are optional; consumers can fork a template and remove them if unnecessary. Keep sidecars stateless when possible, relying on features or post-create hooks for configuration.

---

## Customising templates

When extending a template:

1. Layer additional catalog features or images via `devcontainer.json`.
2. Add or remove services in `compose.yaml`, keeping mounts relative to the workspace folder materialised by the Dev Containers CLI.
3. Prefer new template options over hard-coded behaviour so consumers can opt in or out without editing Dockerfiles.

These practices keep the catalog assets reusable across many repositories while staying compliant with the Dev Container specification.
