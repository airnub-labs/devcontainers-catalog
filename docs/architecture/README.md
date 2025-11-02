# Architecture Documentation

> System architecture, design principles, and technical specifications for the devcontainers-catalog

This directory contains the core architectural documentation for the devcontainers-catalog project, including catalog design, platform architecture, specification compliance, and integration patterns.

---

## Core Architecture Documents

### [Catalog Design & Reference](./catalog-design.md) ⭐
**Comprehensive guide to catalog structure and available assets**

The definitive reference for:
- Catalog structure (features, templates, images)
- Design principles (education-agnostic, reproducible)
- Complete feature/template/image matrix
- Published OCI coordinates
- Reproducibility and CI expectations

**Start here** to understand how the catalog is organized and what's available.

### [Platform Architecture](./platform-architecture.md)
**Overall system design and component relationships**

Details the complete platform including:
- System components and their interactions
- Lifecycle and data flow
- Personas and use cases
- Integration points
- Deployment architecture

### [Spec Alignment](./spec-alignment.md)
**DevContainer specification compliance**

Documents how the catalog aligns with:
- Official DevContainer specification
- OCI artifact conventions
- Feature/template schemas
- Version strategy
- Publishing model

### [Agents & MCP Contract](./agents-mcp-contract.md)
**AI agent integration and Model Context Protocol**

Covers:
- MCP integration patterns
- Agent tooling and workflows
- Context management
- LLM-assisted development
- Coding prompt conventions

---

## Key Architectural Principles

### 1. Education-Agnostic Design

The catalog must remain **completely education-agnostic**:
- ❌ No classroom/course/student concepts in catalog code
- ❌ No persistence or user state
- ❌ No platform-specific assumptions
- ✅ Pure functional generation from manifests
- ✅ Stateless library behavior

**All education-specific logic lives in comhrá** (the SaaS platform), never in the catalog.

### 2. Separation of Concerns

Critical architectural boundary between:

**devcontainers-catalog (this repository):**
- Education-agnostic generator/library
- Stateless manifest → artifact transformation
- Reusable features, templates, images
- No persistence, no user state

**comhrá (SaaS platform):**
- All education context (classrooms, courses, students)
- Persistence layer
- User management
- Platform logic and workflows

See [docs/mvp/separation-of-concerns-devcontainers-vs-comhra.md](../mvp/separation-of-concerns-devcontainers-vs-comhra.md) for detailed explanation.

### 3. Reproducible Builds

Given identical inputs, the catalog must produce identical outputs:
- Same manifest → same artifacts
- Version pinning (semver + digests)
- Deterministic generation
- No hidden state or side effects

This ensures:
- Student environment parity
- Classroom reproducibility
- Audit compliance

### 4. Composable Architecture

Assets compose through well-defined interfaces:
- **Features** compose via `installsAfter` dependencies
- **Templates** combine features + images + services
- **Images** layer: dev-base → dev-web → presets
- **Services** provide sidecars (Redis, GUI, etc.)

No tight coupling - everything composes cleanly.

### 5. Adapter-Ready Design

While MVP focuses on government-funding path:
- Architecture supports future adapters (LMS, direct, etc.)
- No hard-coded platform assumptions
- Clean adapter interface points
- Extensible without refactoring

---

## Catalog Structure

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
│   ├── redis/
│   ├── webtop/
│   └── ...
└── docs/
    ├── architecture/      # ← You are here
    ├── mvp/              # Current MVP strategy
    └── archive/          # Historical documentation
```

---

## Design Patterns

### Feature Composition Pattern

Features are idempotent installers that compose via dependencies:

```json
{
  "id": "my-feature",
  "installsAfter": ["ghcr.io/airnub-labs/devcontainer-features/supabase-cli"]
}
```

Characteristics:
- Idempotent (safe to re-run)
- No long-running services
- Composable and reusable
- Spec-compliant

### Stack Pattern

"Stack" = Template with validated combination:
- Primary container (`dev`)
- Optional sidecars (Redis, GUI)
- Pre-configured services
- Proven, tested configuration

Example: `stack-nextjs-supabase-webtop`

### Manifest-Driven Generation

Lesson generation follows:
1. **Input:** Lesson manifest (YAML/JSON)
2. **Process:** Catalog generator transforms manifest
3. **Output:** DevContainer configuration + artifacts

Stateless, deterministic, reproducible.

---

## Integration Points

### With Codespaces
- DevContainer configuration compatibility
- Secrets management
- Port forwarding
- Lifecycle hooks (postCreate, postStart)

### With MCP (Model Context Protocol)
- Agent tooling integration
- Context management
- LLM-assisted workflows
- See [agents-mcp-contract.md](./agents-mcp-contract.md)

### With comhrá SaaS
- Manifest generation (comhrá → catalog)
- Environment provisioning
- Student onboarding workflows
- **No reverse dependency:** Catalog never calls comhrá

---

## Related Documentation

- **[MVP Strategy](../mvp/README.md)** - Current strategic direction
- **[Getting Started](../getting-started/README.md)** - Quick start guides
- **[Archive](../archive/README.md)** - Historical documentation

### External References

- [DevContainer Specification](https://containers.dev/implementors/spec/)
- [OCI Artifacts](https://github.com/opencontainers/artifacts)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

## Historical Context

This directory was populated in Phase 3 of documentation reorganization (November 2025) by consolidating and organizing core architectural documents:

**Consolidated:**
- CATALOG.md + CATALOG-ARCHITECTURE.md → [catalog-design.md](./catalog-design.md)

**Migrated:**
- SPEC-ALIGNMENT.md → [spec-alignment.md](./spec-alignment.md)
- docs/platform-architecture.md → [platform-architecture.md](./platform-architecture.md)
- docs/agents-mcp-contract.md → [agents-mcp-contract.md](./agents-mcp-contract.md)

**Superseded:**
Earlier workspace-centric approaches (Oct 28, 2024) archived in [docs/archive/2024-10-28/](../archive/2024-10-28/).

---

**Last Updated:** 2025-11-02 (Phase 3: Organize MVP & Core Docs)
