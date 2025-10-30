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

## Local ↔ Codespaces parity checklist

- **Ports** — The CDP port (`{{templateOption.cdpPort}}`) is labelled for Codespaces and forwarded automatically in local Docker.
- **Health** — Compose fragments added via manifests inherit health checks so Chrome/Supabase are ready before students connect.
- **Secrets** — Generated presets include `.env.example` placeholders for Supabase keys; push real values via Codespaces secrets.
- **Resources** — Runs comfortably on 4-core / 8 GB Codespaces; for small plans, disable `includeAgentToolingClis` to slim installs.
- **Aggregate compose** — `devc generate` writes `.devcontainer/aggregate.compose.yml` referencing Supabase/Redis fragments with the shared `devnet` network.
