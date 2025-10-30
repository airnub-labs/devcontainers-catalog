# Stack — Next.js + Supabase + Neko (WebRTC Chrome)

This stack composes the existing `nextjs-supabase` template and adds a **full graphical Chrome** via **Neko (WebRTC)** as a sidecar.

- **Codespaces-ready**: defaults to **TCP mux** for WebRTC (no UDP required).
- **Local-ready**: optionally enable a UDP port range for lower latency.
- **One-click classroom demo**: the Neko UI port is auto-labeled; a demo page is included in the Next.js app (`/classroom-browser`).

## Ports
- **8080** – Neko Web UI (opens on forward)
- **59000/tcp** – Neko WebRTC TCP mux (silent forward; required for Codespaces)
- (Optional local) **56000–56100/udp** – WebRTC UDP range (enable for better perf)

## Security
Change defaults via env:
- `NEKO_USER_PASSWORD` (user)
- `NEKO_ADMIN_PASSWORD` (admin)

Use **Private** visibility for forwarded ports by default in Codespaces.
