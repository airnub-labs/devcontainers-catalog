# Using the CLI

**Navigation:** [Documentation Hub](../README.md) > [Getting Started](./README.md) > Using the CLI

> Learn the `devc` generator CLI for creating reproducible dev environments

---

## Overview

The `devc` CLI is the primary tool for working with the Airnub DevContainers Catalog. It helps you:

- **Validate** manifests against the schema
- **Generate** prebu​ild contexts and templates from manifests
- **Build** and push multi-arch images
- **Scaffold** complete development workspaces
- **Add services** to existing projects

**Key feature:** The CLI works from anywhere - it can find the catalog automatically or use a remote version.

---

## Installation

```bash
# Install globally via npm
npm install -g @airnub/devc

# Or via pnpm
pnpm add -g @airnub/devc

# Verify installation
devc --version
```

---

## Quick Start

### 1. Validate a Manifest

Before generating, validate your manifest:

```bash
devc validate examples/lesson-manifests/intro-ai-week02.yaml
```

**Output:**
```
✓ Manifest is valid
✓ Schema: edu.airnub.org/v1
✓ Base preset 'node-pnpm' exists
✓ All services available
```

### 2. Generate Artifacts

Generate prebuild contexts and templates:

```bash
devc generate examples/lesson-manifests/intro-ai-week02.yaml \\
  --out-images images/presets/generated \\
  --out-templates templates/generated
```

**Creates:**
- `images/presets/generated/airnub-intro-ai-week02/` - Build context (Dockerfile, labels)
- `templates/generated/airnub-intro-ai-week02/` - Template scaffold (.devcontainer/)
- `docker-compose.classroom.yml` - Service composition

### 3. Build Prebuilt Image

Build a multi-arch image:

```bash
devc build --ctx images/presets/generated/airnub-intro-ai-week02 \\
  --tag ghcr.io/airnub-labs/templates/lessons/intro-ai-week02:v1 \\
  --push
```

**Features:**
- Multi-arch (amd64 + arm64)
- OCI labels included
- Provenance disabled for compatibility

### 4. Scaffold Workspace

Create a ready-to-use workspace:

```bash
devc scaffold examples/lesson-manifests/intro-ai-week02.yaml \\
  --out workspaces/intro-ai-week02
```

**Output:** Complete workspace with `.devcontainer/`, services, and documentation.

---

## Commands Reference

### `devc validate`

Validate a manifest against the schema.

```bash
devc validate <manifest>

# Examples
devc validate lesson.yaml
devc validate examples/lesson-manifests/intro-ai-week02.yaml
```

**Checks:**
- Schema compliance
- Base preset availability
- Service fragment existence
- Required fields present

### `devc generate`

Generate prebuild contexts and templates from a manifest.

```bash
devc generate <manifest> [options]

# Options
--out-images <dir>            # Output directory for image contexts
--out-templates <dir>         # Output directory for templates
--fetch-missing-fragments     # Download missing service fragments
--git-sha <sha>              # Tag outputs with git SHA
--force                      # Overwrite existing outputs

# Examples
devc generate lesson.yaml \\
  --out-images ./images \\
  --out-templates ./templates

devc generate lesson.yaml --force  # Regenerate, overwrite existing
```

**Outputs:**
- Image build context (Dockerfile, metadata)
- Template scaffold (.devcontainer/)
- Aggregate compose file
- Service fragments
- README and .env.example files

### `devc scaffold`

Copy a complete workspace scaffold to a directory.

```bash
devc scaffold <manifest> --out <directory>

# Examples
devc scaffold lesson.yaml --out workspaces/my-lesson
devc scaffold lesson.yaml --out ../student-repo
```

**Use case:** Creating standalone workspaces for distribution to students.

### `devc build`

Build multi-arch images with buildx.

```bash
devc build --ctx <context-dir> --tag <image-tag> [options]

# Options
--ctx <dir>          # Build context directory
--tag <tag>          # Image tag (ghcr.io/...)
--push               # Push to registry after build
--manifest <path>    # Manifest for validation
--version <v#>       # Version suffix (e.g., v2)

# Examples
devc build \\
  --ctx images/presets/generated/my-lesson \\
  --tag ghcr.io/airnub-labs/templates/lessons/my-lesson:v1 \\
  --push

# With version
devc build \\
  --ctx images/presets/generated/my-lesson \\
  --tag ghcr.io/airnub-labs/templates/lessons/my-lesson:v2 \\
  --version v2 \\
  --push
```

**Features:**
- Multi-arch (linux/amd64, linux/arm64)
- Provenance disabled (--provenance=false)
- OCI labels automatically included
- Tag format validation

**Tag format:**
```
ghcr.io/airnub-labs/templates/lessons/<slug>:<base>-<slug>-v<iteration>
```

### `devc doctor`

Comprehensive health check for a manifest.

```bash
devc doctor <manifest>

# Examples
devc doctor examples/lesson-manifests/intro-ai-week02.yaml
```

**Checks:**
- Schema validation
- Canonical tag format
- Preset availability
- Fragment availability
- .env.example placeholders
- Docker buildx readiness

**Example output:**
```
✓ Schema valid
✓ Canonical tag: ghcr.io/airnub-labs/templates/lessons/intro-ai-week02:ubuntu-24.04-intro-ai-week02-v1
✓ Base preset 'node-pnpm' available
✓ Service 'redis' fragment found
✓ Service 'supabase' fragment found
⚠ Missing env placeholders: SUPABASE_URL, SUPABASE_ANON_KEY
✓ docker buildx ready
```

### `devc add service`

Add services to an existing workspace.

```bash
devc add service <service-name>...

# Examples
devc add service redis
devc add service redis supabase
devc add service kafka airflow

# From workspace directory
cd workspaces/my-lesson
devc add service redis
```

**What it does:**
1. Copies service fragments to `.devcontainer/services/`
2. Updates `aggregate.compose.yml`
3. Copies `.env.example` files
4. Adds service README documentation

**Requires:** Running from a workspace directory (contains `.devcontainer/`).

### `devc add extension`

Add VS Code extensions to devcontainer.json.

```bash
devc add extension <extension-id>...

# Examples
devc add extension dbaeumer.vscode-eslint
devc add extension esbenp.prettier-vscode bradlc.vscode-tailwindcss

# From workspace directory
cd workspaces/my-lesson
devc add extension ms-python.python
```

**What it does:**
- Idempotently appends extensions to `.devcontainer/devcontainer.json`
- Avoids duplicates
- Preserves existing configuration

### `devc sync`

Rebuild aggregate compose file for current workspace.

```bash
devc sync [options]

# Options
--manifest <path>    # Use specific manifest

# Examples
devc sync                        # Use on-disk fragments
devc sync --manifest lesson.yaml  # Rebuild from manifest
```

**Use case:** After manually adding/removing service fragments, regenerate the aggregate compose file.

---

## Global Options

Available for all commands:

```bash
--catalog-root <path>    # Use local catalog checkout
--catalog-ref <ref>      # Remote catalog ref (default: main)
--workspace-root <path>  # Workspace location (when not running from it)

# Examples
devc generate lesson.yaml --catalog-root /path/to/catalog
devc validate lesson.yaml --catalog-ref v1.0.0
devc add service redis --workspace-root ../my-workspace
```

---

## Catalog Discovery

The CLI finds catalog assets in three ways:

1. **Explicit path:** `--catalog-root=/path/to/catalog`
2. **Auto-discovery:** Walks up from current directory looking for `schemas/` or `services/`
3. **Remote fallback:** Downloads pinned ref from GitHub to `~/.cache/airnub-devc/<ref>/`

**This means you can use `devc` from anywhere** - you don't need to be in the catalog directory.

---

## Common Workflows

### Complete Lesson Generation

```bash
# 1. Validate
devc validate examples/lesson-manifests/my-lesson.yaml

# 2. Generate
devc generate examples/lesson-manifests/my-lesson.yaml \\
  --out-images images/presets/generated \\
  --out-templates templates/generated

# 3. Build and push
devc build \\
  --ctx images/presets/generated/airnub-my-lesson \\
  --tag ghcr.io/airnub-labs/templates/lessons/my-lesson:v1 \\
  --push

# 4. Scaffold for testing
devc scaffold examples/lesson-manifests/my-lesson.yaml \\
  --out workspaces/my-lesson-test
```

### Add Service to Existing Workspace

```bash
# Navigate to workspace
cd workspaces/my-lesson

# Check current services
ls .devcontainer/services/

# Add Redis
devc add service redis

# Verify
cat aggregate.compose.yml  # Redis should be included
```

### Update Workspace with New Services

```bash
# In workspace directory
cd workspaces/my-lesson

# Add multiple services
devc add service kafka airflow

# Rebuild aggregate compose
devc sync

# Test
docker compose -f aggregate.compose.yml up -d
```

### Regenerate with Force

```bash
# Regenerate, overwriting existing
devc generate lesson.yaml --force \\
  --out-images images/presets/generated \\
  --out-templates templates/generated

# Rebuild image
devc build --ctx images/presets/generated/airnub-my-lesson \\
  --tag ghcr.io/airnub-labs/templates/lessons/my-lesson:v2 \\
  --version v2 \\
  --push
```

---

## CI/CD Integration

The CLI is designed for CI/CD environments:

```bash
# CI workflow example
#!/bin/bash

# Validate (using remote catalog)
devc validate examples/lesson-manifests/intro-ai-week02.yaml \\
  --catalog-ref main

# Generate to ./out/
devc generate examples/lesson-manifests/intro-ai-week02.yaml \\
  --out-images ./out/images \\
  --out-templates ./out/templates \\
  --catalog-ref main

# Build and push
devc build \\
  --ctx ./out/images/airnub-intro-ai-week02 \\
  --tag ghcr.io/airnub-labs/templates/lessons/intro-ai-week02:v1 \\
  --push
```

**Benefits:**
- No catalog checkout required
- Reproducible with `--catalog-ref`
- Works in any CI environment (GitHub Actions, GitLab CI, etc.)

---

## Troubleshooting

### "Catalog not found"

**Solution:** Either run from catalog directory, or use `--catalog-ref main` to fetch remote.

```bash
devc generate lesson.yaml --catalog-ref main
```

### "Service fragment not found"

**Solution:** Use `--fetch-missing-fragments` to download from GitHub.

```bash
devc generate lesson.yaml --fetch-missing-fragments
```

### "docker buildx not available"

**Solution:** Install Docker Buildx:

```bash
docker buildx version  # Check if installed
docker buildx create --use  # Create buildx instance
```

### "Invalid tag format"

**Solution:** Use the canonical tag format:

```
ghcr.io/airnub-labs/templates/lessons/<slug>:<base>-<slug>-v<iteration>
```

Example:
```bash
devc build --ctx ./context \\
  --tag ghcr.io/airnub-labs/templates/lessons/my-lesson:ubuntu-24.04-my-lesson-v1
```

---

## Related Documentation

- **[Manifest Authoring](./manifest-authoring.md)** - Write lesson manifests
- **[Generator Guide](../guides/generator.md)** - How generation works
- **[Services Reference](../reference/services.md)** - Available services
- **[Troubleshooting](../operations/troubleshooting.md)** - Common issues

---

**Last Updated:** 2025-11-02 (Phase 6: Create New Content & Polish)
