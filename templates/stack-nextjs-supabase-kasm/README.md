# Stack — Next.js + Supabase + Kasm Chrome (KasmVNC)

This stack composes the existing `nextjs-supabase` template and adds a **full Chrome** via **Kasm Workspaces** (KasmVNC).

> **Usage terms:** Review [docs/sidecars.md#kasm-chrome](../../docs/sidecars.md#kasm-chrome) before shipping this stack to students.

- **Proxy/Codespaces-friendly**: default transport is **HTTPS + WebSocket**.
- **One-click classroom demo**: Kasm port is auto-labeled; demo page at `/classroom-browser`.

## Ports
- **6901** – Kasm Chrome UI (HTTPS + WebSocket)

## Security
Set a password via env (`VNC_PW`, override with `KASM_VNC_PW`) and keep ports **Private** by default.
