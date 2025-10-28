# Docker-in-Docker Plus Feature

Adds quality-of-life tooling for Docker-in-Docker environments: installs the Buildx CLI plugin (if missing), enables BuildKit by default, and configures a larger shared memory segment for Compose workloads.

## Usage

```jsonc
"features": {
  "ghcr.io/airnub-labs/devcontainer-features/docker-in-docker-plus:1": {}
}
```

This feature is meant to be layered on top of `ghcr.io/devcontainers/features/docker-in-docker`.
