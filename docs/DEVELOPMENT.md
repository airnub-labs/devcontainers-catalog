# Development environment

Maintainers occasionally need to pull pre-release catalog assets from `ghcr.io` while testing changes. Catalog consumers do not need to authenticate—published features, templates, and images stay public once released. The notes below only apply to development workflows for this repository.

## Host-side GHCR authentication before container start

Dev Containers will attempt to pull images before the development container starts. To avoid authentication failures, add the following `initializeCommand` to your development container definition (for example, to `.devcontainer/devcontainer.json` in your local checkout):

```json
{
  "initializeCommand": "/bin/sh -lc 'if [ -n \"${GHCR_PAT}\" ]; then echo \"$GHCR_PAT\" | docker login ghcr.io -u ${GHCR_USER:-$USER} --password-stdin || true; fi'"
}
```

The command runs on the host before `devcontainer up`, logging in to GHCR when the required environment variables are present:

- `GHCR_USER` — GitHub username for the account with access to the packages (defaults to `$USER` if unset).
- `GHCR_PAT` — GitHub personal access token with the **`read:packages`** scope. If the organisation enforces SSO, make sure SSO is enabled for the token.

### Local development (VS Code Desktop)

1. Create a PAT with `read:packages` and enable SSO for the `airnub-labs` organisation if prompted.
2. Export credentials in your shell before reopening the folder in a Dev Container:

   ```bash
   export GHCR_USER="your-gh-username"
   export GHCR_PAT="ghp_...yourtoken..."
   ```

3. Launch **Dev Containers: Reopen in Container**. The `initializeCommand` logs in and future image pulls succeed.

To persist credentials via Docker's credential helper, run:

```bash
echo "$GHCR_PAT" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
```

### GitHub Codespaces

1. Add **repository** or **organisation** secrets named `GHCR_USER` and `GHCR_PAT` (with `read:packages` scope and SSO enabled if required).
2. Codespaces provides the secrets as environment variables on the host. `initializeCommand` handles the login before images are pulled.

With these variables in place, development containers can fetch private or pre-release images. When working only with published catalog assets, no GHCR authentication is necessary.
