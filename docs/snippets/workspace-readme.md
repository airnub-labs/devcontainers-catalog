# Welcome to Your AirNub Workspace

This repository was generated with `@airnub/devc` and includes a ready-to-launch `.devcontainer` folder plus any classroom services you selected.

## Getting Started

1. Copy `.devcontainer/.env.example` to `.devcontainer/.env` and supply values for any placeholders.
2. Open the folder in VS Code and run **Dev Containers: Reopen in Container** (or open in GitHub Codespaces).
3. The dev container will boot using the pinned catalog reference documented at the top of the managed files.

## Services & Compose

* Compose fragments for each service live in `.devcontainer/services/<name>/`.
* `aggregate.compose.yml` stitches the fragments together via `extends` so you can run everything locally with Docker Compose if desired.

## Staying Up to Date

Run the update command whenever you want to sync with a newer catalog ref while preserving your own edits:

```bash
npx @airnub/devc update workspace -m workspace.yaml -o . --catalog-ref <sha>
```

Keep instructor content outside of the managed blocks to avoid merge conflicts.
