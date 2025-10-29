# dev-base Image

Ubuntu base image published as `ghcr.io/airnub-labs/devcontainer-images/dev-base` that stays close to the upstream `mcr.microsoft.com/devcontainers/base` image. No language runtimes or package managers are preinstalled so tooling can be layered through catalog features. Build arguments expose the base repository and variant to make upgrading beyond `ubuntu-24.04` straightforward.

Pull from GHCR:

```
docker pull ghcr.io/airnub-labs/devcontainer-images/dev-base:latest
```
