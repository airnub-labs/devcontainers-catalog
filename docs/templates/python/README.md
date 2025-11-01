# Python preset — GitHub Copilot opt-in

The catalog no longer bundles GitHub Copilot or Copilot Chat with the Python preset devcontainer.
Those extensions require a valid GitHub Copilot licence and cannot be redistributed by the catalog team.

## How to enable Copilot for this preset

Add `spec.enable_copilot: true` to your manifest when you want Copilot available in the generated image and scaffold:

```yaml
apiVersion: airnub.devcontainers/v1
kind: LessonEnv
metadata:
  org: example-org
spec:
  base_preset: python
  enable_copilot: true
```

The generator applies the flag across both `devc generate` and `devc scaffold`, layering Copilot extensions on top of any items
you list under `spec.vscode_extensions`.
Outside of the manifest flow, update `.devcontainer/devcontainer.json` manually and verify every user has an active Copilot
subscription before distributing the configuration.
