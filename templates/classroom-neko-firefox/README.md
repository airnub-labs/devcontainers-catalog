# Classroom — Neko Firefox (WebRTC)

Full Firefox browser delivered via [Neko](https://github.com/m1k1o/neko) with TCP mux defaults for Codespaces-friendly WebRTC.

> **Usage terms:** Review [docs/sidecars.md#neko-browser-sidecars](../../docs/sidecars.md#neko-browser-sidecars) before distributing Neko Firefox to students.

- **Web UI** on port **8081** (auto-opened when forwarded)
- **TCP mux** on port **59010** (silent forward; required for Codespaces)
- Optional UDP mux for local acceleration (commented)
- Remote debugging via Firefox CDP is **experimental**; pass `--include-experimental` to expose this sidecar in the CLI/SDK.

## Credentials
Provide credentials explicitly via environment variables (no defaults shipped):
- `NEKO_FF_USER_PASSWORD`
- `NEKO_FF_ADMIN_PASSWORD`
- Container receives `NEKO_MEMBER_MULTIUSER_USER_PASSWORD` / `NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD`.

The template defaults to `NEKO_SCREEN=1280x800@30` for reduced bandwidth; override to bump resolution when needed.

Keep forwarded ports **Private** in Codespaces by default.
