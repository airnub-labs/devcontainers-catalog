> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-02
> **Reason:** Consolidated into comprehensive catalog design document
> **See Instead:** [docs/architecture/catalog-design.md](../architecture/catalog-design.md)
>
> This document has been merged with CATALOG-ARCHITECTURE.md into a single
> comprehensive catalog design guide. All unique information from both documents
> has been preserved and organized in the consolidated version.

---

# Devcontainers Catalog Matrix

The catalog ships reusable Dev Container **features**, **templates**, and **images**. Use this matrix to understand what each asset provides and how they compose together.

## Features

| Feature | Description | Key Options | OCI Reference |
| --- | --- | --- | --- |
| `supabase-cli` | Installs the Supabase CLI with optional helper scripts and metadata capture. | `version`, `manageLocalStack`, `services`, `projectRef` | `ghcr.io/airnub-labs/devcontainer-features/supabase-cli:<semver>` |
| `chrome-cdp` | Headless Chrome with a DevTools Protocol endpoint managed by supervisord. | `channel`, `port` | `ghcr.io/airnub-labs/devcontainer-features/chrome-cdp:<semver>` |
| `deno` | Installs the Deno runtime with optional shell completions. | `version`, `installCompletions` | `ghcr.io/airnub-labs/devcontainer-features/deno:<semver>` |
| `agent-tooling-clis` | Installs Codex, Claude, and Gemini CLIs using pnpm/npm fallbacks. Configure MCP servers per project via template hooks. | `installCodex`, `installClaude`, `installGemini`, `versions` | `ghcr.io/airnub-labs/devcontainer-features/agent-tooling-clis:<semver>` |
| `cursor-ai` | Installs the Cursor AI CLI via pnpm/npm with optional version pinning. | `version` | `ghcr.io/airnub-labs/devcontainer-features/cursor-ai:<semver>` |
| `docker-in-docker-plus` | Adds Buildx/BuildKit ergonomics on top of Docker-in-Docker. | _none_ | `ghcr.io/airnub-labs/devcontainer-features/docker-in-docker-plus:<semver>` |
| `cuda-lite` | Installs CUDA runtime libraries only when a GPU is detected. | _none_ | `ghcr.io/airnub-labs/devcontainer-features/cuda-lite:<semver>` |

## Templates

| Template | Version | Base Image(s) | Included Features | Notes | OCI Reference |
| --- | --- | --- | --- | --- | --- |
| `web` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` (optional local build) | `chrome-cdp`, `supabase-cli` | Options toggle the prebuilt image and CDP channel/port. | `ghcr.io/airnub-labs/devcontainer-templates/web:1.0.0` |
| `nextjs-supabase` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` (optional local build) | `chrome-cdp`, `supabase-cli`, `agent-tooling-clis` (optional) | Supports turnkey Next.js scaffolding with Supabase integrations. | `ghcr.io/airnub-labs/devcontainer-templates/nextjs-supabase:1.0.0` |
| `classroom-studio-webtop` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` + `lscr.io/linuxserver/webtop` sidecar | `supabase-cli`, `agent-tooling-clis` | Managed/none Chrome policy presets mount into the sidecar; override via the `chromePolicies` option. | `ghcr.io/airnub-labs/devcontainer-templates/classroom-studio-webtop:1.0.0` |
| `stack-web-node-supabase-webtop` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` + optional Redis/webtop sidecars | `chrome-cdp`, `supabase-cli`, `agent-tooling-clis` | Stack template combining Node tooling, Supabase CLI, and GUI sidecars. | `ghcr.io/airnub-labs/devcontainer-templates/stack-web-node-supabase-webtop:1.0.0` |
| `stack-nextjs-supabase-webtop` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` + optional Redis/webtop sidecars | `chrome-cdp`, `supabase-cli`, `agent-tooling-clis` (optional) | Stack template with Next.js scaffolding toggles. | `ghcr.io/airnub-labs/devcontainer-templates/stack-nextjs-supabase-webtop:1.0.0` |
| `stack-nextjs-supabase-novnc` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` + noVNC sidecar | `chrome-cdp`, `supabase-cli`, `agent-tooling-clis` (optional) | noVNC desktop variant of the stack. | `ghcr.io/airnub-labs/devcontainer-templates/stack-nextjs-supabase-novnc:1.0.0` |

## Images

| Image | Description | OCI Reference |
| --- | --- | --- |
| `dev-base` | Ubuntu base with Node.js, pnpm, Playwright dependencies, and general developer tooling. | `ghcr.io/airnub-labs/devcontainer-images/dev-base:<semver>` |
| `dev-web` | Extends `dev-base` with Chrome repositories and web tooling. | `ghcr.io/airnub-labs/devcontainer-images/dev-web:<semver>` |

Refer to [`VERSIONING.md`](../VERSIONING.md) for published tags and digests.

## Published Coordinates

- **Features:** `ghcr.io/airnub-labs/devcontainer-features/<feature-id>:<semver>`
- **Templates & stacks:** `ghcr.io/airnub-labs/devcontainer-templates/<template-id>:<semver>`
- **Images:** `ghcr.io/airnub-labs/devcontainer-images/<image-name>:<semver>` (with matching `:MAJOR` and `:latest` tags)

### Migration from legacy names

Legacy coordinates used the shorter `ghcr.io/airnub-labs/dev-web` / `dev-base` image names. Migrate consumers with:

```bash
sed -i 's#ghcr.io/airnub-labs/dev-web#ghcr.io/airnub-labs/devcontainer-images/dev-web#g' <file>
sed -i 's#ghcr.io/airnub-labs/dev-base#ghcr.io/airnub-labs/devcontainer-images/dev-base#g' <file>
```
