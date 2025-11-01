# Full preset — GitHub Copilot opt-in

This preset combines the Node + pnpm and Python tooling stacks, but it now ships without the GitHub Copilot family of extensions.
Copilot and Copilot Chat are licensed add-ons that each participant must activate individually; the catalog cannot redistribute
them by default.

## How to enable Copilot for this preset

Opt in by toggling `spec.enable_copilot` in your manifest before running `devc`:

```yaml
apiVersion: airnub.devcontainers/v1
kind: LessonEnv
metadata:
  org: example-org
spec:
  base_preset: full
  enable_copilot: true
```

Setting the flag to `true` makes both `devc generate` (preset image context) and `devc scaffold` (workspace) add `github.copilot`
and `github.copilot-chat` on top of any extensions you request.
If you maintain `.devcontainer` folders manually, append those extension identifiers yourself only after confirming that every
user has a valid Copilot subscription.
