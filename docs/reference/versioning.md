# Versioning Strategy

- **Features** follow semantic versioning. Update each `devcontainer-feature.json` and publish via `publish-features.yml`, which produces tags like `ghcr.io/airnub-labs/devcontainer-features/<id>:1.2.3` plus a matching major tag (`:1`).
- **Templates & stacks** mirror their folder `version` fields. CI publishes them as `ghcr.io/airnub-labs/devcontainer-templates/<id>:<semver>`.
- **Images** publish to `ghcr.io/airnub-labs/devcontainer-images/<name>` with `:<semver>`, `:<major>`, and `:latest` tags per release. Multi-arch manifests (amd64 + arm64) are produced via `build-images.yml`.
- Prefer digest pins (`@sha256:<digest>`) for production workspaces once a release is available, while keeping the `:major` tag for quick-start documentation.
- Document released versions and digests here:

| Artifact | Latest Tag | Notes |
| --- | --- | --- |
| `features/supabase-cli` | `1.0.0` | Installs Supabase CLI + helpers |
| `features/chrome-cdp` | `1.0.0` | Headless Chrome via supervisord |
| `features/agent-tooling-clis` | `1.1.0` | Codex/Claude/Gemini pnpm installers |
| `features/docker-in-docker-plus` | `1.0.0` | Buildx and BuildKit defaults |
| `features/cuda-lite` | `1.0.0` | Conditional CUDA runtime |
| `ghcr.io/airnub-labs/devcontainer-images/dev-base` | `1.0.0` | Node 24 + pnpm base |
| `ghcr.io/airnub-labs/devcontainer-images/dev-web` | `1.0.0` | Browser-ready extension (published digest pending) |

Update this table as new versions are pushed.

> **Maintainer note:** Publish digests for `devcontainer-images/dev-web` as soon as they are available, update template README matrices with the pinned digest, and keep the `:1` tag documented for convenience.
