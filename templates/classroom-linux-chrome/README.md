# Classroom — Linux Chrome (Headful)

Dedicated headful Chrome container for classrooms that require a managed browser without the full desktop experience of Webtop.

## Services

- `devcontainer` — Catalog base workspace image.
- `linux-chrome` — Placeholder for a maintained headful Chrome container. See TODO notes in the service fragment for the vetted image once finalized.

## Usage

This template wires the future headful Chrome service into the Dev Container spec. Until the image is finalized, treat the fragment as experimental and keep it out of CI. Instructors can still copy the `.template/.devcontainer/` folder to ensure repo wiring is ready.

## Quick modes

| Mode | Commands | Notes |
| --- | --- | --- |
| **Fast (Prebuilt)** | 1. Use `spec.base_preset: full` in your manifest.<br>2. `npx @airnub/devc generate <manifest> --out-images images/presets/generated --out-templates templates/generated` | Keeps the managed Chrome policies and CLI tooling ready on Codespaces once the headful image is published. |
| **Flexible (Feature)** | `devcontainer templates apply --template-id ghcr.io/airnub-labs/devcontainer-templates/classroom-linux-chrome:1.0.0 --workspace-folder .` | Apply locally if you want to iterate on the Chrome image or Compose wiring. |

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Apply the template or `devcontainer up` locally per [Quick modes](#quick-modes) › Flexible (Feature). | Use the manifest-driven flow in [Quick modes](#quick-modes) › Fast (Prebuilt) so Codespaces boots with the same wiring. | `spec.base_preset: full` primes the workspace image while the headful Chrome fragment continues to build at runtime. | Ensure the forthcoming Chrome image tag is pinned so Codespaces rebuilds pick up the vetted release. |
| Ports | Placeholder `{{templateOption.webtopPort}}` is forwarded to present the Chrome desktop. | Codespaces labels the same port automatically when generated. | Port metadata travels with the template; prebuilds need no extra work. | Keep the port private until the headful image finalises its TLS guidance. |
| Sidecars | Headful Chrome service runs through compose; tweak locally while image work continues. | Identical compose fragment launches in Codespaces once the image is published. | Prebuilt workspace image excludes the sidecar, so image caches remain light. | Codespaces health checks will signal when the headful Chrome endpoint is reachable. |
| Minimum resources | Expect to allocate 4 CPUs / 8 GB locally for stable Chrome sessions. | Plan for at least a 4-core / 8 GB Codespace. | Prebuilding reduces first-run installs, making larger machine requests more predictable. | Increase `spec.resources` only once the Chrome image sizing is validated across Codespaces plans. |

## Local ↔ Codespaces parity checklist

- **Ports** — `{{templateOption.webtopPort}}` fallback ensures Chrome’s VNC endpoint is labelled when surfaced through Codespaces.
- **Health** — Service fragment will ship health checks with the final image; the template keeps the wiring ready for parity tests.
- **Secrets** — Add manifest placeholders for managed Chrome secrets; generated presets will output `.env.example`.
- **Resources** — Expect to need 4-core / 8 GB machines; tweak Compose resource limits before enabling for Chromebooks.
- **Aggregate compose** — Additional services sit on `devnet`, letting the headful Chrome instance talk to Supabase/Temporal locally and in Codespaces.
