# Web Template

Combines the `supabase-cli` and `chrome-cdp` features to create a headless web workspace. Template options let you:

- Pull the prebuilt `ghcr.io/airnub-labs/devcontainer-images/dev-web` image or build locally (`usePrebuiltImage`). The image digest will be pinned
  once the first public publish completes; until then the templates continue to rely on the `:latest` tag.
- Choose the Chrome release channel and exposed CDP port (`chromeChannel`, `cdpPort`).

## Quick modes

| Mode | Commands | Notes |
| --- | --- | --- |
| **Fast (Prebuilt)** | 1. Declare `spec.base_preset: node-pnpm` in your manifest.<br>2. `npx @airnub/devc generate examples/lesson-manifests/intro-ai-week02.yaml --out-images images/presets/generated --out-templates templates/generated` | Uses the catalog preset so Codespaces/iPad students hit a prebuilt image with Chrome and Supabase ready. |
| **Flexible (Feature)** | `devcontainer templates apply --template-id ghcr.io/airnub-labs/devcontainer-templates/web:1.0.0 --workspace-folder .` | Materialises the template so you can tweak features or add extra containers before committing. |

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Apply the template or `devcontainer up` locally per [Quick modes](#quick-modes) › Flexible (Feature). | Follow [Quick modes](#quick-modes) › Fast (Prebuilt) to generate a Codespaces-ready workspace. | `spec.base_preset: node-pnpm` caches Chrome + Supabase tooling in the workspace image. | Pin preset digests so Codespaces rebuilds stay aligned with local testing. |
| Ports | Template exposes `{{templateOption.cdpPort}}` for Chrome CDP as described in [Local ↔ Codespaces parity checklist](#local--codespaces-parity-checklist). | Codespaces labels the same port automatically. | Port metadata is included in the template so prebuilds inherit it. | Keep the CDP port private unless sharing remote debugging externally. |
| Sidecars | None by default; layer services via manifests or `devc add service`. | Same generator flow adds sidecars for Codespaces builds. | Prebuild focuses on the workspace image, leaving sidecars to runtime for smaller pushes. | Watch Codespaces health notifications when adding sidecars so you know when they’re ready. |
| Minimum resources | Runs on 2-core / 4 GB locally; bump resources if enabling heavy browser testing. | 2-core / 4 GB Codespace works; upgrade for heavier automation. | Prebuilt workspace prevents pnpm installs from delaying start on small machines. | Increase Codespaces machine size if parallel Supabase + Chrome workloads cause contention. |

## Local ↔ Codespaces parity checklist

- **Ports** — `{{templateOption.cdpPort}}` is labelled as “Chrome DevTools” in `portsAttributes`, so Codespaces forwards with a friendly name.
- **Health** — Headless Chrome is managed by the `chrome-cdp` feature; health is surfaced through the aggregate compose when paired with services.
- **Secrets** — Use `.env.example` in generated presets to communicate Supabase keys; set real values via Codespaces secrets or local `.env`.
- **Resources** — Verified on 2-core / 4 GB Codespaces and local Docker Desktop; bump manifest `spec.resources` if you turn on heavier frameworks.
- **Aggregate compose** — `devc generate` emits `.devcontainer/aggregate.compose.yml` so Redis/Supabase fragments share the same `devnet` network.
