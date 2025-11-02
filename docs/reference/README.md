# Reference

> API references, schemas, and technical specifications

This directory contains technical reference documentation including services, stacks, and schema specifications.

---

## Service & Stack References

### [Services Reference](./services.md)
**Available services and compose fragments**

Complete reference for:
- Redis configuration
- Supabase local stack
- Kafka/KRaft setup
- Orchestrators (Airflow, Prefect, Dagster, Temporal)
- Health check endpoints

### [Stacks Reference](./stacks.md)
**Stack templates and combinations**

Pre-configured stacks:
- Web development stacks
- Next.js + Supabase combinations
- Browser-enabled stacks (Neko, Kasm)
- Full-featured classroom stacks

### [Stacks & Orchestrators](./stacks-orchestrators.md)
**Stack and orchestrator matrix**

Detailed combinations:
- Service fragment composition
- Orchestrator integration patterns
- Port mappings and networking
- Resource requirements

---

## Technical Specifications

### [Versioning Strategy](./versioning.md)
**Semantic versioning for features, templates, and images**

Versioning practices:
- Feature semantic versioning
- Template and stack versioning
- Image tagging strategy (semver, major, latest)
- Digest pinning for production
- Release artifact table

### Lesson Manifest Schema
*(To be created in Phase 6)*

JSON Schema specification for lesson manifests.

### API Reference
*(To be created in Phase 6)*

MCP API methods and integration points.

---

## Quick Reference

**Services Available:**
- Redis (cache/queue)
- Supabase (local development stack)
- Kafka + KRaft (streaming)
- Airflow (workflow orchestration)
- Prefect (data orchestration)
- Dagster (data orchestration)
- Temporal (workflow engine)
- Webtop/noVNC (GUI desktops)

**Stack Categories:**
- Simple: Node + pnpm, Python
- Full: Node + pnpm + Python + Jupyter
- Web: + Chrome CDP + Supabase
- Classroom: + GUI desktop + policy management

---

## Related Documentation

- **[Architecture](../architecture/README.md)** - System design and patterns
- **[Guides](../guides/README.md)** - How-to guides
- **[Getting Started](../getting-started/README.md)** - Quick starts

---

**Last Updated:** 2025-11-02 (Phase 5: Organize Remaining Docs)
