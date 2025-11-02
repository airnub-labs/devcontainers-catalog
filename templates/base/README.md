# Base Workspace Template

A minimal devcontainer template that tracks `mcr.microsoft.com/devcontainers/base` and keeps tooling lean.

## What's inside?

- Docker build args (`UBUNTU_VERSION`, `BASE_IMAGE`) so you can bump Ubuntu or swap the base image without editing files.
- No Node.js, pnpm, or Python pre-installed. Add them with Features or the templates in `images/presets/`.
- Quality-of-life CLI tools: `curl`, `git`, `less`, `iproute2`, `procps`, and `gnupg`.
- VS Code defaults for extension syncing, activity bar layout, theme, startup editor, and a lean extension set.
- No forwarded ports or repo-specific Codespaces permissions—add those in downstream stacks as needed.
- Placeholder post-create and post-start hooks that simply confirm the container is ready.

> Note: No ports are forwarded by default. Add them in downstream stacks or project templates when you need them.

## Quick modes

| Mode | Commands | Notes |
| --- | --- | --- |
| **Fast (Prebuilt)** | 1. Add `spec.base_preset: full` to your manifest.<br>2. `npx @airnub/devc generate <manifest> --out-images images/presets/generated --out-templates templates/generated` | Ships the `full` preset image so students receive Node, pnpm, and Python pre-baked on Codespaces/iPad. |
| **Flexible (Feature)** | `devcontainer up --workspace-folder templates/base` | Keeps the template light so you can layer only the features you need. |

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Use `devcontainer up --workspace-folder templates/base` as described under [Quick modes](#quick-modes) › Flexible (Feature). | Generate with `npx @airnub/devc generate …` following [Quick modes](#quick-modes) › Fast (Prebuilt) so manifests hydrate the workspace. | `spec.base_preset: full` publishes a cached image so Codespaces skips feature installs. | Pin the preset tag in manifests so Codespaces resumes from the cached image after rebuilds. |
| Ports | No forwards by default; add them locally when needed to keep parity explicit. | Same as local—declare ports in the manifest so Codespaces mirrors the forwards. | Prebuilt preset ships without port forwards, leaving manifests free to overlay services. | Codespaces shows no forwarded ports until manifests add them, keeping workspaces private by default. |
| Sidecars | None included; pull service fragments with `devc add service` after generation. | None included; generator adds sidecars consistently for both targets. | Prebuild flow excludes sidecars so image builds remain fast. | When adding sidecars, set manifest port visibility so Codespaces labels them correctly. |
| Minimum resources | Runs comfortably on Docker Desktop defaults (2 CPUs / 4 GB). | Verified on 2-core / 4 GB Codespaces. | Cached preset prevents post-create install spikes on small machines. | Codespaces can auto-upgrade if you raise `spec.resources`; defaults work for classroom starts. |

## Local ↔ Codespaces parity checklist

- **Ports** — none declared; add `forwardPorts` downstream to keep parity explicit.
- **Health** — Base compose uses the default dev service; hook in service fragments via manifests for aggregate compose health checks.
- **Secrets** — `.env.example` is intentionally absent; your manifest controls placeholders so Codespaces secrets match local `.env`.
- **Resources** — Works on the smallest Codespaces (2-core/4 GB) and Docker Desktop defaults.
- **Aggregate compose** — Use `devc add service <name>` after generation to pull in Redis, Supabase, etc., while keeping parity.

## Usage

```bash
# Build or open the template locally
devcontainer up --workspace-folder templates/base

# Override the Ubuntu version on the fly
UBUNTU_VERSION=24.10 devcontainer up --workspace-folder templates/base
```
