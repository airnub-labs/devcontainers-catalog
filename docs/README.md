# Documentation Hub

> Comprehensive documentation for the Airnub DevContainers Catalog

Welcome to the documentation hub for the Airnub DevContainers Catalog. This catalog provides primitives (Features, Templates, Images) for building fast, reproducible development environments for education and beyond.

---

## 🚀 Quick Start

**New to the catalog?** Start here:

- **[Classroom Quick Start](./getting-started/classroom-quick-start.md)** - Set up fast classroom environments
- **[Using the CLI](./getting-started/using-cli.md)** - Learn the `devc` generator CLI
- **[Manifest Authoring](./getting-started/manifest-authoring.md)** - Write lesson manifests

**Quick reference:**
- [Services Reference](./reference/services.md) - Available services (Redis, Supabase, Kafka, etc.)
- [Stacks Reference](./reference/stacks.md) - Pre-configured stack combinations

---

## 📖 Documentation Sections

### [Getting Started](./getting-started/)
Quickstart guides and tutorials for new users.

**Topics:**
- Fast classroom setup workflows
- CLI usage and commands
- Writing lesson manifests

### [Guides](./guides/)
Step-by-step how-to guides for common tasks.

**Topics:**
- Migration guides
- Generator workflows
- Lesson creation flow
- CLI tools and usage

### [Architecture](./architecture/)
System design, principles, and architectural decisions.

**Key Documents:**
- ⭐ **[Separation of Concerns](./architecture/separation-of-concerns-devcontainers-vs-comhra.md)** - CRITICAL: Catalog is education-agnostic
- **[Dev Environments Strategy](./mvp/dev-environments-strategy.md)** - Provider-agnostic design
- **[Catalog Design](./architecture/catalog-design.md)** - Feature/template/image reference
- **[Platform Architecture](./architecture/platform-architecture.md)** - System overview

### [Reference](./reference/)
Technical specifications, API references, and service documentation.

**Topics:**
- Services (Redis, Supabase, Kafka, orchestrators)
- Stacks and orchestrators matrix
- Versioning strategy
- Health check endpoints

### [MVP](./mvp/)
Current MVP strategy and implementation roadmap.

**Topics:**
- MVP launch plan
- Experimental services policy
- Lesson scaffolding enablement
- Coding agent prompts

### [Vision](./vision/)
Product vision, positioning, and strategic roadmap.

**Topics:**
- SaaS education platform vision
- Market positioning
- Comhrá integration roadmap

### [Operations](./operations/)
Deployment guides, health checks, and operational procedures.

**Topics:**
- Sidecar health monitoring
- Container operations
- Troubleshooting common issues

### [Contributing](./contributing/)
Contributor guidelines, development setup, and maintainer docs.

**Topics:**
- Development environment setup
- Maintainer guidelines
- Testing guidelines

---

## 🎯 Key Principles

Understanding these principles is essential for working with the catalog:

### 1. Education-Agnostic Design

The catalog is a **stateless generator** with **NO classroom/course/student concepts**. All education-specific logic lives in the **comhrá SaaS platform**.

**Why it matters:**
- Catalog can be used for any development scenario (not just education)
- Clear separation between generator (catalog) and platform (comhrá)
- Reproducible, portable environments

📖 Read more: [Separation of Concerns](./architecture/separation-of-concerns-devcontainers-vs-comhra.md)

### 2. Source vs. Artifact Mental Model

- **Templates** = SOURCE scaffolds (Dev Container Templates per spec)
- **Images/Presets** = ARTIFACT build contexts (prebuilt OCI images)

**For classrooms:** Prefer prebuilt lesson images for students (fast starts), templates for instructors (flexibility).

📖 Read more: [SaaS Education Platform Vision](./vision/saas-edu-platform-vision.md)

### 3. Manifest-Driven Generation

Lesson manifests → reproducible artifacts (images, templates, compose files).

**Benefits:**
- Declarative infrastructure
- Version-controlled environments
- Repeatable across semesters

📖 Read more: [Manifest Authoring](./getting-started/manifest-authoring.md)

### 4. Provider-Agnostic

Works consistently across:
- Local Docker
- GitHub Codespaces
- VS Code Remote Containers
- Any Dev Containers CLI-compatible environment

📖 Read more: [Dev Environments Strategy](./mvp/dev-environments-strategy.md)

### 5. Reproducibility First

- Semantic versioning for all artifacts
- Digest pinning for production
- Lock files for dependency versions

📖 Read more: [Versioning Strategy](./reference/versioning.md)

---

## 🔍 Find What You Need

### By Role

**👨‍🏫 Educators:**
- [Classroom Quick Start](./getting-started/classroom-quick-start.md)
- [Lesson Flow](./guides/lesson-flow.md)
- [SaaS Platform Vision](./vision/saas-edu-platform-vision.md)

**👨‍💻 Developers:**
- [Using the CLI](./getting-started/using-cli.md)
- [Generator Guide](./guides/generator.md)
- [Development Setup](./contributing/development.md)

**🏗️ Architects:**
- [Architecture Overview](./architecture/README.md)
- [Separation of Concerns](./architecture/separation-of-concerns-devcontainers-vs-comhra.md)
- [Platform Architecture](./architecture/platform-architecture.md)

**🔧 DevOps/SRE:**
- [Sidecars Health](./operations/sidecars-health.md)
- [Docker Containers](./operations/docker-containers.md)
- [Troubleshooting](./operations/troubleshooting.md)

**🤝 Contributors:**
- [Contributing Guide](./contributing/README.md)
- [Development Setup](./contributing/development.md)
- [Testing Guidelines](./contributing/testing.md)

### By Task

**I want to...**

- **Set up a classroom environment** → [Classroom Quick Start](./getting-started/classroom-quick-start.md)
- **Generate a lesson from a manifest** → [Using the CLI](./getting-started/using-cli.md)
- **Write a lesson manifest** → [Manifest Authoring](./getting-started/manifest-authoring.md)
- **Add a service (Redis, Kafka, etc.)** → [Services Reference](./reference/services.md)
- **Use a pre-configured stack** → [Stacks Reference](./reference/stacks.md)
- **Understand the architecture** → [Architecture Overview](./architecture/README.md)
- **Migrate from old templates** → [Migration Guide](./guides/migration.md)
- **Troubleshoot an issue** → [Troubleshooting](./operations/troubleshooting.md)
- **Contribute code** → [Development Setup](./contributing/development.md)

---

## 📦 What's in the Catalog

### Primitives

- **Features** → Install tooling (Supabase CLI, Node, CUDA, etc.). Idempotent, no services.
- **Templates** → Ship a ready-to-use `.devcontainer/` payload (can be multi-container via Compose).
- **Images** → Prebuilt bases to speed builds.
- **Stacks** → Opinionated template flavors combining features + sidecars + ports.

### Available Services

- **Redis** - Cache/queue
- **Supabase** - Local development stack
- **Kafka + KRaft** - Streaming
- **Airflow** - Workflow orchestration
- **Prefect** - Data orchestration
- **Dagster** - Data orchestration
- **Temporal** - Workflow engine
- **Webtop/noVNC** - GUI desktops

📖 Full reference: [Services Reference](./reference/services.md)

---

## 🗺️ Documentation Map

```
docs/
├── README.md (you are here)
│
├── getting-started/        Quick starts and tutorials
│   ├── classroom-quick-start.md
│   ├── using-cli.md
│   └── manifest-authoring.md
│
├── guides/                 How-to guides
│   ├── migration.md
│   ├── generator.md
│   ├── lesson-flow.md
│   └── cli-devc.md
│
├── architecture/           System design
│   ├── separation-of-concerns-devcontainers-vs-comhra.md ⭐
│   ├── catalog-design.md
│   └── platform-architecture.md
│
├── reference/             Technical specs
│   ├── services.md
│   ├── stacks.md
│   ├── stacks-orchestrators.md
│   └── versioning.md
│
├── mvp/                   Current MVP strategy
│   ├── mvp-launch-plan.md
│   ├── dev-environments-strategy.md
│   └── separation-of-concerns-devcontainers-vs-comhra.md
│
├── vision/                Product vision
│   ├── saas-edu-platform-vision.md ⭐
│   ├── positioning-brief.md
│   └── comhra-devcontainers-integration-roadmap.md
│
├── operations/            Deployment & ops
│   ├── sidecars-health.md
│   ├── docker-containers.md
│   └── troubleshooting.md
│
└── contributing/          Contributor docs
    ├── development.md
    ├── maintainers.md
    └── testing.md
```

---

## 🆘 Get Help

- **Troubleshooting:** [Operations Guide](./operations/troubleshooting.md)
- **Common Issues:** Check [GitHub Issues](https://github.com/airnub-labs/devcontainers-catalog/issues)
- **Contributing:** [Contribution Guidelines](./contributing/README.md)
- **Security:** [Security Policy](../SECURITY.md)

---

## 📝 Related Documentation

- **[Root README](../README.md)** - Repository overview
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - How to contribute
- **[CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)** - Community standards
- **[SECURITY.md](../SECURITY.md)** - Security policies
- **[CHANGELOG.md](../CHANGELOG.md)** - Version history

---

**Last Updated:** 2025-11-02 (Phase 6: Create New Content & Polish)
