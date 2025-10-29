# dev-base Image

A thin wrapper around `mcr.microsoft.com/devcontainers/base` published as `ghcr.io/airnub-labs/devcontainer-images/dev-base`.

- Tracks Ubuntu 24.04 by default but exposes `UBUNTU_VERSION` / `BASE_IMAGE` build args for quick upgrades or swaps.
- Installs only a handful of cross-stack CLI tools (`curl`, `git`, `less`, `iproute2`, `procps`, `gnupg`).
- Leaves Node.js, pnpm, Python, and other runtime tooling to Dev Container Features or downstream images/templates.

Pull from GHCR:

```
docker pull ghcr.io/airnub-labs/devcontainer-images/dev-base:latest
```
