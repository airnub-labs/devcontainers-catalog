# MVP Strategy & Launch Plans

> Current strategic direction and implementation plans for the devcontainers-catalog MVP

This directory contains the current MVP strategy, architectural decisions, and implementation guidance for the devcontainers-catalog project. These documents reflect the education-agnostic, stateless generation approach that superseded earlier workspace-centric patterns.

---

## Core Strategy Documents

### [MVP Launch Plan](./mvp-launch-plan.md)
**Primary launch strategy and milestones**

Comprehensive plan for the MVP launch including:
- Launch phases and timeline
- Key deliverables and success metrics
- Risk mitigation strategies
- Go-to-market approach

### [Separation of Concerns: Devcontainers vs Comhrá](./separation-of-concerns-devcontainers-vs-comhra.md)
**Critical architectural principle** ⭐

Defines the fundamental separation between:
- **devcontainers-catalog:** Education-agnostic, stateless generator/library
- **comhrá (SaaS):** All persistence, education context, and platform logic

**This principle must never be violated.** The catalog remains a pure generator.

### [Dev Environments Strategy](./dev-environments-strategy.md)
**Technical strategy for development environments**

Details the approach to:
- Local development workflows
- Codespaces integration
- Environment parity (local/remote)
- Developer experience optimization

---

## Implementation Plans

### [Lesson Scaffolding Enablement Plan](./lesson-scaffolding-enablement-plan.md)
Implementation plan for lesson generation features including:
- Manifest-driven lesson creation
- Template scaffolding workflows
- Integration with catalog tooling

### [Experimental Services Policy](./experimental-services-policy.md)
Guidelines for introducing and graduating experimental services:
- Criteria for experimental vs stable
- Graduation requirements
- Deprecation process

---

## Coding Agent Prompts

LLM-assisted development prompts for key implementation tasks:

| Prompt | Purpose |
|--------|---------|
| [SDK Codespaces Adapter](./coding-agent-prompt-sdk-codespaces-adapter.md) | Implement SDK adapter for Codespaces integration |
| [Implement MVP](./coding-agent-prompt-implement-mvp.md) | Core MVP implementation guidance |
| [Scaffold Manifest Package](./coding-agent-prompt-scaffold-manifest-package.md) | Build manifest scaffolding functionality |
| [Codespaces Adapter Stubs](./coding-agent-prompt-codespaces-adapter-stubs-and-patches.md) | Create adapter stubs and patches |
| [Adapter Complete + noVNC](./coding-agent-prompt-codespaces-adapter-complete-and-novnc-observability.md) | Complete adapter with noVNC observability |

**Note:** These prompts provide context and conventions for AI-assisted development.

---

## Key Principles

### Education-Agnostic Design
The catalog must remain **completely education-agnostic**:
- No classroom/course/student concepts in catalog code
- No persistence or user state
- Pure functional generation from manifests

All education-specific logic lives in **comhrá** (the SaaS platform).

### Stateless Generation
The catalog is a **stateless library**:
- Manifests in → artifacts out
- No side effects
- Reproducible builds
- No hidden state

### Adapter-Ready Architecture
While MVP focuses on government-funding requirements:
- Architecture supports future adapters (LMS, direct, etc.)
- No hard-coded platform assumptions
- Clean adapter interface points

---

## Related Documentation

- **[Architecture Overview](../architecture/README.md)** - System architecture and design
- **[Documentation Archive](../archive/README.md)** - Historical superseded patterns
- **[Getting Started](../getting-started/README.md)** - Quick start guides

---

## Historical Context

This directory was created in Phase 3 of the documentation reorganization (November 2025) by promoting content from `docs/mvp-launch/` to `docs/mvp/` as the **current strategic direction**.

Earlier workspace-centric approaches (Oct 28, 2024) were archived in [docs/archive/2024-10-28/](../archive/2024-10-28/) as they were superseded by this education-agnostic, stateless generation model.

For the evolution of architectural thinking, see:
- [Archive: 2024-10-28](../archive/2024-10-28/) - Superseded workspace patterns
- [DOCUMENTATION_REORGANIZATION_PLAN.md](../../DOCUMENTATION_REORGANIZATION_PLAN.md) - Full reorganization plan

---

**Last Updated:** 2025-11-02 (Phase 3: Organize MVP & Core Docs)
