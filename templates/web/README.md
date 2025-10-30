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

## Local ↔ Codespaces parity checklist

- **Ports** — `{{templateOption.cdpPort}}` is labelled as “Chrome DevTools” in `portsAttributes`, so Codespaces forwards with a friendly name.
- **Health** — Headless Chrome is managed by the `chrome-cdp` feature; health is surfaced through the aggregate compose when paired with services.
- **Secrets** — Use `.env.example` in generated presets to communicate Supabase keys; set real values via Codespaces secrets or local `.env`.
- **Resources** — Verified on 2-core / 4 GB Codespaces and local Docker Desktop; bump manifest `spec.resources` if you turn on heavier frameworks.
- **Aggregate compose** — `devc generate` emits `.devcontainer/aggregate.compose.yml` so Redis/Supabase fragments share the same `devnet` network.
