# Documentation Archive

> 📚 This directory preserves historical documentation that is no longer actively maintained.

**Last Updated:** YYYY-MM-DD

---

## Purpose

This archive serves several important purposes:

### Why Archive (Not Delete)?

✅ **Preserves institutional knowledge** - Understanding why decisions were made
✅ **Maintains git history** - Full commit history remains accessible
✅ **Provides historical context** - Shows evolution of the project
✅ **Enables future reference** - Archived docs can still be consulted
✅ **Documents decision rationale** - Why certain approaches were abandoned

### When Documents Are Archived

Documents are moved to this archive when they are:
- **Superseded** by newer documentation or approaches
- **Completed artifacts** like one-time reviews or checklists
- **Historical records** valuable for context but no longer current
- **Consolidated** into comprehensive documents elsewhere

**Important:** No documents are deleted. All archived files have explanatory header notes.

---

## Organization

Documents are organized by **archival date** to maintain clear historical timeline:

### 2024-10-28/

**Theme:** Older architectural patterns superseded by current MVP strategy

| Document | Original Date | Reason Archived | See Instead |
|----------|---------------|-----------------|-------------|
| `workspace-architecture-0.md` | 2025-10-28 | Superseded by MVP strategy | [docs/mvp/](../../mvp/) |
| `workspace-architecture-1.md` | 2025-10-28 | Superseded by MVP strategy | [docs/mvp/](../../mvp/) |
| `catalog-architecture.md` | 2025-10-28 | Consolidated | [docs/architecture/catalog-design.md](../../architecture/catalog-design.md) |
| `devcontainer-spec-alignment.md` | 2025-10-28 | Superseded (marked LEGACY) | [docs/architecture/spec-alignment.md](../../architecture/spec-alignment.md) |

**Context:** These documents from late October 2024 described earlier approaches to workspace organization and catalog architecture. They were superseded when the team adopted the current MVP-focused, education-agnostic strategy detailed in `docs/mvp/`.

### 2024-10-30/

**Theme:** One-time artifacts from initial repository setup and review

| Document | Original Date | Reason Archived | Status |
|----------|---------------|-----------------|--------|
| `varify-checklist.md` | 2025-10-30 | Completed verification | ✅ All checks passed |
| `review-and-scores.md` | 2025-10-30 | Historical review | 📊 Score: 8.2/10 (Very Good) |

**Context:** These documents were created during the initial repository hardening and quality assessment phase. The verification checklist was completed successfully, and the comprehensive review provides valuable baseline metrics (8.2/10 score indicating production readiness).

### 2024-10-31/

**Theme:** Completed improvement plans

| Document | Original Date | Reason Archived | Status |
|----------|---------------|-----------------|--------|
| `workflow-improvement-plan.md` | 2025-10-31 | Implementation complete | ✅ Improvements applied |

**Context:** This workflow optimization plan was created to improve GitHub Actions efficiency. After implementation, it was archived to preserve the decision-making process and approach.

---

## How to Use This Archive

### For Contributors

If you need information from archived docs:

1. **Check current documentation first** - Most content has been migrated or consolidated
2. **Read the archive header note** - Every archived doc explains what superseded it
3. **Follow the "See Instead" links** - Direct you to current information
4. **Use for context only** - Don't link to archived docs in new documentation

### For Maintainers

When archiving new documents:

1. **Add appropriate header note** - Use templates from `scripts/archive-header-templates.md`
2. **Use git mv** - Preserves full commit history
3. **Update this README** - Add entry in appropriate date section
4. **Verify links work** - Test relative paths from archive location

### Understanding Archive Notes

Each archived document has a header note in one of these formats:

- ⚠️ **ARCHIVED DOCUMENT** - Superseded or consolidated
- 📚 **HISTORICAL RECORD** - Valuable historical context
- ✅ **COMPLETED ARTIFACT** - One-time task completed

---

## Archive Statistics

**Total Archived Documents:** [To be updated as docs are archived]

**Documents by Type:**
- Superseded architectural docs: X
- Completed artifacts: X
- Historical records: X
- Consolidated docs: X

**Timeline:**
- Oct 28, 2024: X documents
- Oct 30, 2024: X documents
- Oct 31, 2024: X documents

---

## Related Documentation

- [Documentation Hub](../README.md) - Start here for current documentation
- [Architecture Overview](../architecture/README.md) - Current architectural thinking
- [MVP Strategy](../mvp/README.md) - Current strategic direction
- [Contributing Guide](../../CONTRIBUTING.md) - How to contribute

---

## Accessing Archived Content

### Via Git History

All archived documents maintain their full git history:

```bash
# View history of an archived document
git log --follow docs/archive/2024-10-28/workspace-architecture-0.md

# View specific version
git show <commit-hash>:docs/workspace-architecture-0.md
```

### Via Web Interface

Browse archived documents on GitHub:
- Navigate to `docs/archive/`
- Select date folder
- Read header note for context and links to current docs

---

## Questions?

If you have questions about archived documentation or believe content should be restored:

1. Open an issue describing what information you need
2. Reference the archived document
3. Explain why current documentation doesn't cover the topic
4. Tag maintainers for review

---

**Note:** This archive structure was created as part of the documentation reorganization (Phase 0: Preparation). For details, see `DOCUMENTATION_REORGANIZATION_PLAN.md`.
