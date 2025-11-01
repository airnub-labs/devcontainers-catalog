# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Airnub DevContainers Catalog project.

## What is an ADR?

An ADR is a document that captures an important architectural decision along with its context
and consequences. ADRs help future contributors understand:

- **Why** a particular approach was chosen (not just **what** was implemented)
- **What alternatives** were considered and why they were rejected
- **What tradeoffs** were accepted in the decision
- **When** the decision was made and by whom

## Format

We use the **Michael Nygard ADR format** with these sections:

1. **Title**: Short, descriptive name with number prefix (e.g., "1. Use Docker Compose Fragments")
2. **Status**: proposed | accepted | deprecated | superseded
3. **Context**: Problem statement and forces at play
4. **Decision**: The chosen approach
5. **Consequences**: Positive and negative outcomes

## ADR Index

| # | Title | Status | Date |
|---|-------|--------|------|
| [0001](./0001-compose-fragment-pattern.md) | Use Docker Compose Fragments for Optional Services | accepted | 2024-10-15 |
| [0002](./0002-catalog-resolution.md) | Hybrid Local and Remote Catalog Resolution | accepted | 2024-10-20 |
| [0003](./0003-browser-sidecar-selection.md) | Hardcoded Browser Sidecar Definitions | accepted | 2024-11-01 |

## Creating a New ADR

1. **Copy the template:**
   ```bash
   cp docs/adr/template.md docs/adr/NNNN-short-title.md
   ```

2. **Fill in the sections:**
   - Write a clear problem statement
   - List decision drivers (requirements, constraints, quality attributes)
   - Document alternatives considered with pros/cons
   - Explain the chosen approach and its consequences

3. **Set the status:**
   - `proposed` - Under discussion
   - `accepted` - Approved and implemented
   - `deprecated` - No longer recommended (but still in use)
   - `superseded` - Replaced by another ADR (link to successor)

4. **Add to index:**
   Update this README with a new row in the table above.

5. **Get review:**
   Submit as PR and request review from platform team.

## Process

- **Proposal**: Author creates ADR with status `proposed`
- **Discussion**: Team discusses in PR comments
- **Decision**: PR approved → status changes to `accepted`
- **Implementation**: Code changes reference ADR in commits
- **Maintenance**: Update ADR status if deprecated/superseded

## Resources

- [Michael Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
- [Markdown Architectural Decision Records (MADR)](https://adr.github.io/madr/)
