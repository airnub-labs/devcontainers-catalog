# Build a Classroom Workspace in 60 Seconds

The `@airnub/devc` CLI materializes catalog assets into a ready-to-run repository. It validates manifests, copies compose fragments locally, and keeps the generated files easy to update.

## Install

You can run the CLI without installing globally:

```bash
npx @airnub/devc@latest --help
```

## Mode A — Preset Image

Use a preset when you want the fastest cold-start experience. The manifest declares the preset image and any services to bundle.

```bash
npx @airnub/devc generate workspace \
  -m examples/workspaces/quick-supabase.yaml \
  -o ../classroom-supabase \
  --catalog-ref main
```

Generated files:

* `.devcontainer/devcontainer.json` references the prebuilt preset image.
* `.devcontainer/compose.yaml` configures the main dev container and labels it with the catalog ref.
* `.devcontainer/services/<name>/` contains a copy of each service fragment.
* `.devcontainer/.env.example` merges the manifest env plus service placeholders.
* `aggregate.compose.yml` chains the fragments using `extends`.
* `README.md` reminds instructors how to keep generated regions intact.

## Mode B — Features

Switch to `mode: features` when you need to start from the base image and opt into catalog features (Node, Python, etc.). The CLI writes the `features` block into `devcontainer.json` and keeps the compose structure identical.

Example manifest: `examples/workspaces/quick-features.yaml`.

## Updating a Workspace

Regenerate managed files while preserving instructor edits by re-running the CLI with `update workspace`:

```bash
npx @airnub/devc update workspace -m workspace.yaml -o . --catalog-ref <new-sha>
```

Managed files keep a header and `BEGIN/END` block so any notes outside the block remain.

## Local = Remote Parity

Everything copied into the workspace matches the catalog at the pinned ref, so local Docker Desktop and Codespaces boot the same stack. Compose fragments use service names, not host-only addresses, and `.env.example` keeps secrets as placeholders.

## Low-Power Friendly

Default flows rely on prebuilt preset images so students on Chromebooks or iPads avoid lengthy installs. When features are required, document the extra install time in course materials.
