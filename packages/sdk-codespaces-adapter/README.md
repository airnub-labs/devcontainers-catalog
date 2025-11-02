# @airnub/sdk-codespaces-adapter

Thin, typed SDK for provisioning and managing GitHub Codespaces instances used by Comhrá lesson scaffolds. The adapter wraps the GitHub REST API with deterministic helpers designed for classroom automation.

## 📖 API Documentation

Full API documentation is available at:
👉 [https://airnub-labs.github.io/devcontainers-catalog/api/sdk-codespaces-adapter/](https://airnub-labs.github.io/devcontainers-catalog/api/sdk-codespaces-adapter/)

## Features

- Stateless helpers for creating, starting, stopping, and deleting Codespaces.
- Dry-run planning that validates repository access, devcontainer availability, and machine sizing before materializing workspaces.
- Port normalization with classroom-safe defaults (private visibility) and warning notes for potentially unsafe requests.
- Secret management utilities that encrypt plaintext values using GitHub's libsodium keys.
- Support for both Personal Access Tokens and GitHub App installations, including enterprise deployments.

## Installation

```bash
npm install @airnub/sdk-codespaces-adapter
```

## Quick Start (PAT)

```ts
import { makeCodespacesAdapter } from "@airnub/sdk-codespaces-adapter";

const adapter = makeCodespacesAdapter({ baseUrl: process.env.GITHUB_API_URL });
await adapter.ensureAuth({ kind: "pat", token: process.env.GITHUB_TOKEN! });

const plan = await adapter.planCreate({
  repo: { owner: "school", repo: "lesson-template", ref: "refs/heads/main" },
  devcontainerPath: ".devcontainer/devcontainer.json",
  displayName: "comhra-lesson-123-student-456",
  machine: "standardLinux32",
  ports: [{ port: 8080, visibility: "private", label: "App" }],
  schoolMode: true
});

if (plan.actions.length === 0) {
  throw new Error(`Plan contains blocking notes: ${plan.notes.map((n) => n.message).join(", ")}`);
}

const codespace = await adapter.create(plan.actions[0].req);
console.log(`Codespace ready at ${codespace.webUrl}`);
```

## GitHub App Auth

```ts
await adapter.ensureAuth(
  {
    kind: "github-app",
    appId: Number(process.env.GITHUB_APP_ID),
    installationId: Number(process.env.GITHUB_APP_INSTALLATION_ID),
    privateKeyPem: process.env.GITHUB_APP_PRIVATE_KEY!
  },
  { baseUrl: process.env.GITHUB_API_URL }
);
```

Tokens are cached per `baseUrl`, so GitHub Enterprise deployments can safely mix with `github.com`.

## School Mode Defaults

- `schoolMode` defaults to `true` when omitted. Plans flag non-private ports as **errors** and omit destructive actions until corrected.
- Large machine types (e.g., `xlarge`, `premium`, `pro`) surface warning notes to highlight the added quota cost before execution.
- All port labels are synchronized through the GitHub CLI (`gh codespace ports update`) to mirror Codespaces UI expectations.

## Secrets & Environment Variables

`setSecrets(scope, entries, ctx)` encrypts plaintext at call time using GitHub's libsodium keys. Use `planCreate()` to see which secrets will be written before pushing them to the API.

Environment variables supplied in `CreateCodespaceRequest.environmentVariables` are passed straight through to the Codespaces create API.

## CLI Integration (Comhrá)

The `airnub-devc` CLI wraps the adapter for lesson orchestration:

```bash
# List every codespace scoped to an owner/repo
airnub-devc codespaces list --repo airnub-labs/devcontainers-catalog

# Create a student workspace with ports enforced as private
airnub-devc codespaces create \
  --repo airnub-labs/devcontainers-catalog \
  --display-name demo-lesson \
  --ports 8080:private:App \
  --school-mode

# Update port visibility after provisioning via gh CLI
airnub-devc codespaces ports demo-lesson --ports 8080:private:App
```

For complete API details, see [`src/types.ts`](./src/types.ts).

## Testing

Run unit tests with:

```bash
npm test
```

Tests rely on [`nock`](https://github.com/nock/nock) to stub GitHub APIs and exercise planner, port normalization, and lifecycle flows.
