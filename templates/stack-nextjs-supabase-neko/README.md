# Stack — Next.js + Supabase + Neko (WebRTC Chrome)

This stack composes the existing `nextjs-supabase` template and adds a **full graphical Chrome** via **Neko (WebRTC)** as a sidecar.

> **Usage terms:** Review [docs/sidecars.md#neko-browser-sidecars](../../docs/sidecars.md#neko-browser-sidecars) before sharing this stack broadly.

- **Codespaces-ready**: defaults to **TCP mux** for WebRTC (no UDP required).
- **Local-ready**: optionally enable a UDP port range for lower latency.
- **One-click classroom demo**: the Neko UI port is auto-labeled; a demo page is included in the Next.js app (`/classroom-browser`).

## Quick start
- Generate with `npx @airnub/devc generate … --with-browser neko-chrome` (or the manifest equivalent) alongside the Next.js stack.
- Launch locally or in Codespaces, then open the forwarded **8080** UI referenced below.
- Set `NEKO_USER_PASSWORD` and `NEKO_ADMIN_PASSWORD` before inviting participants.

## Ports
- **8080** – Neko Web UI (opens on forward)
- **59000/tcp** – Neko WebRTC TCP mux (silent forward; required for Codespaces)
- (Optional local) **59000/udp** – WebRTC UDP mux (enable locally; skip in Codespaces)

## Security
Provide secrets via env (no defaults shipped):
- `NEKO_USER_PASSWORD` (user)
- `NEKO_ADMIN_PASSWORD` (admin)

Use **Private** visibility for forwarded ports by default in Codespaces.

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Follow [Quick start](#quick-start) to generate with the Neko flag and open the 8080 UI locally. | Same [Quick start](#quick-start) flow applies when launching Codespaces. | Pair with a manifest preset so the workspace image prebuilds while the Neko sidecar starts at runtime. | Store Neko passwords in Codespaces secrets before sharing the forwarded link. |
| Ports | `8080` plus TCP/optional UDP mux as detailed in [Ports](#ports). | Codespaces forwards `8080` and the TCP mux; UDP remains local-only. | Port metadata is already part of the template, so prebuilds require no changes. | Keep both ports private in Codespaces to avoid exposing the classroom desktop. |
| Sidecars | Neko Chrome runs alongside Next.js + Supabase, with optional UDP for local acceleration. | Same sidecar launches with TCP mux defaults in Codespaces. | Sidecar image pulls at runtime, leaving the prebuilt workspace lean. | Wait for Codespaces health notifications confirming Neko readiness before demos. |
| Minimum resources | Plan for 4 CPUs / 8 GB locally to balance Next.js, Supabase, and the Neko desktop. | Choose a 4-core / 8 GB Codespace (or larger) for the combined workload. | Cached preset avoids pnpm installs from delaying Neko start-up. | Upgrade the Codespaces machine type if simultaneous database migrations and WebRTC sessions contend for CPU. |
