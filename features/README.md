# Features Directory

This directory is part of the Devcontainers Catalog repository and contains Dev Container Features published under the AirNub namespace.

## Test Strategy

Each feature includes a Dockerfile-driven smoke test under `test/smoke/` that exercises the feature installer twice inside the same image build to guarantee idempotency. The smoke tests finish by invoking the feature's primary binary (or equivalent verification) to ensure the tool is available on the `PATH`.

Run tests locally with the Dev Containers CLI:

```bash
npx --yes @devcontainers/cli@latest features test --project-folder features/<feature-name>
```

CI calls the same command for every feature path on pull requests, so new features should follow the same `test/smoke` structure.
