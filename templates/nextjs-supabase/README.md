# Next.js + Supabase Template

Extends the base web workspace with optional Next.js scaffolding. Template options let you:

- Reuse the published `ghcr.io/airnub-labs/devcontainer-images/dev-web` image or build locally (`usePrebuiltImage`). A pinned digest will be added after the first
  public publish of the image; until then the templates reference the `:latest` tag.
- Select the Chrome channel/port for the CDP feature (`chromeChannel`, `cdpPort`).
- Decide whether to install the agent tooling CLI suite (`includeAgentToolingClis`).
- Scaffold a Next.js app with version, TypeScript, App Router, and Supabase auth defaults (`scaffold`, `nextVersion`, `ts`, `appRouter`, `auth`).

## Quick modes

| Mode | Commands | Notes |
| --- | --- | --- |
| **Fast (Prebuilt)** | 1. Set `spec.base_preset: node-pnpm` in your manifest.<br>2. `npx @airnub/devc generate <manifest> --out-images images/presets/generated --out-templates templates/generated` | Bundles the `node-pnpm` preset so the Next.js toolchain and Supabase CLI are ready on Codespaces. |
| **Flexible (Feature)** | `devcontainer templates apply --template-id ghcr.io/airnub-labs/devcontainer-templates/nextjs-supabase:1.0.0 --workspace-folder .` | Lets you customise scaffold flags before committing the `.devcontainer/` payload. |

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Apply the template locally as described in [Quick modes](#quick-modes) › Flexible (Feature) when iterating on scaffold flags. | Use the manifest-driven [Quick modes](#quick-modes) › Fast (Prebuilt) flow for Codespaces-ready workspaces. | `spec.base_preset: node-pnpm` caches the workspace image with Next.js and Supabase tooling installed. | Pin preset digests so Codespaces rebuilds stay aligned with local expectations. |
| Ports | Template leaves app ports to downstream apps; add Next.js dev server ports via the manifest when needed. | Codespaces mirrors the same manifest-driven ports so previews stay aligned. | Prebuilt image doesn’t declare ports, keeping the preset generic. | Use Codespaces port visibility controls to manage Next.js preview sharing. |
| Sidecars | Optional Supabase/services sidecars join via `devc add service`; none are baked into the base template. | Same compose fragments launch in Codespaces when included at generation time. | Prebuild focuses on the workspace image; sidecars pull at runtime keeping image pushes small. | Monitor Codespaces notifications to confirm Supabase/Redis fragments finish provisioning before demos. |
| Minimum resources | Runs well on 4-core / 8 GB Docker Desktop when Supabase services are enabled. | Choose a 4-core / 8 GB Codespace for balanced Next.js dev + database workloads. | Cached preset prevents pnpm install storms on first boot. | Raise `spec.resources` if enabling heavy Supabase extensions to avoid throttling on smaller plans. |

## Local ↔ Codespaces parity checklist

- **Ports** — The CDP port (`{{templateOption.cdpPort}}`) is labelled for Codespaces and forwarded automatically in local Docker.
- **Health** — Compose fragments added via manifests inherit health checks so Chrome/Supabase are ready before students connect.
- **Secrets** — Generated presets include `.env.example` placeholders for Supabase keys; push real values via Codespaces secrets.
- **Resources** — Runs comfortably on 4-core / 8 GB Codespaces; for small plans, disable `includeAgentToolingClis` to slim installs.
- **Aggregate compose** — `devc generate` writes `.devcontainer/aggregate.compose.yml` referencing Supabase/Redis fragments with the shared `devnet` network.
