# Stack — Next.js + Supabase + Kasm Chrome (KasmVNC)

This stack composes the existing `nextjs-supabase` template and adds a **full Chrome** via **Kasm Workspaces** (KasmVNC).

> **Usage terms:** Review [docs/sidecars.md#kasm-chrome](../../docs/sidecars.md#kasm-chrome) before shipping this stack to students.

- **Proxy/Codespaces-friendly**: default transport is **HTTPS + WebSocket**.
- **One-click classroom demo**: Kasm port is auto-labeled; demo page at `/classroom-browser`.

## Quick start
- Generate with `npx @airnub/devc generate … --with-browser kasm-chrome` or the equivalent manifest flag.
- Open the forwarded **6901** link documented below once the workspace boots locally or in Codespaces.
- Provide the VNC password via `VNC_PW`/`KASM_VNC_PW` before sharing access.

## Ports
- **6901** – Kasm Chrome UI (HTTPS + WebSocket)

## Security
Set a password via env (`VNC_PW`, override with `KASM_VNC_PW`) and keep ports **Private** by default.

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Follow [Quick start](#quick-start) locally: generate with the Kasm flag and open the 6901 desktop. | Same [Quick start](#quick-start) commands apply when launching a Codespace. | Pair with a manifest preset to prebuild the workspace image while the Kasm sidecar builds at runtime. | Store the Kasm password as a Codespaces secret and share the forwarded URL privately. |
| Ports | `6901` hosts the Kasm UI as noted in [Ports](#ports). | Codespaces forwards the same port with HTTPS proxying. | Port labelling lives in the template so prebuilds require no tweaks. | Leave the port private unless you intend to broadcast the classroom desktop. |
| Sidecars | Kasm Chrome runs alongside the workspace, delivering the managed browser experience locally. | Identical sidecar runs in Codespaces with TLS offload. | Sidecar image isn’t part of the prebuilt workspace, keeping image pushes small. | Watch Codespaces health notifications so you know when Kasm is ready before sharing. |
| Minimum resources | Aim for 4 CPUs / 8 GB locally when running Next.js, Supabase, and the Kasm desktop together. | Choose a 4-core / 8 GB Codespace (or larger) for the combined workload. | Prebuilt workspace prevents pnpm installs from competing with Kasm start-up. | Raise Codespaces plan size if simultaneous browser sessions and database migrations cause contention. |
