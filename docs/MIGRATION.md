# Migration Guide

Follow these steps when moving an existing project or workspace into the catalog-only layout.

1. **Replace ad-hoc installers with catalog features.** Supabase, Chrome CDP, CUDA, agent tooling CLIs, and Docker ergonomics live under `features/*`. Compose them via `devcontainer.json` or templates instead of bespoke shell scripts.
2. **Adopt catalog templates.** Rather than copying `.devcontainer` folders between repos, materialize templates with `devcontainer templates apply --template-folder templates/<id>`. Options cover Chrome channels, CDP ports, Supabase project metadata, and Next.js scaffolding toggles.
3. **Consume published images.** Prefer the prebuilt `ghcr.io/airnub-labs/dev-base` and `ghcr.io/airnub-labs/dev-web` images for faster startup. Fall back to local builds when you need custom Dockerfile tweaks.
4. **Wire optional scaffolding per project.** Templates expose feature flags (for example, `includeAgentToolingClis` or `scaffold`). Use them instead of editing shared Dockerfiles so downstream workspaces stay aligned.
5. **Keep documentation in sync.** Update `docs/CATALOG.md` and `VERSIONING.md` whenever you add new assets or publish new tags so consumers know which coordinates to pull.
6. **Rely on CI for publishing.** The GitHub Actions workflows in `.github/workflows/` publish features to GHCR, build multi-arch images, and smoke-test templates. Trigger them by pushing to `main` or via workflow dispatch.
