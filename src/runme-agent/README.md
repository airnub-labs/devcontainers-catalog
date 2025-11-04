# README Auto-Setup (Runme Agent)

The **Runme Agent** Feature installs the [Runme CLI](https://runme.dev/) and a helper command, `airnub-autosetup`, that safely automates project setup directly from named Markdown cells in your repository README.

- ✅ **Safe-by-default:** generates a plan, prompts for confirmation, and exits without changes if you decline.
- ✅ **Dry-run friendly:** set `AIRNUB_CONFIRM=0` (default) to inspect the plan without running it.
- ✅ **Agent-aware:** optionally hand off failing steps to [OpenHands](https://github.com/AllHandsAI/OpenHands) if it is already available in the container.

> ⚠️ Only enable this Feature in **trusted repositories** whose README commands you have reviewed.

## How it works

1. Annotate shell blocks in your README with Runme names:

   ```markdown
   ## Setup
   ```sh { name=setup }
   npm install
   ```

   ```markdown
   ## Developer server
   ```sh { name=dev }
   npm run dev
   ```

2. Inside the Dev Container, run `airnub-autosetup` to preview the plan and execute the named Runme cells in order.
3. Blocks run sequentially; failures abort the process and surface exit codes.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `auto_run` | boolean | `false` | If `true`, prints guidance for wiring the helper into `postCreateCommand` so it runs after container create. |
| `readme_file` | string | `README.md` | Markdown file to scan for Runme cells. |
| `blocks` | string | `setup,dev` | Comma-separated Runme block names to execute in order. |
| `confirm_plan` | boolean | `true` | Show the plan and require confirmation unless `AIRNUB_CONFIRM=1`. |
| `agent` | enum(`none`,`openhands`) | `none` | Provide a stub for delegating failed blocks to an installed OpenHands CLI. |

## Helper command

The installer drops `/usr/local/bin/airnub-autosetup`. Run it manually or from lifecycle hooks:

```bash
# Preview + prompt (default)
airnub-autosetup

# Non-interactive execution (e.g., CI)
AIRNUB_CONFIRM=1 airnub-autosetup --blocks "setup,seed"

# Opt into OpenHands delegation on failures (requires OpenHands CLI in PATH)
airnub-autosetup --agent openhands
```

If `confirm_plan` is `true`, the helper exits unless you confirm or set `AIRNUB_CONFIRM=1`.

## Lifecycle guidance

For most projects, keep `auto_run` false and run the helper manually the first time to inspect the plan. To run automatically after the container is created, add a `postCreateCommand` in your repo:

```jsonc
{
  "postCreateCommand": "airnub-autosetup"
}
```

This keeps automation opt-in and transparent for collaborators in VS Code Dev Containers or GitHub Codespaces. The helper script exits non-zero on failure, so lifecycle hooks surface issues immediately.

## Feature usage

```jsonc
// .devcontainer/devcontainer.json
{
  "name": "demo",
  "features": {
    "ghcr.io/airnub-labs/devcontainers-catalog/runme-agent:1": {
      "auto_run": false,
      "readme_file": "README.md",
      "blocks": "setup,dev",
      "confirm_plan": true,
      "agent": "none"
    }
  },
  "postCreateCommand": "airnub-autosetup"
}
```

After rebuilding the Dev Container, run `airnub-autosetup` to inspect the plan and execute your README cells.
