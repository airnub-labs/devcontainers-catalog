# Stack — Next.js + Supabase + Neko (WebRTC Chrome)

This stack composes the existing `nextjs-supabase` template and adds a **full graphical Chrome** via **Neko (WebRTC)** as a sidecar.

> **Usage terms:** Review [docs/sidecars.md#neko-browser-sidecars](../../docs/sidecars.md#neko-browser-sidecars) before sharing this stack broadly.

- **Codespaces-ready**: defaults to **TCP mux** for WebRTC (no UDP required).
- **Local-ready**: optionally enable a UDP port range for lower latency.
- **One-click classroom demo**: the Neko UI port is auto-labeled; a demo page is included in the Next.js app (`/classroom-browser`).

## Ports
- **8080** – Neko Web UI (opens on forward)
- **59000/tcp** – Neko WebRTC TCP mux (silent forward; required for Codespaces)
- (Optional local) **59000/udp** – WebRTC UDP mux (enable locally; skip in Codespaces)

## Security
Provide secrets via env (no defaults shipped):
- `NEKO_USER_PASSWORD` (user)
- `NEKO_ADMIN_PASSWORD` (admin)

Use **Private** visibility for forwarded ports by default in Codespaces.
