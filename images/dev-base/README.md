# dev-base Image

Minimal Ubuntu base published as `ghcr.io/airnub-labs/devcontainer-images/dev-base`. It mirrors the upstream
`mcr.microsoft.com/devcontainers/base:ubuntu-24.04` image and leaves language runtimes to Dev Container features or
higher-level images.

Pull from GHCR:

```
docker pull ghcr.io/airnub-labs/devcontainer-images/dev-base:latest
```

## Build-time customization

- `BASE_REGISTRY` — defaults to `mcr.microsoft.com/devcontainers/base`.
- `BASE_VARIANT` — defaults to `ubuntu-24.04`.

Override these build args to track a different Ubuntu version or swap to another compatible base image while keeping the
Dockerfile unchanged.
