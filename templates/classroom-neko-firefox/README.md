# Classroom — Neko Firefox (WebRTC)

Full Firefox browser delivered via [Neko](https://github.com/m1k1o/neko) with TCP mux defaults for Codespaces-friendly WebRTC.

- **Web UI** on port **8081** (auto-opened when forwarded)
- **TCP mux** on port **59010** (silent forward; required for Codespaces)
- Optional UDP range for local acceleration (commented)

## Credentials
Override via environment variables:
- `NEKO_FF_USER_PASSWORD`
- `NEKO_FF_ADMIN_PASSWORD`

Keep forwarded ports **Private** in Codespaces by default.
