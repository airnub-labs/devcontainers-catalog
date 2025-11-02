# Stack — Next.js + Supabase + (Selectable Browser Sidecars)

This stack extends `nextjs-supabase` and lets you add one or many browser sidecars
**at generate time** using the catalog generator flags.

Supported browsers (current):
- `neko-chrome`   (WebRTC; TCP mux by default; optional UDP locally)
- `neko-firefox`  (WebRTC; TCP mux by default; optional UDP locally)
- `kasm-chrome`   (KasmVNC; HTTPS + WebSocket)

> **Usage terms:** Review [docs/sidecars.md](../../docs/sidecars.md) for licensing requirements tied to these desktop sidecars.

## Quick start
- Generate the stack with the browser flags listed in [How to select browsers](#how-to-select-browsers).
- Launch via Dev Containers or Codespaces and open the forwarded desktop ports documented in [Testing your app](#testing-your-app).
- Set any browser credentials (Neko/Kasm passwords) as environment variables before inviting students.

## How to select browsers
Use the generator:
- CSV: `--with-browsers neko-chrome,kasm-chrome`
- Or repeat: `--with-browser neko-firefox --with-browser neko-chrome`

## Testing your app
In the browser sidecar, open `http://devcontainer:3000`.
Ensure your dev server binds to `0.0.0.0`.

All forwarded ports default to **Private** in Codespaces.
Change default credentials via environment variables before sharing.

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Generate locally following [Quick start](#quick-start) and bring the stack up with the selected browsers. | Same [Quick start](#quick-start) flow applies in Codespaces via the generator outputs. | Pair with a manifest preset to prebuild the workspace image while browser sidecars remain runtime-only. | Store browser credentials in Codespaces secrets so desktop ports stay protected. |
| Ports | Access web apps at `http://devcontainer:3000` inside each sidecar as noted in [Testing your app](#testing-your-app). | Codespaces forwards the same desktop ports privately; expose only if demos require it. | Port attributes come from the template, so prebuilds inherit the mapping automatically. | Keep forwarded ports private unless the class needs shared desktop access. |
| Sidecars | Choose `neko-*` or `kasm-*` sidecars during generation; compose up locally for each selection. | Identical sidecars launch in Codespaces when generated with the same flags. | Sidecar images are fetched at runtime, keeping prebuilt workspace pushes lean. | Codespaces health notifications indicate when each browser desktop is ready before students connect. |
| Minimum resources | Allocate 4 CPUs / 8 GB locally when running multiple browsers simultaneously. | Request a 4-core / 8 GB Codespace (or larger) for multi-browser stacks. | Prebuilt workspace image ensures CLI installs don’t compete with browser boot. | Consider scaling to 8-core Codespaces for workshops needing three concurrent browsers. |
