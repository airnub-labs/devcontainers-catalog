# @airnub/sdk-codespaces-adapter

Thin, typed SDK for provisioning and managing GitHub Codespaces instances used by Comhrá lesson scaffolds. The adapter wraps the GitHub REST API with deterministic helpers designed for classroom automation.

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

## Quick Start

```ts
import { makeCodespacesAdapter } from "@airnub/sdk-codespaces-adapter";

const adapter = makeCodespacesAdapter({ baseUrl: process.env.GITHUB_API_URL });
await adapter.ensureAuth({ kind: "pat", token: process.env.GITHUB_TOKEN! });

const plan = await adapter.planCreate({
  repo: { owner: "school", repo: "lesson-template" },
  devcontainerPath: ".devcontainer/devcontainer.json",
  displayName: "comhra-lesson-123-student-456",
  machine: "standardLinux32",
  ports: [{ port: 8080, visibility: "private", label: "App" }]
});

console.log(plan.notes);
```

For complete API details, see [`src/types.ts`](./src/types.ts).

## Testing

Run unit tests with:

```bash
npm test
```

Tests rely on [`nock`](https://github.com/nock/nock) to stub GitHub APIs and exercise planner, port normalization, and lifecycle flows.
