# Devcontainers Catalog Matrix

The catalog ships reusable Dev Container **features**, **templates**, and **images**. Use this matrix to understand what each asset provides and how they compose together.

## Features

| Feature | Description | Key Options |
| --- | --- | --- |
| `supabase-cli` | Installs the Supabase CLI with optional helper scripts and metadata capture. | `version`, `manageLocalStack`, `services`, `projectRef` |
| `chrome-cdp` | Headless Chrome with a DevTools Protocol endpoint managed by supervisord. | `channel`, `port` |
| `agent-tooling-clis` | Installs Codex, Claude, and Gemini CLIs using pnpm/npm fallbacks. Configure MCP servers per project via template hooks. | `installCodex`, `installClaude`, `installGemini`, `versions` |
| `docker-in-docker-plus` | Adds Buildx/BuildKit ergonomics on top of Docker-in-Docker. | _none_ |
| `cuda-lite` | Installs CUDA runtime libraries only when a GPU is detected. | _none_ |

## Templates

| Template | Version | Base Image(s) | Included Features | Notes |
| --- | --- | --- | --- | --- |
| `web` | `1.0.0` | `ghcr.io/airnub-labs/dev-web` (optional local build) | `chrome-cdp`, `supabase-cli` | Options toggle the prebuilt image and CDP channel/port. |
| `nextjs-supabase` | `1.0.0` | `ghcr.io/airnub-labs/dev-web` (optional local build) | `chrome-cdp`, `supabase-cli`, `agent-tooling-clis` (optional) | Supports turnkey Next.js scaffolding with Supabase integrations. |
| `classroom-studio-webtop` | `1.0.0` | `mcr.microsoft.com/devcontainers/universal:2` (override with `DEVCONTAINER_CLASSROOM_BASE_IMAGE`) + `lscr.io/linuxserver/webtop` sidecar | `supabase-cli`, `agent-tooling-clis` | Managed/none Chrome policy presets mount into the sidecar; override via the `chromePolicies` option. |

## Images

| Image | Description |
| --- | --- |
| `dev-base` | Ubuntu base with Node.js, pnpm, Playwright dependencies, and general developer tooling. |
| `dev-web` | Extends `dev-base` with Chrome repositories and web tooling. |

Refer to [`VERSIONING.md`](../VERSIONING.md) for published tags and digests.

## Published Coordinates

### Features (OCI)
- `ghcr.io/airnub-labs/devcontainer-features/supabase-cli:<semver>`
- `ghcr.io/airnub-labs/devcontainer-features/chrome-cdp:<semver>`
- `ghcr.io/airnub-labs/devcontainer-features/agent-tooling-clis:<semver>`
- `ghcr.io/airnub-labs/devcontainer-features/docker-in-docker-plus:<semver>`
- `ghcr.io/airnub-labs/devcontainer-features/cuda-lite:<semver>`

### Images
- `ghcr.io/airnub-labs/dev-base:latest`
- `ghcr.io/airnub-labs/dev-web:latest`

### Templates
- `templates/web`
- `templates/nextjs-supabase`
- `templates/classroom-studio-webtop`
