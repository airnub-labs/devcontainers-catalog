# Catalog Design & Reference

> Comprehensive guide to the devcontainers-catalog architecture, structure, and available assets

This document consolidates the catalog's architectural design with a complete reference of all published features, templates, and images. It serves as both a design overview and a practical reference matrix.

---

## Table of Contents

- [Catalog Structure](#catalog-structure)
- [Design Principles](#design-principles)
- [Features Reference](#features-reference)
- [Templates Reference](#templates-reference)
- [Images Reference](#images-reference)
- [Published Coordinates](#published-coordinates)
- [Reproducibility](#reproducibility)
- [CI Expectations](#ci-expectations)

---

## Catalog Structure

The catalog is organized into three primary asset types:

### Directory Layout

```
devcontainers-catalog/
├── features/              # Idempotent installers (no services)
│   ├── supabase-cli/
│   ├── chrome-cdp/
│   ├── deno/
│   └── ...
├── templates/             # Opinionated environments & stacks
│   ├── web/
│   ├── nextjs-supabase/
│   ├── stack-*/
│   └── ...
├── images/                # Prebuilt base images
│   ├── dev-base/
│   └── dev-web/
├── services/              # Compose fragments for sidecars
└── docs/                  # Documentation
```

### Asset Types

**Features (`features/*`):**
- Idempotent installers that add tools, runtimes, or capabilities
- No long-running services (use sidecars for that)
- Composable via `installsAfter` dependencies
- Published as OCI artifacts to GHCR

**Templates (`templates/*`):**
- Opinionated dev container configurations
- Include `stack-*` variants for validated combinations
- Publish `.template/.devcontainer/*` payloads
- Support variable substitution (Mustache-style)

**Images (`images/*`):**
- Prebuilt base containers (multi-arch: amd64, arm64)
- Layer hierarchy: dev-base → dev-web → presets
- Published with semver tags and digests

---

## Design Principles

### 1. "Stack" = Template

A **stack** is a template that bundles a validated combination:
- **dev** (primary container)
- **redis** sidecar (optional)
- **GUI sidecar** (webtop or novnc)
- **Chrome CDP** port labels
- **Supabase:** CLI-managed local by default; compose-based flavor optional

Stacks are templates with a proven, tested configuration for common use cases.

### 2. Template Payloads

Each template publishes `.template/.devcontainer/*` so consumers can:
1. Copy files into their repository
2. Customize via template variables
3. Commit the materialized configuration

Templates are **scaffolds, not dependencies** - they generate config files.

### 3. Education-Agnostic

The catalog contains **no education-specific concepts**:
- No classroom/course/student models
- No persistence or user state
- Pure functional generation

All education logic lives in comhrá (the SaaS platform).

### 4. Reproducibility

Reproducible builds are critical. Include `stack.lock.json` (or README section) pinning:
- Feature versions (semver or tags)
- Image digests for `dev` and sidecars
- Service versions

This ensures `manifest → artifacts` is deterministic.

---

## Features Reference

Reusable Dev Container features for installing tools and capabilities.

| Feature | Description | Key Options | OCI Reference |
| --- | --- | --- | --- |
| `supabase-cli` | Installs the Supabase CLI with optional helper scripts and metadata capture. | `version`, `manageLocalStack`, `services`, `projectRef` | `ghcr.io/airnub-labs/devcontainer-features/supabase-cli:<semver>` |
| `chrome-cdp` | Headless Chrome with a DevTools Protocol endpoint managed by supervisord. | `channel`, `port` | `ghcr.io/airnub-labs/devcontainer-features/chrome-cdp:<semver>` |
| `deno` | Installs the Deno runtime with optional shell completions. | `version`, `installCompletions` | `ghcr.io/airnub-labs/devcontainer-features/deno:<semver>` |
| `agent-tooling-clis` | Installs Codex, Claude, and Gemini CLIs using pnpm/npm fallbacks. Configure MCP servers per project via template hooks. | `installCodex`, `installClaude`, `installGemini`, `versions` | `ghcr.io/airnub-labs/devcontainer-features/agent-tooling-clis:<semver>` |
| `cursor-ai` | Installs the Cursor AI CLI via pnpm/npm with optional version pinning. | `version` | `ghcr.io/airnub-labs/devcontainer-features/cursor-ai:<semver>` |
| `docker-in-docker-plus` | Adds Buildx/BuildKit ergonomics on top of Docker-in-Docker. | _none_ | `ghcr.io/airnub-labs/devcontainer-features/docker-in-docker-plus:<semver>` |
| `cuda-lite` | Installs CUDA runtime libraries only when a GPU is detected. | _none_ | `ghcr.io/airnub-labs/devcontainer-features/cuda-lite:<semver>` |

### Feature Characteristics

- **Idempotent:** Can be re-run safely
- **No daemons:** Features don't start services (use sidecars)
- **Composable:** Use `installsAfter` for dependencies
- **Spec-compliant:** Follow DevContainer feature specification

---

## Templates Reference

Opinionated development environment scaffolds and stacks.

| Template | Version | Base Image(s) | Included Features | Notes | OCI Reference |
| --- | --- | --- | --- | --- | --- |
| `web` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` (optional local build) | `chrome-cdp`, `supabase-cli` | Options toggle the prebuilt image and CDP channel/port. | `ghcr.io/airnub-labs/devcontainer-templates/web:1.0.0` |
| `nextjs-supabase` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` (optional local build) | `chrome-cdp`, `supabase-cli`, `agent-tooling-clis` (optional) | Supports turnkey Next.js scaffolding with Supabase integrations. | `ghcr.io/airnub-labs/devcontainer-templates/nextjs-supabase:1.0.0` |
| `classroom-studio-webtop` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` + `lscr.io/linuxserver/webtop` sidecar | `supabase-cli`, `agent-tooling-clis` | Managed/none Chrome policy presets mount into the sidecar; override via the `chromePolicies` option. | `ghcr.io/airnub-labs/devcontainer-templates/classroom-studio-webtop:1.0.0` |
| `stack-web-node-supabase-webtop` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` + optional Redis/webtop sidecars | `chrome-cdp`, `supabase-cli`, `agent-tooling-clis` | Stack template combining Node tooling, Supabase CLI, and GUI sidecars. | `ghcr.io/airnub-labs/devcontainer-templates/stack-web-node-supabase-webtop:1.0.0` |
| `stack-nextjs-supabase-webtop` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` + optional Redis/webtop sidecars | `chrome-cdp`, `supabase-cli`, `agent-tooling-clis` (optional) | Stack template with Next.js scaffolding toggles. | `ghcr.io/airnub-labs/devcontainer-templates/stack-nextjs-supabase-webtop:1.0.0` |
| `stack-nextjs-supabase-novnc` | `1.0.0` | `ghcr.io/airnub-labs/devcontainer-images/dev-web` + noVNC sidecar | `chrome-cdp`, `supabase-cli`, `agent-tooling-clis` (optional) | noVNC desktop variant of the stack. | `ghcr.io/airnub-labs/devcontainer-templates/stack-nextjs-supabase-novnc:1.0.0` |

### Template Categories

**Simple Templates:**
- `web` - Basic web development environment
- `nextjs-supabase` - Next.js with Supabase integration

**Stack Templates (`stack-*`):**
- Validated combinations of features + sidecars
- Include Redis, GUI desktops (webtop/novnc)
- Production-ready configurations

**Classroom Templates (`classroom-*`):**
- Optimized for education use cases
- Chrome policy management
- Studio/IDE configurations

---

## Images Reference

Prebuilt base container images (multi-arch: amd64, arm64).

| Image | Description | OCI Reference |
| --- | --- | --- |
| `dev-base` | Ubuntu base with Node.js, pnpm, Playwright dependencies, and general developer tooling. | `ghcr.io/airnub-labs/devcontainer-images/dev-base:<semver>` |
| `dev-web` | Extends `dev-base` with Chrome repositories and web tooling. | `ghcr.io/airnub-labs/devcontainer-images/dev-web:<semver>` |

### Image Hierarchy

```
dev-base (Node, pnpm, Playwright deps, dev tools)
  └── dev-web (+ Chrome repos, web tooling)
        ├── presets/* (specialized configurations)
        └── lessons/* (lesson-specific images)
```

### Image Characteristics

- **Multi-arch:** Built for amd64 and arm64
- **Semver tags:** `1.2.3`, `1.2`, `1`, `latest`
- **Digest pinning:** Use digests for reproducibility
- **SBOM + Provenance:** Supply chain security via attestations

Refer to [`VERSIONING.md`](../../VERSIONING.md) for published tags and digests.

---

## Published Coordinates

All catalog assets are published to GitHub Container Registry (GHCR):

**Features:**
```
ghcr.io/airnub-labs/devcontainer-features/<feature-id>:<semver>
```

**Templates & Stacks:**
```
ghcr.io/airnub-labs/devcontainer-templates/<template-id>:<semver>
```

**Images:**
```
ghcr.io/airnub-labs/devcontainer-images/<image-name>:<semver>
```

Matching tags:
- `:1.2.3` - Exact version
- `:1.2` - Latest patch
- `:1` - Latest minor
- `:latest` - Latest release

### Migration from Legacy Names

Legacy coordinates used shorter image names (`ghcr.io/airnub-labs/dev-web`). Migrate with:

```bash
sed -i 's#ghcr.io/airnub-labs/dev-web#ghcr.io/airnub-labs/devcontainer-images/dev-web#g' <file>
sed -i 's#ghcr.io/airnub-labs/dev-base#ghcr.io/airnub-labs/devcontainer-images/dev-base#g' <file>
```

---

## Reproducibility

### Stack Lock Files

Include `stack.lock.json` in templates to pin versions:

```json
{
  "features": {
    "ghcr.io/airnub-labs/devcontainer-features/supabase-cli": "1.2.3",
    "ghcr.io/airnub-labs/devcontainer-features/chrome-cdp": "1.0.5"
  },
  "images": {
    "dev": "ghcr.io/airnub-labs/devcontainer-images/dev-web@sha256:abc123...",
    "redis": "redis:7-alpine@sha256:def456...",
    "webtop": "lscr.io/linuxserver/webtop:ubuntu-mate@sha256:789ghi..."
  }
}
```

### Deterministic Builds

Given the same:
- Manifest (lesson definition)
- Feature versions
- Image digests

The catalog must produce **identical artifacts** every time.

This is critical for:
- Classroom reproducibility
- Student environment parity
- Audit compliance

---

## CI Expectations

### Feature Validation
- Schema validation (devcontainer-feature.json)
- Idempotence testing (run install.sh twice)
- Multi-arch builds

### Template Testing
- Materialize payloads to temp directory
- Run smoke tests (ports reachable, binaries present)
- Validate variable substitution

### Image Building
- Multi-arch builds (amd64, arm64)
- SBOM generation
- Provenance attestation
- Layer caching optimization

### Publishing
- OIDC authentication to GHCR
- Namespace linting (`ghcr.io/airnub-labs/*`)
- Semver tag generation
- Digest pinning documentation

See `.github/workflows/` for implementation details.

---

## Related Documentation

- **[Spec Alignment](./spec-alignment.md)** - DevContainer specification compliance
- **[Platform Architecture](./platform-architecture.md)** - Overall system design
- **[MVP Strategy](../mvp/README.md)** - Current strategic direction
- **[VERSIONING.md](../../VERSIONING.md)** - Version strategy and published artifacts

---

## Historical Context

This document consolidates:
- **CATALOG.md** (feature/template/image matrix)
- **CATALOG-ARCHITECTURE.md** (architectural design)

Both merged in Phase 3 of documentation reorganization (November 2025) to provide a single comprehensive reference for catalog design and available assets.

---

**Last Updated:** 2025-11-02 (Phase 3: Organize MVP & Core Docs)
