# Documentation Reorganization Plan - COMPREHENSIVE & PHASED

**Date:** 2025-11-01
**Status:** Final - Ready for Implementation
**Principle:** NEVER DELETE - Archive with header notes
**Goal:** Organize 50+ documentation files without losing critical information

---

## Executive Summary

After comprehensive review of all 50+ documentation files, this plan provides a **safe, phased approach** to reorganization that:

✅ **Preserves ALL existing content** (no deletions)
✅ **Archives deprecated docs** with clear header notes explaining supersession
✅ **Respects timeline**: Oct 30-31, Nov 1 docs are CURRENT; Oct 28 docs may be legacy
✅ **Maintains critical information**: MVP strategy, separation of concerns, all guides
✅ **Provides rollback capability** at each phase

**Total Documentation:**
- Root level: 10 files (includes 2 new plan docs)
- docs/: 43 files (core docs + mvp-launch/ + snippets/)
- Total: 53 markdown files

**Estimated Effort:** 6-8 weeks across 6 phases
**Risk Level:** LOW (all changes are moves + header additions, no deletions)

---

## Complete Documentation Inventory & Analysis

### By Timeline (Source of Truth)

#### 📍 MOST RECENT (Nov 1, 2025)
```
docs/sidecars-health.md (788 words) ⭐ MOST RECENT operational doc
docs/mvp-launch/coding-agent-prompt-sdk-codespaces-adapter.md (1250 words)
```

#### 📍 CURRENT STRATEGY (Oct 30-31, 2025)
```
docs/mvp-launch/* (11 files, 9,055 total words) ⭐ CURRENT architectural direction
  - mvp-launch-plan.md (960 words)
  - separation-of-concerns-devcontainers-vs-comhra.md (650 words) ⭐ CRITICAL
  - dev-environments-strategy.md (1466 words)
  - experimental-services-policy.md (1157 words)
  - lesson-scaffolding-enablement-plan.md (1410 words)
  - 5x coding-agent-prompt-*.md (5,908 words total)

docs/services.md (576 words) - Oct 31
docs/cli-devc.md (754 words) - Oct 31
docs/STACKS.md (136 words) - Oct 31
docs/classroom-fast-start.md (550 words) - Oct 31
docs/manifest-contract.md (138 words) - Oct 31
docs/saas-edu-platform-vision.md (2748 words) - Oct 31
docs/comhra-devcontainers-integration-roadmap.md (937 words) - Oct 31
docs/positioning-brief.md (877 words) - Oct 31

README.md (1308 words) - Oct 31
WORKFLOW_IMPROVEMENT_PLAN.md (1698 words) - Oct 31
```

#### 📍 RECENT GUIDES (Oct 30, 2025)
```
docs/quick-start-fast-classroom.md (1117 words) - Oct 30
docs/platform-architecture.md (455 words) - Oct 30
docs/generator.md (306 words) - Oct 30
docs/lesson-flow.md (409 words) - Oct 30
docs/agents-mcp-contract.md (156 words) - Oct 30
docs/stacks-orchestrators.md (339 words) - Oct 30
AGENTS.md (970 words) - Oct 30
CONTRIBUTING.md (425 words) - Oct 30
CODE_OF_CONDUCT.md (356 words) - Oct 30
VARIFY.md (168 words) - Oct 30
REVIEW_AND_SCORES.md (2742 words) - Oct 30
```

#### 📍 OLDER DOCS (Oct 28-29, 2025)
```
docs/CATALOG-ARCHITECTURE.md (133 words) - Oct 28 ⚠️ Overlaps CATALOG.md
docs/workspace-architecture-0.md (864 words) - Oct 28 ⚠️ Older pattern
docs/workspace-architecture-1.md (179 words) - Oct 28 ⚠️ Older pattern
docs/devcontainer-spec-alignment.md (159 words) - Oct 28 ⚠️ Marked LEGACY
docs/SPEC-ALIGNMENT.md (213 words) - Oct 28
docs/docker-containers.md (313 words) - Oct 28
docs/MAINTAINERS.md (111 words) - Oct 28
docs/MIGRATION.md (200 words) - Oct 28
docs/MIGRATION-NAMING.md (196 words) - Oct 28
docs/SECURITY.md (106 words) - Oct 28
VERSIONING.md (213 words) - Oct 28

docs/CATALOG.md (478 words) - Oct 29
docs/DEVELOPMENT.md (308 words) - Oct 29
```

---

## Critical Information Preservation Analysis

### ✅ CONFIRMED DUPLICATES (Safe to Consolidate)

| Primary (Keep) | Duplicate/Overlap | Handling |
|---------------|-------------------|----------|
| `classroom-fast-start.md` (Oct 31, 550w) | `quick-start-fast-classroom.md` (Oct 30, 1117w) | Merge into unified guide; older has more detail |
| `CATALOG.md` (Oct 29) | `CATALOG-ARCHITECTURE.md` (Oct 28) | Consolidate; latter is brief overlap |
| `SPEC-ALIGNMENT.md` (Oct 28) | `devcontainer-spec-alignment.md` (Oct 28, LEGACY) | Archive legacy; keep current |

### ✅ UNIQUE VALUABLE CONTENT (Must Preserve)

| Document | Words | Value | Destination |
|----------|-------|-------|-------------|
| `mvp-launch/*` (all 11 files) | 9,055 | ⭐⭐⭐⭐⭐ CURRENT strategy | Promote to `docs/mvp/` |
| `separation-of-concerns.md` | 650 | ⭐⭐⭐⭐⭐ CRITICAL principle | Also link from `architecture/` |
| `sidecars-health.md` | 788 | ⭐⭐⭐⭐⭐ Most recent | `operations/` or `reference/` |
| `positioning-brief.md` | 877 | ⭐⭐⭐⭐ Product positioning | `vision/` |
| `comhra-devcontainers-integration-roadmap.md` | 937 | ⭐⭐⭐⭐ Integration strategy | `vision/` |
| `docker-containers.md` | 313 | ⭐⭐⭐ Container layers | `architecture/` |
| `stacks-orchestrators.md` | 339 | ⭐⭐⭐ Orchestrator guide | `guides/` |
| `lesson-flow.md` | 409 | ⭐⭐⭐ Manifest flow | `guides/` |
| `REVIEW_AND_SCORES.md` | 2742 | ⭐⭐⭐ Historical 8.2/10 review | Archive (valuable record) |

### ⚠️ TO ARCHIVE (Not Delete!)

| Document | Reason | Archive Note |
|----------|--------|--------------|
| `workspace-architecture-0.md` | Oct 28, older meta-workspace pattern | Superseded by current MVP strategy |
| `workspace-architecture-1.md` | Oct 28, older variant system | Superseded by current MVP strategy |
| `CATALOG-ARCHITECTURE.md` | Oct 28, brief, overlaps CATALOG.md | Consolidated into CATALOG.md |
| `devcontainer-spec-alignment.md` | Oct 28, already marked LEGACY | Superseded by SPEC-ALIGNMENT.md |
| `VARIFY.md` | One-time verification checklist | Completed verification artifact |
| `REVIEW_AND_SCORES.md` | One-time comprehensive review | Historical record (excellent 8.2/10!) |
| `WORKFLOW_IMPROVEMENT_PLAN.md` | Workflow optimization plan | Implementation complete/archived |

---

## Proposed Final Structure

```
/
├── README.md                                   # KEEP - Excellent overview
├── AGENTS.md                                   # KEEP - Critical guardrails
├── VERSIONING.md                               # KEEP - Versioning strategy
├── CONTRIBUTING.md                             # KEEP - Contributor guide
├── CHANGELOG.md                                # NEW - Version history
├── CODE_OF_CONDUCT.md                          # KEEP - Community standards
├── SECURITY.md                                 # MOVE from docs/ (GitHub convention)
├── LICENSE                                     # KEEP - Existing
│
├── docs/
│   ├── README.md                               # ENHANCE - Documentation hub
│   │
│   ├── getting-started/                        # User quick starts
│   │   ├── README.md                           # Quick links
│   │   ├── fast-classroom.md                   # MERGE classroom-fast-start + quick-start
│   │   ├── using-cli.md                        # Based on cli-devc.md
│   │   └── manifest-authoring.md               # NEW - Manifest guide
│   │
│   ├── guides/                                 # How-to guides
│   │   ├── README.md
│   │   ├── cli-devc.md                         # MOVE from docs/ (Oct 31)
│   │   ├── generator.md                        # MOVE from docs/ (Oct 30)
│   │   ├── lesson-flow.md                      # MOVE from docs/ (Oct 30)
│   │   ├── services.md                         # MOVE from docs/ (Oct 31)
│   │   └── stacks-orchestrators.md             # MOVE from docs/ (Oct 30)
│   │
│   ├── architecture/                           # System design
│   │   ├── README.md                           # Architecture overview
│   │   ├── separation-of-concerns.md           # ⭐ CRITICAL - from mvp-launch/
│   │   ├── catalog-design.md                   # MERGE CATALOG.md + CATALOG-ARCHITECTURE.md
│   │   ├── dev-environments-strategy.md        # MOVE from mvp-launch/ (Oct 31)
│   │   ├── platform-architecture.md            # MOVE from docs/ (Oct 30)
│   │   ├── spec-alignment.md                   # RENAME from SPEC-ALIGNMENT.md
│   │   └── docker-containers.md                # MOVE from docs/ (Oct 28)
│   │
│   ├── reference/                              # API & catalog reference
│   │   ├── README.md
│   │   ├── catalog-matrix.md                   # From CATALOG.md (reference portion)
│   │   ├── manifest-schema.md                  # RENAME from manifest-contract.md
│   │   ├── api-reference.md                    # EXPAND from agents-mcp-contract.md
│   │   ├── sidecars-health.md                  # MOVE from docs/ (Nov 1 - MOST RECENT!)
│   │   ├── stacks-reference.md                 # RENAME from STACKS.md
│   │   └── versioning.md                       # MOVE from root VERSIONING.md
│   │
│   ├── contributing/                           # Developer docs
│   │   ├── README.md
│   │   ├── development.md                      # RENAME from DEVELOPMENT.md
│   │   ├── maintainers.md                      # RENAME from MAINTAINERS.md
│   │   ├── migration-guide.md                  # MERGE MIGRATION.md + MIGRATION-NAMING.md
│   │   └── testing.md                          # NEW - Testing guidelines
│   │
│   ├── mvp/                                    # ⭐ CURRENT STRATEGIC DIRECTION
│   │   ├── README.md                           # Explain MVP strategy and phases
│   │   ├── mvp-launch-plan.md                  # MOVE from mvp-launch/
│   │   ├── experimental-services-policy.md     # MOVE from mvp-launch/
│   │   ├── lesson-scaffolding-enablement-plan.md # MOVE from mvp-launch/
│   │   └── coding-prompts/                     # Organize agent prompts
│   │       ├── README.md                       # Explain prompt structure
│   │       ├── sdk-codespaces-adapter.md       # MOVE from mvp-launch/
│   │       ├── implement-mvp.md                # MOVE from mvp-launch/
│   │       ├── scaffold-manifest-package.md    # MOVE from mvp-launch/
│   │       ├── codespaces-adapter-stubs.md     # MOVE from mvp-launch/
│   │       └── codespaces-adapter-complete.md  # MOVE from mvp-launch/
│   │
│   ├── vision/                                 # Product vision & strategy
│   │   ├── README.md
│   │   ├── saas-platform-vision.md             # MOVE from docs/ (Oct 31)
│   │   ├── positioning.md                      # RENAME from positioning-brief.md
│   │   └── integration-roadmap.md              # RENAME from comhra-devcontainers-integration-roadmap.md
│   │
│   ├── operations/                             # Operational docs
│   │   ├── README.md
│   │   └── troubleshooting.md                  # NEW - Common issues & solutions
│   │
│   ├── snippets/                               # ✅ KEEP AS-IS
│   │   ├── README.md
│   │   ├── workspace-readme.md
│   │   └── lesson-readme.md
│   │
│   └── archive/                                # Deprecated & historical docs
│       ├── README.md                           # Explains archive purpose
│       ├── 2024-10-28/                         # Organize by date
│       │   ├── workspace-architecture-0.md     # + HEADER NOTE
│       │   ├── workspace-architecture-1.md     # + HEADER NOTE
│       │   ├── catalog-architecture.md         # + HEADER NOTE (was CATALOG-ARCHITECTURE.md)
│       │   └── devcontainer-spec-alignment.md  # + HEADER NOTE (already marked legacy)
│       ├── 2024-10-30/                         # One-time artifacts
│       │   ├── review-and-scores.md            # + HEADER NOTE (8.2/10 review!)
│       │   └── varify-checklist.md             # + HEADER NOTE (was VARIFY.md)
│       └── 2024-10-31/
│           └── workflow-improvement-plan.md    # + HEADER NOTE
```

---

## Phase-Based Implementation Plan

### PHASE 0: Preparation & Safety (Week 1 - 4-6 hours)

**Goal:** Create safety net and validation tools

**Tasks:**
- [ ] **P0.1** Create backup branch: `git checkout -b backup-before-doc-reorg`
- [ ] **P0.2** Document current state: `find docs -name "*.md" | sort > docs-inventory-before.txt`
- [ ] **P0.3** Create link validation script (check all internal links)
- [ ] **P0.4** Create header template for archived docs
- [ ] **P0.5** Create archive README explaining structure
- [ ] **P0.6** Test header addition on one file (trial run)
- [ ] **P0.7** Get team review of this plan

**Validation:**
- ✅ Backup branch exists
- ✅ Inventory file created
- ✅ Link checker works
- ✅ Header template ready
- ✅ Team approved plan

**Rollback:** `git checkout main; git branch -D backup-before-doc-reorg`

---

### PHASE 1: Create Structure (Week 2 - 6-8 hours)

**Goal:** Create new directory structure WITHOUT moving files yet

**Tasks:**
- [ ] **P1.1** Create `docs/getting-started/`
- [ ] **P1.2** Create `docs/guides/`
- [ ] **P1.3** Create `docs/architecture/`
- [ ] **P1.4** Create `docs/reference/`
- [ ] **P1.5** Create `docs/contributing/`
- [ ] **P1.6** Create `docs/mvp/coding-prompts/`
- [ ] **P1.7** Create `docs/vision/`
- [ ] **P1.8** Create `docs/operations/`
- [ ] **P1.9** Create `docs/archive/2024-10-28/`
- [ ] **P1.10** Create `docs/archive/2024-10-30/`
- [ ] **P1.11** Create `docs/archive/2024-10-31/`
- [ ] **P1.12** Create placeholder README.md in each new directory

**Validation:**
- ✅ All directories created
- ✅ Each has placeholder README.md
- ✅ No files moved yet (structure only)
- ✅ Git status shows only new files

**Rollback:** `git reset --hard` (no files moved, only additions)

---

### PHASE 2: Archive Legacy Docs (Week 3 - 8-10 hours)

**Goal:** Move deprecated docs to archive WITH header notes (NO DELETIONS)

**Archive Header Template:**
```markdown
> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-0X
> **Reason:** [Superseded by / Completed artifact / Historical record]
> **See Instead:** [Link to current documentation]
>
> This document is preserved for historical reference but is no longer maintained.
> For current information, see the link above.

---
[Original content follows]
```

**Tasks:**

**P2.1 Archive workspace-architecture docs:**
- [ ] Add header note to `docs/workspace-architecture-0.md`
- [ ] `git mv docs/workspace-architecture-0.md docs/archive/2024-10-28/workspace-architecture-0.md`
- [ ] Add header note to `docs/workspace-architecture-1.md`
- [ ] `git mv docs/workspace-architecture-1.md docs/archive/2024-10-28/workspace-architecture-1.md`
- [ ] Update archive README explaining supersession

**P2.2 Archive CATALOG-ARCHITECTURE:**
- [ ] Add header note to `docs/CATALOG-ARCHITECTURE.md`
- [ ] `git mv docs/CATALOG-ARCHITECTURE.md docs/archive/2024-10-28/catalog-architecture.md`
- [ ] Note: "Consolidated into docs/architecture/catalog-design.md"

**P2.3 Archive devcontainer-spec-alignment:**
- [ ] Add header note to `docs/devcontainer-spec-alignment.md` (already marked legacy)
- [ ] `git mv docs/devcontainer-spec-alignment.md docs/archive/2024-10-28/devcontainer-spec-alignment.md`
- [ ] Note: "Superseded by docs/architecture/spec-alignment.md"

**P2.4 Archive one-time artifacts:**
- [ ] Add header note to `VARIFY.md`
- [ ] `git mv VARIFY.md docs/archive/2024-10-30/varify-checklist.md`
- [ ] Note: "Completed verification checklist from Oct 30, 2024"

- [ ] Add header note to `REVIEW_AND_SCORES.md`
- [ ] `git mv REVIEW_AND_SCORES.md docs/archive/2024-10-30/review-and-scores.md`
- [ ] Note: "Historical comprehensive review (excellent 8.2/10 score!)"

- [ ] Add header note to `WORKFLOW_IMPROVEMENT_PLAN.md`
- [ ] `git mv WORKFLOW_IMPROVEMENT_PLAN.md docs/archive/2024-10-31/workflow-improvement-plan.md`
- [ ] Note: "Workflow optimization plan - implementation complete"

**P2.5 Create archive/README.md:**
```markdown
# Documentation Archive

This directory preserves historical documentation that is no longer actively maintained.

## Why Archive (Not Delete)?

- Preserves institutional knowledge
- Maintains git history
- Provides context for decisions
- Enables future reference

## Organization

Documents are organized by the date they were archived:

### 2024-10-28/
Older architectural patterns superseded by current MVP strategy:
- `workspace-architecture-0.md` - Meta-workspace pattern (superseded)
- `workspace-architecture-1.md` - Variant system (superseded)
- `catalog-architecture.md` - Brief architecture (consolidated into catalog-design.md)
- `devcontainer-spec-alignment.md` - Legacy spec doc (superseded by spec-alignment.md)

### 2024-10-30/
One-time artifacts from initial repository setup:
- `varify-checklist.md` - Verification checklist (completed)
- `review-and-scores.md` - Comprehensive review (8.2/10 score!)

### 2024-10-31/
Completed improvement plans:
- `workflow-improvement-plan.md` - Workflow optimization (implemented)

## Accessing Archived Docs

All archived documents have a header note explaining:
1. Why they were archived
2. What superseded them (if applicable)
3. Where to find current information

## Note for Contributors

If you need information from archived docs, please:
1. Check if current documentation covers the topic
2. Reference the archived doc if needed, but don't link to it as primary source
3. Consider if archived content should be incorporated into current docs
```

**Validation:**
- ✅ All archived files have header notes
- ✅ Header notes include reason and replacement links
- ✅ archive/README.md explains organization
- ✅ `git status` shows only moves (no deletions)
- ✅ Run link checker (some links may now be broken - expected)

**Rollback:** `git reset --hard HEAD~[number of commits]`

---

### PHASE 3: Organize MVP & Core Docs (Week 4 - 10-12 hours)

**Goal:** Move current strategic docs to appropriate locations

**Tasks:**

**P3.1 Promote mvp-launch/ to mvp/:**
- [ ] `git mv docs/mvp-launch/README.md docs/mvp/README.md`
- [ ] `git mv docs/mvp-launch/mvp-launch-plan.md docs/mvp/mvp-launch-plan.md`
- [ ] `git mv docs/mvp-launch/experimental-services-policy.md docs/mvp/experimental-services-policy.md`
- [ ] `git mv docs/mvp-launch/lesson-scaffolding-enablement-plan.md docs/mvp/lesson-scaffolding-enablement-plan.md`

**P3.2 Organize coding prompts:**
- [ ] Create `docs/mvp/coding-prompts/README.md`
- [ ] `git mv docs/mvp-launch/coding-agent-prompt-sdk-codespaces-adapter.md docs/mvp/coding-prompts/sdk-codespaces-adapter.md`
- [ ] `git mv docs/mvp-launch/coding-agent-prompt-implement-mvp.md docs/mvp/coding-prompts/implement-mvp.md`
- [ ] `git mv docs/mvp-launch/coding-agent-prompt-scaffold-manifest-package.md docs/mvp/coding-prompts/scaffold-manifest-package.md`
- [ ] `git mv docs/mvp-launch/coding-agent-prompt-codespaces-adapter-stubs-and-patches.md docs/mvp/coding-prompts/codespaces-adapter-stubs.md`
- [ ] `git mv docs/mvp-launch/coding-agent-prompt-codespaces-adapter-complete-and-novnc-observability.md docs/mvp/coding-prompts/codespaces-adapter-complete.md`

**P3.3 Move key architecture docs:**
- [ ] `git mv docs/mvp-launch/separation-of-concerns-devcontainers-vs-comhra.md docs/architecture/separation-of-concerns.md`
- [ ] `git mv docs/mvp-launch/dev-environments-strategy.md docs/architecture/dev-environments-strategy.md`
- [ ] `git mv docs/platform-architecture.md docs/architecture/platform-architecture.md`
- [ ] `git mv docs/docker-containers.md docs/architecture/docker-containers.md`

**P3.4 Update mvp/README.md:**
Create comprehensive README explaining MVP structure and linking to architecture docs

**P3.5 Remove empty mvp-launch/ directory:**
- [ ] `rmdir docs/mvp-launch` (should be empty after moves)

**Validation:**
- ✅ All mvp-launch/ files moved to mvp/
- ✅ Coding prompts organized in subdirectory
- ✅ Key architecture docs in architecture/
- ✅ mvp/README.md created
- ✅ No broken internal links within moved files

**Rollback:** `git reset --hard HEAD~[number of commits]`

---

### PHASE 4: Consolidate Duplicates (Week 5 - 12-15 hours)

**Goal:** Merge duplicate content without losing information

**Tasks:**

**P4.1 Consolidate Quick Starts:**
- [ ] Read `docs/quick-start-fast-classroom.md` (1117 words, Oct 30)
- [ ] Read `docs/classroom-fast-start.md` (550 words, Oct 31)
- [ ] Create `docs/getting-started/fast-classroom.md` merging both
- [ ] Ensure all unique content from both files is preserved
- [ ] Add header notes to originals pointing to new location
- [ ] `git mv docs/quick-start-fast-classroom.md docs/archive/2024-10-30/quick-start-fast-classroom.md`
- [ ] `git mv docs/classroom-fast-start.md docs/archive/2024-10-31/classroom-fast-start.md`
- [ ] Note: "Consolidated into docs/getting-started/fast-classroom.md"

**P4.2 Consolidate Catalog Docs:**
- [ ] Read `docs/CATALOG.md` (478 words)
- [ ] Read `docs/archive/2024-10-28/catalog-architecture.md` (133 words, archived)
- [ ] Create `docs/architecture/catalog-design.md` (architecture/design focus)
- [ ] Create `docs/reference/catalog-matrix.md` (feature/template/image matrix)
- [ ] Split content: design principles → architecture/, reference data → reference/
- [ ] Add header note to `docs/CATALOG.md` explaining split
- [ ] Keep `docs/CATALOG.md` as redirect/index with links to both new docs

**P4.3 Spec Alignment:**
- [ ] `git mv docs/SPEC-ALIGNMENT.md docs/architecture/spec-alignment.md`
- [ ] Verify archived `devcontainer-spec-alignment.md` already has redirect note

**P4.4 Migration Docs:**
- [ ] Read `docs/MIGRATION.md` (200 words)
- [ ] Read `docs/MIGRATION-NAMING.md` (196 words)
- [ ] Create `docs/contributing/migration-guide.md` merging both
- [ ] Add header notes to originals pointing to new doc
- [ ] Move to archive with notes

**Validation:**
- ✅ All consolidated docs preserve all unique information
- ✅ Original docs have header notes
- ✅ New consolidated docs are complete
- ✅ Side-by-side comparison confirms no lost content
- ✅ Run link checker

**Rollback:** `git reset --hard HEAD~[number of commits]`

---

### PHASE 5: Organize Remaining Docs (Week 6 - 10-12 hours)

**Goal:** Move all remaining docs to final locations

**Tasks:**

**P5.1 Move to guides/:**
- [ ] `git mv docs/cli-devc.md docs/guides/cli-devc.md`
- [ ] `git mv docs/generator.md docs/guides/generator.md`
- [ ] `git mv docs/lesson-flow.md docs/guides/lesson-flow.md`
- [ ] `git mv docs/services.md docs/guides/services.md`
- [ ] `git mv docs/stacks-orchestrators.md docs/guides/stacks-orchestrators.md`

**P5.2 Move to reference/:**
- [ ] `git mv docs/manifest-contract.md docs/reference/manifest-schema.md`
- [ ] `git mv docs/STACKS.md docs/reference/stacks-reference.md`
- [ ] `git mv docs/sidecars-health.md docs/reference/sidecars-health.md`
- [ ] `git mv VERSIONING.md docs/reference/versioning.md`

**P5.3 Expand API reference:**
- [ ] Read `docs/agents-mcp-contract.md` (156 words)
- [ ] Create expanded `docs/reference/api-reference.md`
- [ ] Include all content from agents-mcp-contract.md
- [ ] Add detailed examples, error codes, parameters
- [ ] Move original to archive with redirect note

**P5.4 Move to vision/:**
- [ ] `git mv docs/saas-edu-platform-vision.md docs/vision/saas-platform-vision.md`
- [ ] `git mv docs/positioning-brief.md docs/vision/positioning.md`
- [ ] `git mv docs/comhra-devcontainers-integration-roadmap.md docs/vision/integration-roadmap.md`

**P5.5 Move to contributing/:**
- [ ] `git mv docs/DEVELOPMENT.md docs/contributing/development.md`
- [ ] `git mv docs/MAINTAINERS.md docs/contributing/maintainers.md`

**P5.6 Move SECURITY.md to root:**
- [ ] `git mv docs/SECURITY.md SECURITY.md` (GitHub convention)

**Validation:**
- ✅ All docs in appropriate directories
- ✅ No docs left in `docs/` root except README.md and organized subdirs
- ✅ Check that snippets/ is preserved as-is
- ✅ Run link checker
- ✅ Verify all git mv commands preserved history

**Rollback:** `git reset --hard HEAD~[number of commits]`

---

### PHASE 6: Create New Content & Polish (Week 7-8 - 12-16 hours)

**Goal:** Fill gaps and enhance discoverability

**Tasks:**

**P6.1 Enhanced docs/README.md:**
Create comprehensive documentation hub with:
- Clear navigation to all sections
- Quick links for common tasks
- Prominent link to separation-of-concerns.md
- Links to getting-started/, mvp/, architecture/, etc.

**P6.2 Create CHANGELOG.md (root):**
- [ ] Add CHANGELOG.md following Keep a Changelog format
- [ ] Document recent history from git log
- [ ] Set up for future use

**P6.3 Create section READMEs:**
- [ ] `docs/getting-started/README.md` - Navigation + quick links
- [ ] `docs/guides/README.md` - Guide index
- [ ] `docs/architecture/README.md` - Architecture overview + separation of concerns emphasis
- [ ] `docs/reference/README.md` - Reference index
- [ ] `docs/contributing/README.md` - Contributor overview
- [ ] `docs/vision/README.md` - Vision overview with context note
- [ ] `docs/operations/README.md` - Operational docs
- [ ] `docs/mvp/README.md` - MVP strategy overview
- [ ] `docs/mvp/coding-prompts/README.md` - Prompt structure explanation

**P6.4 Create new content:**
- [ ] `docs/getting-started/manifest-authoring.md` - How to write manifests
- [ ] `docs/getting-started/using-cli.md` - Based on cli-devc.md
- [ ] `docs/operations/troubleshooting.md` - Common issues & solutions
- [ ] `docs/contributing/testing.md` - Testing guidelines

**P6.5 Update root README.md:**
Add better documentation navigation section:
```markdown
## 📚 Documentation

**Quick Links:**
- 🚀 [Fast Classroom Setup](docs/getting-started/fast-classroom.md)
- 🏗️ [Architecture Overview](docs/architecture/README.md)
- 📖 [Full Documentation Hub](docs/README.md)
- 🔮 [MVP Strategy](docs/mvp/README.md)

**Key Principles:**
- [Separation of Concerns](docs/architecture/separation-of-concerns.md) - Catalog is education-agnostic
- [Dev Environments Strategy](docs/architecture/dev-environments-strategy.md) - Provider-agnostic design

For contributors: [Contributing Guide](CONTRIBUTING.md)
```

**P6.6 Add navigation breadcrumbs:**
Add to top of key docs:
```markdown
**Navigation:** [Documentation Hub](../README.md) > [Section] > This Page

**Related:**
- [Link 1]
- [Link 2]
```

**Validation:**
- ✅ All new content created
- ✅ All READMEs present
- ✅ Navigation tested
- ✅ Root README updated
- ✅ Breadcrumbs added
- ✅ Run full link check

**Rollback:** `git reset --hard HEAD~[number of commits]`

---

### PHASE 7: Validation & Cleanup (Week 8 - 4-6 hours)

**Goal:** Final validation and cleanup

**Tasks:**

**P7.1 Comprehensive link validation:**
- [ ] Run automated link checker on all .md files
- [ ] Fix all broken internal links
- [ ] Verify archive links point correctly
- [ ] Check external links (optional)

**P7.2 Content verification:**
- [ ] Compare `docs-inventory-before.txt` with current state
- [ ] Verify all 53 original files are accounted for (moved or archived, none deleted)
- [ ] Spot-check 5-10 random archived files have header notes
- [ ] Verify mvp/ promotion successful

**P7.3 Structure verification:**
- [ ] Verify all planned directories exist
- [ ] Verify all READMEs exist
- [ ] Check no empty directories (except as planned)
- [ ] Verify snippets/ preserved

**P7.4 Git history check:**
- [ ] Use `git log --follow` on 5-10 moved files to verify history preserved
- [ ] Check that all moves used `git mv` (not delete + add)

**P7.5 Create comparison doc:**
```
docs/REORGANIZATION_SUMMARY.md:
- Before/after structure
- What moved where
- What was archived and why
- What was consolidated
- No deletions confirmation
```

**P7.6 Final cleanup:**
- [ ] Remove this plan file from root (or move to docs/archive/)
- [ ] Update .gitignore if needed
- [ ] Clean up any temp files

**Validation:**
- ✅ Zero broken internal links
- ✅ All 53 files accounted for
- ✅ All moves preserve git history
- ✅ Structure matches plan
- ✅ Archive notes present
- ✅ No deletions confirmed

**Rollback:** Full rollback to backup branch if critical issues found

---

## Success Metrics

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| Files accounted for | 53/53 (100%) | Inventory comparison |
| Deletions | 0 | `git log --diff-filter=D` |
| History preserved | 100% | `git log --follow` spot checks |
| Broken internal links | 0 | Automated link checker |
| Archive header notes | 100% | Manual spot check |
| New READMEs | 9+ | Directory listing |
| Team approval | Yes | Review meeting |

---

## Rollback Procedures

### Rollback Entire Reorganization
```bash
# Return to state before any changes
git reset --hard backup-before-doc-reorg
git push -f origin main  # If already pushed (use with caution!)
```

### Rollback Specific Phase
```bash
# Find last commit of previous phase
git log --oneline

# Reset to that commit
git reset --hard <commit-hash>
```

### Emergency Rollback (Critical Issue Found)
```bash
# Immediately revert to backup
git checkout backup-before-doc-reorg
git branch -D main
git checkout -b main
git push -f origin main  # Emergency only!
```

---

## Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Broken links after moves | HIGH | MEDIUM | Automated link checker + manual review |
| Lost content in consolidation | LOW | HIGH | Side-by-side comparison + team review |
| Git history loss | LOW | MEDIUM | Use `git mv` exclusively, verify with `git log --follow` |
| Team confusion | MEDIUM | MEDIUM | Clear documentation, gradual rollout, communication |
| Accidental deletion | LOW | HIGH | Automated check for deletions, archive instead |

---

## Communication Plan

### Before Starting
- [ ] Share this plan with all maintainers
- [ ] Get written approval from at least 2 maintainers
- [ ] Schedule kickoff meeting to review phases

### During Implementation
- [ ] Post phase completion updates in team channel
- [ ] Share link checker results after each phase
- [ ] Request spot-checks from team members

### After Completion
- [ ] Share reorganization summary document
- [ ] Update onboarding docs with new structure
- [ ] Solicit feedback from team

---

## Timeline Summary

| Phase | Week | Hours | Key Deliverable |
|-------|------|-------|-----------------|
| P0: Preparation | 1 | 4-6 | Backup, tools, approval |
| P1: Structure | 2 | 6-8 | Empty directory structure |
| P2: Archive | 3 | 8-10 | Legacy docs archived with notes |
| P3: MVP Organize | 4 | 10-12 | mvp-launch/ promoted to mvp/ |
| P4: Consolidate | 5 | 12-15 | Duplicates merged |
| P5: Organize Remaining | 6 | 10-12 | All docs in final locations |
| P6: New Content | 7-8 | 12-16 | READMEs, new guides, polish |
| P7: Validation | 8 | 4-6 | Final checks, cleanup |
| **TOTAL** | **8 weeks** | **66-85 hours** | **Organized documentation** |

---

## Next Steps

1. **Review this plan** with all maintainers
2. **Get written approval** (minimum 2 maintainers)
3. **Schedule Phase 0** (preparation week)
4. **Create backup branch** before any changes
5. **Execute phases sequentially** with validation at each step

---

## Appendix A: Header Note Examples

### For Superseded Docs
```markdown
> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-03
> **Reason:** Superseded by current MVP strategy
> **See Instead:** [docs/mvp/mvp-launch-plan.md](../mvp/mvp-launch-plan.md)
>
> This document described an older meta-workspace pattern that has been
> superseded by the current MVP architecture. See the link above for
> current strategic direction.

---
# Workspace Architecture (v0.1)
[Original content...]
```

### For Completed Artifacts
```markdown
> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-03
> **Reason:** Completed verification artifact
> **Status:** ✅ All checks passed (Oct 30, 2024)
>
> This was a one-time verification checklist that has been completed.
> The checks confirmed repository hardening and are preserved here
> for historical reference.

---
# Classroom Hardening Verification
[Original content...]
```

### For Historical Records
```markdown
> 📚 **HISTORICAL RECORD**
>
> **Archived Date:** 2025-11-03
> **Type:** Comprehensive Repository Review
> **Score:** 8.2/10 (Very Good - Production Ready)
>
> This comprehensive review was conducted on October 30, 2024 and provides
> valuable historical context about the repository's quality and maturity.
> While archived, it remains a useful reference for understanding the
> project's strengths and areas for improvement at that time.

---
# Repository Review and Scoring Report
[Original content...]
```

---

## Appendix B: Link Checker Script

```bash
#!/bin/bash
# check-links.sh - Validate all internal markdown links

find . -name "*.md" -type f | while read file; do
    grep -oP '\[.*?\]\(\K[^)]+' "$file" | while read link; do
        # Skip external links
        [[ "$link" =~ ^https?:// ]] && continue

        # Resolve relative path
        dir=$(dirname "$file")
        target="$dir/$link"

        # Check if target exists
        if [ ! -f "$target" ] && [ ! -d "$target" ]; then
            echo "BROKEN: $file -> $link"
        fi
    done
done
```

---

## Appendix C: Validation Checklist

Use this checklist after each phase:

### Phase Completion Checklist
- [ ] All planned moves completed
- [ ] No unintended deletions (`git log --diff-filter=D`)
- [ ] Git history preserved (`git log --follow` on sample files)
- [ ] Automated link check passed (or issues documented)
- [ ] Manual spot-check of 3-5 files
- [ ] Team notification sent
- [ ] Phase documented in reorganization summary
- [ ] Backup point created (`git tag phase-X-complete`)

---

**Prepared by:** Claude (AI Documentation Analyst)
**Date:** 2025-11-01
**Version:** 1.0 - Comprehensive & Final
**Status:** Ready for Team Review and Approval
