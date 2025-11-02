# Stack — Next.js + Supabase + (Selectable Browser Sidecars)

This stack extends `nextjs-supabase` and lets you add one or many browser sidecars
**at generate time** using the catalog generator flags.

Supported browsers (current):
- `neko-chrome`   (WebRTC; TCP mux by default; optional UDP locally)
- `neko-firefox`  (WebRTC; TCP mux by default; optional UDP locally)
- `kasm-chrome`   (KasmVNC; HTTPS + WebSocket)

> **Usage terms:** Review [docs/sidecars.md](../../docs/sidecars.md) for licensing requirements tied to these desktop sidecars.

## How to select browsers
Use the generator:
- CSV: `--with-browsers neko-chrome,kasm-chrome`
- Or repeat: `--with-browser neko-firefox --with-browser neko-chrome`

## Testing your app
In the browser sidecar, open `http://devcontainer:3000`.
Ensure your dev server binds to `0.0.0.0`.

All forwarded ports default to **Private** in Codespaces.
Change default credentials via environment variables before sharing.
