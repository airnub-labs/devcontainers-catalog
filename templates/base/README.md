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
