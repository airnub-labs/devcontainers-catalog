> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-02
> **Reason:** Superseded by SPEC-ALIGNMENT.md (already marked as legacy)
> **See Instead:** [SPEC-ALIGNMENT.md](../../SPEC-ALIGNMENT.md)
>
> This document was a legacy note explaining the transition from mixed workspace/catalog
> repo to catalog-only layout. It was already marked as legacy and has been superseded
> by SPEC-ALIGNMENT.md.

---

# Dev Container packaging roadmap (Legacy)

> **Note:** Active guidance now lives in [`SPEC-ALIGNMENT.md`](./SPEC-ALIGNMENT.md). This legacy note is retained only to explain the transition from a mixed workspace/catalog repo to the catalog-only layout introduced in 2024.

## Historical context

Earlier iterations of this repository bundled a Codespaces workspace (`.devcontainer/` + `workspaces/*`) alongside reusable features and templates. That model made it difficult to publish OCI artifacts cleanly, so the catalog was split from the workspace automation.

The current structure keeps only:

- `features/*` – OCI-compliant, idempotent installers.
- `templates/*` – repo-agnostic `.devcontainer` payloads that defer project cloning to downstream consumers.
- `images/*` – prebuilt bases published to GHCR.
- `docs/*` – catalog documentation, migration notes, and security posture.

GitHub Actions handle publishing (`publish-features`, `build-images`) and validation (`test-features`, `test-templates`). Downstream workspaces materialise templates or pull images/features directly from GHCR, keeping workspace-specific logic outside this repo.

This document remains only as a historical breadcrumb and will be removed once all downstream docs reference the catalog-only layout.
