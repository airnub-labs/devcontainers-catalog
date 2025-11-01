# Node + pnpm preset — GitHub Copilot opt-in

The catalog no longer ships GitHub Copilot or Copilot Chat inside the preset devcontainer definition.
Those extensions require a valid GitHub Copilot licence and cannot be redistributed on behalf of students or instructors.

## How to enable Copilot for this preset

Set `spec.enable_copilot: true` inside your workspace or lesson manifest before running the generator:

```yaml
apiVersion: airnub.devcontainers/v1
kind: LessonEnv
metadata:
  org: example-org
spec:
  base_preset: node-pnpm
  enable_copilot: true
```

Both `devc generate` (image context) and `devc scaffold` (workspace) honour this flag. When it is `true`, the generator adds
`github.copilot` and `github.copilot-chat` alongside any extensions you list under `spec.vscode_extensions`.

If your workflow does not use the manifest generator, add the extensions manually in `.devcontainer/devcontainer.json` after
confirming that every participant has an active Copilot subscription.
