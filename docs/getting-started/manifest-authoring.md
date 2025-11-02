# Manifest Authoring Guide

**Navigation:** [Documentation Hub](../README.md) > [Getting Started](./README.md) > Manifest Authoring

> Learn to write lesson manifests for reproducible development environments

---

## Overview

Lesson manifests are YAML files that declare your desired development environment. The `devc` generator reads these manifests and produces reproducible artifacts (images, templates, compose files).

**Benefits:**
- **Declarative** - Describe what you want, not how to build it
- **Reproducible** - Same manifest → same output every time
- **Version-controlled** - Track environment changes in git
- **Portable** - Works across local Docker, Codespaces, and other providers

---

## Basic Manifest Structure

```yaml
# examples/lesson-manifests/my-lesson.yaml
apiVersion: edu.airnub.org/v1
kind: LessonEnvironment

metadata:
  name: my-first-lesson
  org: airnub
  course: intro-to-web
  lesson: week01-html-basics

spec:
  base_preset: node-pnpm        # Prebuilt base image
  services:                     # Additional services
    - redis
    - supabase
  secrets_placeholders:         # Environment variables/secrets
    - SUPABASE_URL
    - SUPABASE_ANON_KEY
```

---

## Manifest Schema Reference

### Metadata Section

Identifies the lesson and its organizational context.

```yaml
metadata:
  name: unique-lesson-id          # Unique identifier (kebab-case)
  org: organization-name          # Organization (e.g., "airnub")
  course: course-identifier       # Course code (e.g., "cs101")
  lesson: lesson-identifier       # Lesson code (e.g., "week01")
  display_name: "Lesson Title"    # Human-readable title (optional)
  description: "Brief desc"       # Short description (optional)
```

**Naming conventions:**
- Use kebab-case for identifiers
- Keep names concise but descriptive
- Include course/lesson hierarchy for clarity

### Spec Section

Defines the technical requirements for the environment.

```yaml
spec:
  base_preset: preset-name        # Required: Base image preset
  services: []                    # Optional: List of services
  secrets_placeholders: []        # Optional: Environment variables
  ports: []                       # Optional: Additional port mappings
  features: []                    # Optional: Additional Dev Container features
```

---

## Base Presets

Choose a base preset that matches your lesson's requirements:

| Preset | Includes | Best For |
|--------|----------|----------|
| `node-pnpm` | Node.js 24 + pnpm | Web development, JavaScript/TypeScript |
| `full` | Node + pnpm + Python + Jupyter | Full-stack, data science |
| `python` | Python 3.11 + pip | Python-focused lessons |
| `minimal` | Base Ubuntu + essentials | Custom setups, minimal footprint |

**Example:**

```yaml
spec:
  base_preset: node-pnpm
```

---

## Adding Services

Services are sidecar containers that run alongside your dev environment.

### Available Services

- **redis** - In-memory cache/queue
- **supabase** - Local Supabase stack (Postgres, Auth, Storage, Realtime)
- **kafka** - Kafka + KRaft (no Zookeeper)
- **airflow** - Workflow orchestration
- **prefect** - Data orchestration
- **dagster** - Data orchestration
- **temporal** - Workflow engine
- **webtop** - Full Linux desktop (KDE)
- **novnc** - noVNC web desktop

**Example:**

```yaml
spec:
  base_preset: node-pnpm
  services:
    - redis
    - supabase
    - webtop
```

📖 See [Services Reference](../reference/services.md) for full details on each service.

---

## Environment Variables & Secrets

Declare environment variables and secrets that your lesson needs.

```yaml
spec:
  secrets_placeholders:
    - SUPABASE_URL
    - SUPABASE_ANON_KEY
    - API_KEY
    - DATABASE_URL
```

**How it works:**
- Generator creates `.env.example` with these placeholders
- In Codespaces: Map to repository secrets
- Locally: Copy `.env.example` to `.env` and fill in values
- In SaaS: Platform vault provides values

**Security note:** Never commit actual secrets to manifests. Use placeholders only.

---

## Port Mappings

Specify additional ports to expose (beyond service defaults).

```yaml
spec:
  ports:
    - number: 8080
      label: "app-server"
      protocol: http
      visibility: public
    - number: 5432
      label: "postgres"
      protocol: tcp
      visibility: private
```

**Port visibility:**
- `public` - Accessible from outside the container
- `private` - Container-internal only

---

## Additional Features

Add extra Dev Container features beyond the base preset.

```yaml
spec:
  features:
    - id: ghcr.io/devcontainers/features/docker-in-docker:2
      options:
        version: latest
    - id: ghcr.io/airnub-labs/devcontainer-features/chrome-cdp:1
      options:
        port: 9222
```

📖 Browse features at [containers.dev/features](https://containers.dev/features)

---

## Complete Example

```yaml
apiVersion: edu.airnub.org/v1
kind: LessonEnvironment

metadata:
  name: fullstack-web-app
  org: airnub
  course: cs-302-web-dev
  lesson: week05-full-stack
  display_name: "Full-Stack Web Application"
  description: "Build a complete Next.js + Supabase application"

spec:
  # Base environment
  base_preset: node-pnpm

  # Services
  services:
    - redis        # Session storage
    - supabase     # Backend as a service
    - webtop       # Desktop environment for students

  # Environment variables
  secrets_placeholders:
    - SUPABASE_URL
    - SUPABASE_ANON_KEY
    - REDIS_URL
    - NEXT_PUBLIC_APP_URL

  # Custom ports
  ports:
    - number: 3000
      label: "nextjs-dev"
      protocol: http
      visibility: public
    - number: 3001
      label: "storybook"
      protocol: http
      visibility: public

  # Additional features
  features:
    - id: ghcr.io/airnub-labs/devcontainer-features/chrome-cdp:1
      options:
        port: 9222
```

---

## Using Your Manifest

### Generate Artifacts

```bash
devc generate examples/lesson-manifests/fullstack-web-app.yaml \\
  --out-images images/presets/generated \\
  --out-templates templates/generated
```

**Outputs:**
- `images/presets/generated/airnub-fullstack-web-app/` - Build context
- `templates/generated/airnub-fullstack-web-app/` - Template scaffold
- `docker-compose.classroom.yml` - Service composition

### Build Prebuilt Image

```bash
devc build --ctx images/presets/generated/airnub-fullstack-web-app \\
  --tag ghcr.io/airnub-labs/templates/lessons/fullstack-web-app:v1
```

### Scaffold Workspace

```bash
devc scaffold examples/lesson-manifests/fullstack-web-app.yaml \\
  --out workspaces/fullstack-web-app
```

---

## Best Practices

### ✅ DO

- **Use semantic naming** - `intro-web-week01`, not `lesson1`
- **Version manifests** - Commit to git, tag releases
- **Document requirements** - Add `description` and comments
- **Pin feature versions** - Use specific versions, not `:latest`
- **Group services logically** - Only include what's needed
- **Test locally first** - Validate before publishing

### ❌ DON'T

- **Hardcode secrets** - Use placeholders only
- **Over-provision** - Keep services minimal
- **Skip metadata** - Always fill in org/course/lesson
- **Use generic names** - Be specific and descriptive
- **Ignore validation** - Run `devc validate` before generating

---

## Validation

Validate your manifest before generating:

```bash
devc validate examples/lesson-manifests/my-lesson.yaml
```

**Common validation errors:**
- Missing required fields (name, base_preset)
- Invalid service names
- Malformed YAML syntax
- Unsupported base preset

---

## Manifest Patterns

### Pattern: Simple Web Lesson

```yaml
apiVersion: edu.airnub.org/v1
kind: LessonEnvironment

metadata:
  name: simple-web-app
  org: airnub
  course: intro-web
  lesson: week01

spec:
  base_preset: node-pnpm
  # No additional services needed
```

### Pattern: Full-Stack with Database

```yaml
spec:
  base_preset: node-pnpm
  services:
    - supabase
  secrets_placeholders:
    - SUPABASE_URL
    - SUPABASE_ANON_KEY
```

### Pattern: Desktop Environment

```yaml
spec:
  base_preset: full
  services:
    - webtop       # Full desktop for GUI apps
    - redis
  secrets_placeholders:
    - VNC_PASSWORD
```

### Pattern: Data Science

```yaml
spec:
  base_preset: full  # Includes Python + Jupyter
  services:
    - kafka          # For streaming data
    - airflow        # For orchestration
```

---

## Related Documentation

- **[Using the CLI](./using-cli.md)** - Learn `devc` commands
- **[Services Reference](../reference/services.md)** - Available services
- **[Generator Guide](../guides/generator.md)** - How generation works
- **[Lesson Flow](../guides/lesson-flow.md)** - End-to-end workflow

---

**Last Updated:** 2025-11-02 (Phase 6: Create New Content & Polish)
