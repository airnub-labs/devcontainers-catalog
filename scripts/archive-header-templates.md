# Archive Header Templates

These templates should be added to the top of documents being archived. Choose the appropriate template based on the reason for archiving.

---

## Template 1: Superseded Document

Use when a document has been replaced by newer documentation.

```markdown
> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** YYYY-MM-DD
> **Reason:** Superseded by [newer approach/strategy/documentation]
> **See Instead:** [Link to current documentation]
>
> This document described [brief description of what this doc covered].
> It has been superseded by the current [MVP strategy/architecture/etc.].
> See the link above for current information.

---

[Original content follows unchanged]
```

**Example Usage:**
```markdown
> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-03
> **Reason:** Superseded by current MVP strategy
> **See Instead:** [docs/mvp/mvp-launch-plan.md](../../mvp/mvp-launch-plan.md)
>
> This document described an older meta-workspace pattern for organizing
> multiple development environments. It has been superseded by the current
> MVP architecture which focuses on education-agnostic, stateless generation.
> See the link above for current strategic direction.

---

# Workspace Architecture (v0.1)
[Original content...]
```

---

## Template 2: Completed Artifact

Use when a document was a one-time checklist, review, or implementation plan that has been completed.

```markdown
> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** YYYY-MM-DD
> **Reason:** Completed [artifact type: checklist/review/plan]
> **Status:** ✅ [Completed/Implemented] on [date]
>
> This was a one-time [checklist/review/plan] that has been completed.
> [Optional: Brief outcome/result]. The document is preserved here for
> historical reference and provides context for past decisions.

---

[Original content follows unchanged]
```

**Example Usage:**
```markdown
> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-03
> **Reason:** Completed verification artifact
> **Status:** ✅ All checks passed (Oct 30, 2024)
>
> This was a one-time verification checklist to confirm repository hardening
> and security measures. All checks have been completed successfully. The
> document is preserved here for historical reference and audit purposes.

---

# Classroom Hardening Verification
[Original content...]
```

---

## Template 3: Historical Record

Use for valuable historical documentation like reviews, assessments, or major decision documents.

```markdown
> 📚 **HISTORICAL RECORD**
>
> **Archived Date:** YYYY-MM-DD
> **Type:** [Document type: Review/Assessment/Decision]
> **Context:** [Brief context - e.g., score, outcome, decision made]
>
> This [review/assessment/decision document] was conducted on [date] and provides
> valuable historical context about [what it documents]. While archived, it remains
> a useful reference for understanding [why it's valuable].

---

[Original content follows unchanged]
```

**Example Usage:**
```markdown
> 📚 **HISTORICAL RECORD**
>
> **Archived Date:** 2025-11-03
> **Type:** Comprehensive Repository Review
> **Context:** Score: 8.2/10 (Very Good - Production Ready)
>
> This comprehensive review was conducted on October 30, 2024 and provides
> valuable historical context about the repository's quality, maturity, and
> architecture at that time. While archived, it remains a useful reference
> for understanding the project's strengths and evolution.

---

# Repository Review and Scoring Report
[Original content...]
```

---

## Template 4: Consolidated Document

Use when multiple documents have been merged into a single comprehensive document.

```markdown
> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** YYYY-MM-DD
> **Reason:** Consolidated into [new document name]
> **See Instead:** [Link to consolidated document]
>
> This document has been merged with [other documents] into a single
> comprehensive guide. All unique information from this document has
> been preserved in the consolidated version. See the link above for
> the current, unified documentation.

---

[Original content follows unchanged]
```

**Example Usage:**
```markdown
> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-03
> **Reason:** Consolidated into comprehensive migration guide
> **See Instead:** [docs/contributing/migration-guide.md](../../contributing/migration-guide.md)
>
> This document has been merged with MIGRATION-NAMING.md into a single
> comprehensive migration guide. All unique information from both documents
> has been preserved and organized in the consolidated version.

---

# Migration Guide
[Original content...]
```

---

## Usage Instructions

### When Archiving a Document:

1. **Choose the appropriate template** based on reason for archiving
2. **Fill in all placeholder fields** (dates, links, descriptions)
3. **Add the template to the TOP** of the original document
4. **Keep all original content** unchanged below the archive notice
5. **Use git mv** to move to archive directory (preserves history)
6. **Update archive README** to include the newly archived document

### Field Guidelines:

- **Archived Date:** Use ISO format (YYYY-MM-DD)
- **Reason:** Clear, concise explanation (1 sentence)
- **See Instead / Status / Context:** Provide actionable next steps or valuable context
- **Links:** Use relative paths appropriate for archive location

### Don't Forget:

- ✅ All archive notes must be at the very top of the document
- ✅ Use horizontal rule (---) to separate archive note from original content
- ✅ Keep original content completely unchanged
- ✅ Update archive/README.md with entry for this document
- ✅ Commit with descriptive message explaining archival

---

## Quality Checklist

Before finalizing an archived document:

- [ ] Archive note is at the very top
- [ ] All fields are filled in (no [placeholders])
- [ ] Links are valid and use relative paths
- [ ] Date is in ISO format (YYYY-MM-DD)
- [ ] Reason is clear and concise
- [ ] Original content is unchanged below the note
- [ ] Horizontal rule separates note from content
- [ ] Git history is preserved (used git mv)
- [ ] Archive README.md has been updated

---

**Note:** These templates are part of Phase 0: Preparation & Safety Net for the documentation reorganization. They ensure consistent, clear communication about why documents were archived and where to find current information.
