> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-02
> **Reason:** Planning document superseded by comprehensive reorganization plan which was successfully implemented
> **See Instead:** [REORGANIZATION_SUMMARY.md](../../REORGANIZATION_SUMMARY.md)
>
> This revised plan correctly analyzed the documentation structure and informed the
> comprehensive DOCUMENTATION_REORGANIZATION_PLAN.md which was successfully implemented
> in all 8 phases.

---

# Documentation Improvement Plan (REVISED)

**Date:** 2025-11-01
**Status:** ✅ Implemented and Archived (2025-11-02)
**Overall Goal:** Organize documentation to reflect current strategic direction and catalog's role as education-agnostic generator

---

## Executive Summary

After reviewing commit timestamps and content, the **mvp-launch/** directory (updated Oct 30-31, Nov 1) contains the **MOST RECENT architectural thinking** and should be **promoted**, not archived. The workspace-architecture docs (Oct 28) represent **older patterns** that should be reconsidered.

**Key Insight:** The catalog is an **education-agnostic generator/library**, NOT a platform. All persistence and orchestration lives in **comhrá** (the SaaS platform).

**Critical Documents to Preserve:**
- `docs/mvp-launch/` - **CURRENT** MVP strategy (promote!)
- `docs/services.md`, `docs/cli-devc.md` - Recently updated (Oct 30-31)
- `docs/manifest-contract.md` - Current contract

**Legacy Documents to Consider:**
- `docs/workspace-architecture-0.md`, `docs/workspace-architecture-1.md` - Oct 28, older "meta-workspace" pattern
- `docs/devcontainer-spec-alignment.md` - Marked as legacy
- `docs/CATALOG-ARCHITECTURE.md` - Oct 28, may be superseded

---

## Timeline Analysis

### Most Recent (Nov 1, 2025)
- `docs/sidecars-health.md`
- `docs/mvp-launch/coding-agent-prompt-sdk-codespaces-adapter.md`

### Recent (Oct 30-31, 2025) - CURRENT ARCHITECTURE
- **`docs/mvp-launch/`** - All files (MVP strategy, separation of concerns, dev environments)
- `docs/services.md`, `docs/cli-devc.md`, `docs/STACKS.md`
- `docs/classroom-fast-start.md`, `docs/manifest-contract.md`
- `docs/saas-edu-platform-vision.md` (updated Oct 31)

### Older (Oct 28-29, 2025) - POTENTIALLY LEGACY
- `docs/workspace-architecture-0.md`, `docs/workspace-architecture-1.md`
- `docs/CATALOG-ARCHITECTURE.md`
- `docs/devcontainer-spec-alignment.md` (marked legacy)
- `docs/SECURITY.md`, `docs/MIGRATION*.md`

---

## Current Architecture Understanding

### From mvp-launch/ (AUTHORITATIVE)

**1. Catalog Role (separation-of-concerns-devcontainers-vs-comhra.md)**
- devcontainers-catalog = **education-agnostic, stateless generator**
- NO database, NO persistence, NO platform logic
- Generates `manifest.json` that comhrá (SaaS) consumes
- Reusable by ANY platform (education, internal teams, hackathons, CI)

**2. MVP Strategy (mvp-launch-plan.md)**
- Repo-button first (no CodespacesAdapter required initially)
- Adapter-ready architecture for future
- Focus on government funding (iPad/Chromebook access)
- Phase 0: MVP (repo generation, Codespaces button, sidecars)
- Phase 1-4: Incremental adapter additions

**3. Provider Strategy (dev-environments-strategy.md)**
- Provider-agnostic from day one
- Codespaces-first for universal access
- DevPod later for "run anywhere" (Docker/K8s/VMs/AWS)
- Own control plane as future option (Dev Containers CLI + openvscode-server)

**4. Experimental Services Policy (experimental-services-policy.md)**
- Services tagged: `experimental | stable | deprecated`
- Opt-in via `--include-experimental` flag
- Graduation checklist for moving experimental → stable

**5. Lesson Scaffolding (lesson-scaffolding-enablement-plan.md)**
- SDK mode for programmatic generation
- Well-known lesson onboarding slots
- Merge helpers for devcontainer.json and compose
- Port allocator with UDP awareness

---

## Revised Documentation Structure

### Root Level
```
/
├── README.md                          # Keep - excellent overview
├── AGENTS.md                          # Keep - critical guardrails
├── VERSIONING.md                      # Keep - versioning strategy
├── CONTRIBUTING.md                    # NEW - contributor guide
├── CHANGELOG.md                       # NEW - version history
├── CODE_OF_CONDUCT.md                 # Keep - enhance
├── SECURITY.md                        # MOVE from docs/ (GitHub convention)
└── LICENSE                            # Existing
```

### docs/ Structure
```
docs/
├── README.md                          # ENHANCE - documentation hub
│
├── getting-started/                   # NEW - User quick starts
│   ├── README.md
│   ├── fast-classroom.md              # CONSOLIDATE classroom-fast-start + quick-start-fast-classroom
│   ├── using-cli.md                   # Based on cli-devc.md
│   └── manifest-authoring.md          # NEW - How to write manifests
│
├── architecture/                      # Current architectural thinking
│   ├── README.md
│   ├── separation-of-concerns.md      # MOVE from mvp-launch/ (CRITICAL!)
│   ├── catalog-design.md              # CONSOLIDATE CATALOG + CATALOG-ARCHITECTURE
│   ├── dev-environments-strategy.md   # MOVE from mvp-launch/ (provider strategy)
│   ├── spec-alignment.md              # RENAME from SPEC-ALIGNMENT (keep current)
│   ├── stacks-orchestrators.md        # Keep
│   └── docker-containers.md           # Keep
│
├── mvp/                               # RENAME from mvp-launch/ - CURRENT STRATEGY
│   ├── README.md
│   ├── mvp-launch-plan.md             # CORE strategic doc
│   ├── experimental-services-policy.md # CORE governance doc
│   ├── lesson-scaffolding-plan.md     # SDK enablement plan
│   └── coding-prompts/                # SUB-DIR for agent prompts
│       ├── README.md
│       ├── sdk-codespaces-adapter.md
│       ├── implement-mvp.md
│       ├── scaffold-manifest-package.md
│       └── codespaces-adapter-*.md
│
├── guides/                            # How-to guides
│   ├── README.md
│   ├── cli-devc.md                    # Keep (recently updated)
│   ├── generator.md                   # Keep
│   ├── lesson-flow.md                 # Keep
│   └── services.md                    # MOVE from docs/ root
│
├── reference/                         # API & catalog reference
│   ├── README.md
│   ├── catalog-matrix.md              # Keep current CATALOG.md content
│   ├── manifest-contract.md           # Keep (recently updated)
│   ├── versioning.md                  # MOVE from root
│   ├── agents-mcp-contract.md         # Keep (expand later)
│   └── sidecars-health.md             # Keep (most recent!)
│
├── vision/                            # Product vision (context, not implementation)
│   ├── README.md
│   ├── saas-platform-vision.md        # Keep (updated Oct 31, but as VISION context)
│   ├── positioning.md                 # RENAME from positioning-brief.md
│   └── integration-roadmap.md         # RENAME from comhra-devcontainers-integration-roadmap.md
│
├── contributing/                      # Developer docs
│   ├── README.md
│   ├── development.md                 # RENAME from DEVELOPMENT.md
│   ├── maintainers.md                 # RENAME from MAINTAINERS.md
│   ├── migration-guide.md             # CONSOLIDATE MIGRATION + MIGRATION-NAMING
│   └── testing.md                     # NEW
│
├── snippets/                          # KEEP - README templates
│   ├── README.md
│   ├── workspace-readme.md
│   └── lesson-readme.md
│
└── archive/                           # Legacy & one-time docs
    ├── README.md
    ├── workspace-architecture-0.md    # MOVE - Oct 28, older meta-workspace pattern
    ├── workspace-architecture-1.md    # MOVE - Oct 28, older pattern
    ├── devcontainer-spec-alignment.md # KEEP - already marked legacy
    ├── catalog-architecture-oct28.md  # MOVE - older version
    ├── review-2024-10-30.md           # MOVE from REVIEW_AND_SCORES.md
    ├── varify-checklist.md            # MOVE from VARIFY.md
    └── workflow-improvement-2024.md   # MOVE from WORKFLOW_IMPROVEMENT_PLAN.md
```

---

## Key Changes from Original Plan

### 1. **Promote mvp-launch/** (was incorrectly marked for archive)
- **Original plan:** Archive as "MVP-specific docs"
- **Revised:** Rename to `docs/mvp/` and treat as **CURRENT strategic direction**
- **Reason:** Updated Oct 30-31, contains authoritative architecture

### 2. **Archive workspace-architecture docs** (was incorrectly kept)
- **Original plan:** Consolidate workspace-architecture-0 + 1
- **Revised:** Move to archive (Oct 28, older meta-workspace pattern)
- **Reason:** Not referenced in recent MVP docs; represents older thinking

### 3. **Emphasize Separation of Concerns**
- **Original plan:** Buried in architecture
- **Revised:** Prominently place `separation-of-concerns.md` in architecture/
- **Reason:** CRITICAL principle that catalog is education-agnostic

### 4. **Keep saas-edu-platform-vision.md as Vision Context**
- **Original plan:** Refactor and reduce from 5000 lines
- **Revised:** Keep in `vision/` as strategic context (not implementation)
- **Reason:** Updated Oct 31; provides important context but shouldn't drive implementation

### 5. **Promote Experimental Services Policy**
- **Original plan:** Not prominently featured
- **Revised:** Keep in `docs/mvp/experimental-services-policy.md`
- **Reason:** Current governance strategy for service stability

---

## Consolidation Actions (Revised)

### Action 1: Promote MVP Docs
**Input:** `docs/mvp-launch/*`
**Output:** `docs/mvp/*` (with sub-directory for coding prompts)
**Rationale:** These are CURRENT strategy, not artifacts

### Action 2: Archive Meta-Workspace Docs
**Input:** `docs/workspace-architecture-0.md`, `docs/workspace-architecture-1.md`
**Output:** `docs/archive/workspace-architecture-*.md`
**Rationale:** Oct 28 (older), represents superseded "meta-workspace" pattern

### Action 3: Consolidate Catalog Docs
**Input:** `docs/CATALOG.md` + `docs/CATALOG-ARCHITECTURE.md`
**Output:**
- `docs/architecture/catalog-design.md` (architecture principles)
- `docs/reference/catalog-matrix.md` (feature/template/image matrix)
**Rationale:** Separate design from reference data

### Action 4: Consolidate Quick Starts
**Input:** `docs/quick-start-fast-classroom.md` + `docs/classroom-fast-start.md`
**Output:** `docs/getting-started/fast-classroom.md`
**Rationale:** Similar content, updated at similar times

### Action 5: Consolidate Migration Docs
**Input:** `docs/MIGRATION.md` + `docs/MIGRATION-NAMING.md`
**Output:** `docs/contributing/migration-guide.md`
**Rationale:** Single source for migration guidance

### Action 6: Move Separation of Concerns
**Input:** `docs/mvp-launch/separation-of-concerns-devcontainers-vs-comhra.md`
**Output:** `docs/architecture/separation-of-concerns.md` (with clear link from mvp/)
**Rationale:** CRITICAL architectural principle deserves prominence

---

## Implementation Plan (Revised)

### Week 1: Structure + MVP Promotion (10-12 hours)

**Day 1: Create Structure & Promote MVP**
- [ ] Create new directory structure
- [ ] Rename `docs/mvp-launch/` → `docs/mvp/`
- [ ] Create `docs/mvp/coding-prompts/` subdirectory
- [ ] Move coding-agent-prompt-*.md files to coding-prompts/
- [ ] Update `docs/mvp/README.md` to explain structure

**Day 2: Archive Older Docs**
- [ ] Create `docs/archive/`
- [ ] Move `workspace-architecture-0.md`, `workspace-architecture-1.md` to archive
- [ ] Move `CATALOG-ARCHITECTURE.md` → `docs/archive/catalog-architecture-oct28.md`
- [ ] Update `docs/archive/README.md` with explanation

**Day 3: Move Core Docs**
- [ ] Move `SECURITY.md` to root (GitHub convention)
- [ ] Move key mvp docs to architecture/ (separation-of-concerns.md, dev-environments-strategy.md)
- [ ] Ensure clear cross-links between mvp/ and architecture/

**Day 4: Create Directories**
- [ ] Create `docs/getting-started/`, `docs/guides/`, `docs/reference/`
- [ ] Create placeholder READMEs
- [ ] Move existing docs to appropriate locations

**Day 5: Update Cross-References**
- [ ] Update all internal links
- [ ] Test all links (automated check)
- [ ] Update root README.md with new structure

### Week 2: Consolidation (8-12 hours)

**Day 1: Catalog Consolidation**
- [ ] Create `docs/architecture/catalog-design.md` (design principles)
- [ ] Create `docs/reference/catalog-matrix.md` (reference data)
- [ ] Remove duplication

**Day 2: Quick Start Consolidation**
- [ ] Merge `quick-start-fast-classroom.md` + `classroom-fast-start.md`
- [ ] Create unified `docs/getting-started/fast-classroom.md`
- [ ] Update examples

**Day 3: Migration Consolidation**
- [ ] Merge `MIGRATION.md` + `MIGRATION-NAMING.md`
- [ ] Create `docs/contributing/migration-guide.md`

**Day 4: Vision Organization**
- [ ] Move vision docs to `docs/vision/`
- [ ] Add context note: "Vision provides strategic context; see docs/mvp/ for current implementation direction"

**Day 5: Cleanup & Verification**
- [ ] Remove legacy `devcontainer-spec-alignment.md` (keep in archive)
- [ ] Verify no broken links
- [ ] Update cross-references

### Week 3: Fill Gaps (10-14 hours)

**Day 1: Enhanced docs/README.md**
- [ ] Create documentation hub with clear navigation
- [ ] Emphasize separation of concerns principle
- [ ] Link prominently to `docs/mvp/` for current direction

**Day 2: CONTRIBUTING.md**
- [ ] Create comprehensive contributor guide
- [ ] Emphasize catalog's role as education-agnostic library
- [ ] Link to development.md, testing.md, etc.

**Day 3: CHANGELOG.md**
- [ ] Create CHANGELOG.md with Keep a Changelog format
- [ ] Document recent history from git log
- [ ] Set up automated changelog tooling

**Day 4: Architecture README**
- [ ] Create `docs/architecture/README.md`
- [ ] Explain catalog as generator/library (NOT platform)
- [ ] Link to separation-of-concerns.md prominently

**Day 5: MVP README**
- [ ] Create `docs/mvp/README.md`
- [ ] Explain MVP strategy and phased approach
- [ ] Link to key strategic docs

### Week 4: Enhancement (6-8 hours)

**Day 1: Navigation**
- [ ] Add breadcrumbs to all docs
- [ ] Add "See Also" sections
- [ ] Ensure mvp/ and architecture/ are well cross-linked

**Day 2: Visual Aids**
- [ ] Create architecture diagram emphasizing catalog/comhrá separation
- [ ] Create flow diagram for fast classroom setup
- [ ] Add documentation structure map

**Day 3: Discoverability**
- [ ] Update root README with better doc links
- [ ] Emphasize current strategic direction (mvp/)
- [ ] Make separation of concerns prominent

**Day 4: Testing & Validation**
- [ ] Automated link check
- [ ] Review with fresh eyes
- [ ] Get team feedback

---

## Success Metrics (Revised)

| Metric | Before | Target After | Notes |
|--------|--------|-------------|-------|
| Time to understand catalog role | ~30 min | ~5 min | "It's a generator, not a platform" |
| MVP strategy findability | Hidden in mvp-launch/ | Prominent in docs/mvp/ | Clear strategic direction |
| Separation of concerns clarity | Buried | Prominent | CRITICAL principle |
| Legacy confusion | workspace-architecture confusion | Clear archive with context | Older patterns documented |
| Total file count | 50+ | ~35-40 | Organized consolidation |

---

## Critical Success Factors

### 1. **Make Separation of Concerns Clear**
The #1 confusion risk is treating the catalog as a platform. Documentation MUST emphasize:
- Catalog = education-agnostic generator
- No database, no persistence in catalog
- Comhrá (SaaS) handles all orchestration

### 2. **Respect Current Strategic Direction**
The mvp-launch/ docs represent CURRENT thinking (Oct 30-31, Nov 1). They should be:
- Promoted, not archived
- Made discoverable
- Cross-linked with architecture docs

### 3. **Archive with Context**
Older docs (workspace-architecture, Oct 28) should be:
- Moved to archive/
- Explained as "older patterns"
- NOT deleted (preserve history)

### 4. **Maintain Timeline Integrity**
Documentation structure should reflect:
- What's current (mvp/, recent services.md, cli-devc.md)
- What's vision/context (vision/)
- What's legacy (archive/)

---

## Questions for Review

1. **MVP Directory Rename:** OK to rename `mvp-launch/` → `mvp/`? (Removes "launch" connotation)

2. **Workspace Architecture:** Confirm workspace-architecture-0/1 are indeed older patterns to archive?

3. **Separation of Concerns:** Should this doc live in architecture/ or mvp/? (Proposal: architecture/ with strong link from mvp/)

4. **Vision Directory:** Is `saas-edu-platform-vision.md` still relevant as strategic context, or should it be updated/replaced?

5. **Coding Prompts:** Should agent prompts in mvp-launch/ be organized into subdirectory or kept flat?

---

## Next Steps

1. **Confirm understanding** - Does this revised plan align with current architecture?
2. **Get team consensus** - Especially on workspace-architecture archival
3. **Validate mvp/ content** - Ensure all mvp-launch/ docs are still current
4. **Start Week 1** - Structure + MVP promotion

---

## Appendix: Key Architectural Principles (from mvp-launch/)

**From separation-of-concerns-devcontainers-vs-comhra.md:**

> **devcontainers-catalog must remain education-agnostic and stateless.** It should not contain any database persistence or platform-specific logic. All persistence, cohort/course concepts, and provider orchestration live in comhrá (the Education SaaS) or other consuming platforms.

**From mvp-launch-plan.md:**

> Deliver a **government-funding-ready MVP** that proves impact (access for iPad/low-power devices, fast setup for teachers, reproducible stacks) while keeping the codebase **adapter-ready** for later upgrades.

**From dev-environments-strategy.md:**

> Build **provider-agnostic** from day one, ship **Codespaces-first** for universal iPad/low-power access, and add **DevPod** to unlock "run anywhere" (local Docker/Kubernetes/VMs/your AWS).

These principles MUST be reflected in documentation structure and content.

---

**Prepared by:** Claude (AI Documentation Analyst)
**Date:** 2025-11-01
**Revision:** 2.0 - Based on commit timeline analysis
**Status:** Proposed - Awaiting team review with emphasis on current architecture
