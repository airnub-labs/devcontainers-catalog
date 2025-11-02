# Vision

> Product vision, roadmap, and strategic direction

This directory contains vision documents, positioning, and long-term strategic plans for the devcontainers-catalog and platform.

---

## Platform Vision

### [SaaS Education Platform Vision](./saas-edu-platform-vision.md) ⭐
**Comprehensive platform vision for education at scale**

The definitive vision document covering:
- Why fast-start dev environments matter for education
- Source vs artifact mental model
- Classroom fast-start workflows
- Beyond "hello world" - full ecosystem support
- Lesson manifest approach
- Platform architecture vision

**Start here** to understand the overall product vision.

### [Comhrá-Devcontainers Integration Roadmap](./comhra-devcontainers-integration-roadmap.md)
**Integration strategy with comhrá SaaS platform**

Details the integration between:
- devcontainers-catalog (education-agnostic generator)
- comhrá (SaaS platform with education context)
- Adapter patterns and future extensibility

### [Positioning Brief](./positioning-brief.md)
**Market positioning and differentiation**

How the catalog positions in the market:
- Competitive landscape
- Unique value propositions
- Target audience and use cases

---

## Key Principles

### Education-Focused
- **Zero-setup classrooms** - Students start coding immediately
- **Reproducible environments** - Every student gets identical setup
- **Fast iteration** - Instructors update once, students pull instantly

### Stateless Generator
- **Education-agnostic catalog** - No classroom/course concepts
- **Pure functional** - Manifests in, artifacts out
- **No hidden state** - Reproducible builds

### Platform-Ready
- **Adapter architecture** - Extensible for LMS, direct, custom integrations
- **MVP-focused** - Current focus on government-funding path
- **Future-proof** - Clean boundaries for growth

---

## Roadmap Themes

### Current (MVP)
- Manifest-driven lesson generation
- GitHub Codespaces integration
- Core service fragments (Redis, Supabase, Kafka, Orchestrators)
- Prebuilt lesson images

### Near-term
- comhrá SaaS integration
- Enhanced MCP/agent workflows
- Additional service fragments
- Multi-LMS adapters

### Long-term
- Direct-to-student pathways
- Advanced observability
- Custom orchestration patterns
- Enterprise features

---

## Related Documentation

- **[MVP Strategy](../mvp/README.md)** - Current MVP implementation plans
- **[Architecture](../architecture/README.md)** - System design
- **[Separation of Concerns](../mvp/separation-of-concerns-devcontainers-vs-comhra.md)** - Critical principle

---

**Last Updated:** 2025-11-02 (Phase 5: Organize Remaining Docs)
