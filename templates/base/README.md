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

## Usage

```bash
# Build or open the template locally
devcontainer up --workspace-folder templates/base

# Override the Ubuntu version on the fly
UBUNTU_VERSION=24.10 devcontainer up --workspace-folder templates/base
```
