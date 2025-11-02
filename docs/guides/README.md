# Guides

> How-to guides for common tasks and workflows

This directory contains practical guides for working with the devcontainers-catalog, including migration guides, generator usage, CLI tools, and lesson workflows.

---

## Migration Guides

### [Migration Guide](./migration.md)
**General migration guide for catalog updates**

Covers:
- Migrating from legacy templates to current structure
- Feature migration paths
- Breaking changes and upgrade strategies

### [Migration Naming Guide](./migration-naming.md)
**Naming conventions and migration strategies**

Details:
- Naming convention changes
- Slug generation rules
- OCI coordinate migrations

---

## Tool & Workflow Guides

### [CLI (airnub-devc)](./cli-devc.md)
**airnub-devc CLI tool usage**

The catalog CLI for:
- Validating lesson manifests
- Generating devcontainer configurations
- Testing templates and presets

### [Generator](./generator.md)
**Lesson generator tool**

How to use the lesson generator:
- Manifest-driven generation
- Preset and scaffold creation
- Service fragment integration

### [Lesson Flow](./lesson-flow.md)
**End-to-end lesson creation workflow**

Complete workflow:
- From manifest to published image
- Student onboarding process
- Classroom deployment patterns

### [Manifest Contract](./manifest-contract.md)
**Lesson manifest specification**

Defines the manifest contract:
- Required and optional fields
- Service declarations
- Extension configuration
- Variable substitution

---

## Guide Categories

### For Instructors
- [Classroom Quick Start](../getting-started/classroom-quick-start.md) - Fast-start classrooms
- [Lesson Flow](./lesson-flow.md) - Complete lesson creation
- [Generator](./generator.md) - Using the generator tool

### For Contributors
- [Development](../contributing/development.md) - Development setup
- [Migration Guides](./migration.md) - Upgrade strategies
- [CLI Reference](./cli-devc.md) - Command-line tools

### For Platform Integrators
- [Manifest Contract](./manifest-contract.md) - Integration spec
- [Lesson Flow](./lesson-flow.md) - End-to-end process

---

## Related Documentation

- **[Getting Started](../getting-started/README.md)** - Quick start guides
- **[Reference](../reference/README.md)** - API and schema references
- **[Architecture](../architecture/README.md)** - System design
- **[MVP Strategy](../mvp/README.md)** - Current strategic direction

---

**Last Updated:** 2025-11-02 (Phase 5: Organize Remaining Docs)
