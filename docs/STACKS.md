# Stacks (Template Flavors)

- `stack-nextjs-supabase-webtop`
- `stack-nextjs-supabase-novnc`
- `stack-web-node-supabase-webtop`

## Options to standardize
- `guiProvider`: `webtop` | `novnc`
- `chromeCdpPort`: default 9222
- `supabaseLocal`: `true|false` (CLI-managed)
- `redis`: `true|false` (default true)

Ensure each stack template folder has:

- `devcontainer-template.json` with options above
- `.template/.devcontainer/` payload (compose, devcontainer.json, hooks)
- `README.md` explaining ports, services, features, and how to materialize
- Optional `stack.lock.json` with pinned versions

### Browser-capable classroom stacks
- Pair **classroom-neko-webrtc** or **classroom-kasm-chrome** with any existing app template (e.g., Next.js + Supabase).
- Use Compose `depends_on` if your app needs the browser ready before smoke tests.

### Browser-enabled classroom stacks

- **stack-nextjs-supabase-neko** — Next.js + Supabase + Neko (WebRTC Chrome)
  - Codespaces: TCP mux by default; optional UDP locally for low latency.

- **stack-nextjs-supabase-kasm** — Next.js + Supabase + Kasm Chrome (KasmVNC)
  - Proxy-friendly HTTPS + WebSocket transport by default.
