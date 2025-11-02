# Classroom — Neko Firefox (WebRTC)

Full Firefox browser delivered via [Neko](https://github.com/m1k1o/neko) with TCP mux defaults for Codespaces-friendly WebRTC.

> **Usage terms:** Review [docs/sidecars.md#neko-browser-sidecars](../../docs/sidecars.md#neko-browser-sidecars) before distributing Neko Firefox to students.

## Quick start
- Follow the generator flow you prefer, then open the forwarded URLs described below once the workspace is running.
- Supply secrets via `NEKO_FF_USER_PASSWORD` / `NEKO_FF_ADMIN_PASSWORD` before launch.
- Keep ports private unless you intend to broadcast the desktop broadly.

- **Web UI** on port **8081** (auto-opened when forwarded)
- **TCP mux** on port **59010** (silent forward; required for Codespaces)
- Optional UDP mux for local acceleration (commented)
- Remote debugging via Firefox CDP is **experimental**; pass `--include-experimental` to expose this sidecar in the CLI/SDK.

## Parity matrix

| Aspect | Local Docker | Codespaces | Prebuild availability | Codespaces-only considerations |
| --- | --- | --- | --- | --- |
| Startup path | Launch locally and follow [Quick start](#quick-start) to inject credentials and open port 8081. | Same [Quick start](#quick-start) flow applies in Codespaces via the forwarded URLs. | Pair with a manifest preset so the workspace image prebuilds while the Neko sidecar remains runtime-only. | Store Neko credentials in Codespaces secrets and distribute port links selectively. |
| Ports | `8081` (UI) and `59010` (TCP mux) forward exactly as documented in [Quick start](#quick-start). | Identical mapping; Codespaces silently forwards 59010 to keep WebRTC stable. | Port metadata is shipped with the template, so prebuilds honour the same forwards. | Leave both ports private in Codespaces unless a hosted classroom requires wider access. |
| Sidecars | Firefox Neko container starts alongside the workspace; adjust screen size with `NEKO_SCREEN`. | Same compose fragment runs in Codespaces with TCP mux defaults. | Sidecar image pulls at runtime keeping the prebuilt workspace light. | Monitor Codespaces health notifications to ensure the sidecar is ready before sharing the link. |
| Minimum resources | 4 CPUs / 8 GB recommended locally for smooth browser streaming. | Request at least a 4-core / 8 GB Codespace for consistent WebRTC performance. | Prebuilt workspace prevents post-create installs from competing with WebRTC startup. | Codespaces auto-suspends idle ports; reconnect if the session sleeps during longer breaks. |

## Credentials
Provide credentials explicitly via environment variables (no defaults shipped):
- `NEKO_FF_USER_PASSWORD`
- `NEKO_FF_ADMIN_PASSWORD`
- Container receives `NEKO_MEMBER_MULTIUSER_USER_PASSWORD` / `NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD`.

The template defaults to `NEKO_SCREEN=1280x800@30` for reduced bandwidth; override to bump resolution when needed.

Keep forwarded ports **Private** in Codespaces by default.
