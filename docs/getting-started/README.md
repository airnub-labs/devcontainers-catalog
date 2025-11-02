# Getting Started

> Quick start guides for the Airnub DevContainers Catalog

Welcome! This section provides quick start guides to help you get up and running with the catalog quickly.

---

## 📚 Guides in This Section

### [Classroom Quick Start](./classroom-quick-start.md)
**Set up fast classroom environments with prebuilt images**

Perfect for educators who want to:
- Deploy environments quickly for students
- Use manifest-driven or direct preset approaches
- Set up services like Redis, Supabase, and desktop GUIs
- Get students coding in under 2 minutes

### [Using the CLI](./using-cli.md)
**Learn the `devc` generator CLI**

The `devc` CLI helps you:
- Generate lesson artifacts from manifests
- Build and publish prebuilt images
- Scaffold complete development workspaces
- Add services to existing projects

### [Manifest Authoring](./manifest-authoring.md)
**Write lesson manifests for reproducible environments**

Learn to:
- Structure lesson manifest files
- Configure base presets and services
- Define environment variables and secrets
- Generate reproducible dev environments

---

## ⚡ Quick Links

**I want to...**

- **Set up a classroom fast** → [Classroom Quick Start](./classroom-quick-start.md)
- **Use the CLI tool** → [Using the CLI](./using-cli.md)
- **Write a manifest** → [Manifest Authoring](./manifest-authoring.md)
- **Add a service** → [Services Reference](../reference/services.md)
- **Pick a stack** → [Stacks Reference](../reference/stacks.md)

---

## 🎯 Choose Your Path

### For Educators

1. Start with [Classroom Quick Start](./classroom-quick-start.md)
2. Learn [Manifest Authoring](./manifest-authoring.md)
3. Explore [Services Reference](../reference/services.md)
4. Read the [SaaS Platform Vision](../vision/saas-edu-platform-vision.md)

### For Developers

1. Read [Using the CLI](./using-cli.md)
2. Check out [Generator Guide](../guides/generator.md)
3. Explore [Stacks Reference](../reference/stacks.md)
4. Review [Architecture](../architecture/README.md)

### For Contributors

1. Set up your environment: [Development Setup](../contributing/development.md)
2. Understand the architecture: [Architecture Overview](../architecture/README.md)
3. Read contribution guidelines: [Contributing](../contributing/README.md)

---

## 🚀 30-Second Start

The fastest way to get started depends on your goal:

### Fast Classroom Setup (Manifest-Driven)

```bash
# 1. Generate from manifest
devc generate examples/lesson-manifests/intro-ai-week02.yaml \\
  --out-images images/presets/generated \\
  --out-templates templates/generated

# 2. Build prebuilt image
devc build --ctx images/presets/generated/airnub-intro-ai-week02 \\
  --tag ghcr.io/airnub-labs/templates/lessons/intro-ai-week02:v1

# 3. Scaffold workspace
devc scaffold examples/lesson-manifests/intro-ai-week02.yaml \\
  --out workspaces/intro-ai-week02
```

### Quick Template Apply

```bash
# Apply a pre-configured stack template
devcontainer templates apply \\
  --template-id ghcr.io/airnub-labs/devcontainer-templates/stack-nextjs-supabase-webtop:1.0.0 \\
  --workspace-folder .
```

### Add Service to Existing Project

```bash
# Add Redis and Supabase to current project
devc add service redis supabase
```

---

## 📖 Core Concepts

Before diving in, understand these key concepts:

### Primitives

- **Features** = Install tooling (idempotent, no services)
- **Templates** = Ready-to-use `.devcontainer/` scaffolds
- **Images** = Prebuilt bases for fast starts
- **Stacks** = Template flavors with tested service combinations

### Source vs. Artifact

- **Templates** = SOURCE (flexible, customizable scaffolds)
- **Images/Presets** = ARTIFACTS (fast, prebuilt environments)

**Rule of thumb:** Use prebuilt images for students (speed), templates for instructors (flexibility).

### Manifest-Driven

Lesson manifests → reproducible artifacts (images, templates, compose files).

**Benefits:**
- Declarative infrastructure
- Version-controlled environments
- Repeatable across semesters

---

## 🆘 Need Help?

- **Troubleshooting:** [Operations Guide](../operations/troubleshooting.md)
- **Common Issues:** [GitHub Issues](https://github.com/airnub-labs/devcontainers-catalog/issues)
- **Ask Questions:** Open a discussion on GitHub

---

## 📝 Related Documentation

- **[Documentation Hub](../README.md)** - Full documentation
- **[Guides](../guides/README.md)** - How-to guides
- **[Reference](../reference/README.md)** - Technical specifications
- **[Architecture](../architecture/README.md)** - System design

---

**Last Updated:** 2025-11-02 (Phase 6: Create New Content & Polish)
