# Classroom — Neko (WebRTC) full Chrome

This template runs a **full graphical Chrome** in a sidecar using **Neko** and streams it to the browser via **WebRTC**.

> **Usage terms:** Review [docs/sidecars.md#neko-browser-sidecars](../../docs/sidecars.md#neko-browser-sidecars) before distributing Neko-powered classrooms.

- **Works in Codespaces (TCP-mux)** and locally (UDP recommended).
- Default is **TCP-only** for maximum compatibility (Codespaces’ port proxy is TCP/HTTPS).
- Add STUN/TURN to improve NAT traversal for home networks.

## Quick start

- Open in Codespaces or locally with Dev Containers.
- The forwarded port **8080** opens the Neko UI.
- Set `NEKO_USER_PASSWORD` and `NEKO_ADMIN_PASSWORD` via Codespaces secrets or `.devcontainer/devcontainer.json` before launch.

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Use Dev Containers locally and follow [Quick start](#quick-start) to open port 8080. | Codespaces users follow the same [Quick start](#quick-start) instructions once the workspace boots. | Pair with a manifest preset so the workspace image prebuilds while Neko’s sidecar starts at runtime. | Store Neko passwords as Codespaces secrets and share the forwarded link only with attendees. |
| Ports | `8080` (UI) plus TCP/UDP mux as documented in [Quick start](#quick-start). | Codespaces forwards `8080` and the TCP mux (`59000/tcp`); UDP remains local-only. | Port metadata is baked into the template so prebuilds require no extra config. | Leave UDP disabled in Codespaces and rely on TCP mux; add STUN/TURN only when the network allows. |
| Sidecars | Chrome Neko container runs alongside the workspace; optional UDP mux can be enabled locally. | Same sidecar runs with TCP mux defaults in Codespaces. | Sidecar image is fetched at runtime, keeping the prebuilt workspace lean. | Monitor Codespaces health notifications to know when the Neko sidecar is ready before sharing URLs. |
| Minimum resources | Allocate at least 4 CPUs / 8 GB locally for a smooth desktop stream. | Choose a 4-core / 8 GB Codespace (or larger) for collaborative sessions. | Prebuilding the workspace prevents post-create install spikes from delaying the browser sidecar. | Codespaces will pause idle sessions; reopen forwarded ports if the Neko UI times out. |

### Ports
- **8080** – Neko Web UI
- **59000/tcp** – WebRTC TCP mux (Codespaces-safe)
- **59000/udp** – (optional, local only) WebRTC UDP mux (skip in Codespaces)

## Security
- Provide passwords explicitly (no defaults shipped):
  - Host secrets `NEKO_USER_PASSWORD` and `NEKO_ADMIN_PASSWORD`
  - Container receives `NEKO_MEMBER_MULTIUSER_USER_PASSWORD` / `NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD`
- Default screen size targets **1280x800@30** for lower bandwidth. Override `NEKO_SCREEN` to increase fidelity.

## Notes
- For STUN/TURN, set `NEKO_WEBRTC_ICESERVERS_FRONTEND` to a JSON array.
- Example: `[{"urls":["stun:stun.l.google.com:19302"],"username":"turnuser","credential":"turnpass"}]` set via `.devcontainer/devcontainer.json` `containerEnv` or Codespaces secrets.
- In Codespaces, UDP is not available; TCP mux provides reliable fallback.
- Multi-user mode lets an instructor (admin password) and student (member password) share the same Chrome session collaboratively.
- Smoke test script: `scripts/smoke-neko.sh` probes the Web UI once the stack is up.
