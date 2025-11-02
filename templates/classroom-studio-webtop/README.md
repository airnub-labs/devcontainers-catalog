# Classroom Studio (Webtop) Template

Multi-container template featuring a headless development container plus a `linuxserver/webtop` sidecar for touch-friendly Chrome debugging. Template options let you:

> **Usage terms:** Review [docs/sidecars.md#linuxserver-webtop](../../docs/sidecars.md#linuxserver-webtop) before bundling Webtop in a classroom workspace.

- Pick whether the webtop mounts managed Chrome policies (`policyMode`).
- Override the policy file that gets mounted via `chromePolicies` (leave blank to follow the selected policy mode).
- Adjust the forwarded desktop port (`webtopPort`).

When launched, access the desktop at `http://localhost:<webtopPort>` (default `http://localhost:3000`) via the shared `services/webtop/docker-compose.webtop.yml` fragment. The override compose file mounts `.devcontainer/policies` into Chrome so managed presets stay in sync.

## Quick modes

| Mode | Commands | Notes |
| --- | --- | --- |
| **Fast (Prebuilt)** | 1. Target the `full` preset in your manifest (`spec.base_preset: full`).<br>2. `npx @airnub/devc generate <manifest> --out-images images/presets/generated --out-templates templates/generated` | Ships a prebuilt full-stack image so Codespaces/iPad sessions load Chrome policies instantly. |
| **Flexible (Feature)** | `devcontainer templates apply --template-id ghcr.io/airnub-labs/devcontainer-templates/classroom-studio-webtop:1.0.0 --workspace-folder .` | Materialise the template to tweak Chrome policies or sidecars before committing. |

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Apply the template locally per [Quick modes](#quick-modes) › Flexible (Feature) to experiment with policies. | Use the manifest-driven [Quick modes](#quick-modes) › Fast (Prebuilt) flow so Codespaces boots into the same desktop. | `spec.base_preset: full` publishes a cached workspace image; the Webtop sidecar still launches at runtime. | Pin preset tags and Chrome policy artifacts so Codespaces prebuilds remain deterministic. |
| Ports | `{{templateOption.webtopPort}}` defaults to 3000; open the browser at `http://localhost:<port>` as described above. | Codespaces labels the same port “Classroom Webtop” for easy discovery. | Port labelling is part of the template, so prebuilds inherit the mapping automatically. | Keep the port private unless the class needs shared desktop access outside the repo collaborators. |
| Sidecars | `linuxserver/webtop` sidecar provides the desktop; tune policies locally before sharing. | Identical compose fragment runs in Codespaces, mounting the same policy volume. | Sidecar image isn’t part of the prebuilt workspace, keeping image pushes small. | Watch Codespaces health notifications; Webtop only appears once the health check passes. |
| Minimum resources | Allocate 4 CPUs / 8 GB locally for responsive Chrome and VS Code. | Use a 4-core / 8 GB Codespace (or larger) for studio sessions. | Prebuilding reduces post-create installs, leaving resources free for Webtop. | Consider bumping screen resolution only after verifying Codespaces performance budgets. |

## Local ↔ Codespaces parity checklist

- **Ports** — `{{templateOption.webtopPort}}` is labelled “Classroom Webtop” ensuring Codespaces exposes the desktop with the right caption.
- **Health** — The webtop compose fragment includes health checks so the desktop only advertises ready once Chrome is available.
- **Secrets** — Use manifest `spec.secrets_placeholders` to surface Chrome policy secrets; `.env.example` will flow into the preset.
- **Resources** — Designed for 4-core / 8 GB Codespaces. For lighter machines reduce screen resolution in the `linuxserver/webtop` env.
- **Aggregate compose** — Webtop fragment sits on `devnet`, so adding Supabase, Redis, or Temporal via `devc add service` keeps network parity.
