# 2. Hybrid Local and Remote Catalog Resolution

**Status:** accepted

**Date:** 2024-10-20

**Deciders:** Platform Team

**Technical Story:** CLI distribution design review for contributor and educator workflows

---

## Context and Problem Statement

The catalog contains hundreds of templates, features, and service fragments totaling hundreds of megabytes. Two primary personas consume it:

1. **Contributors** iterating on templates/services inside a full checkout. They expect the CLI to use in-progress local changes without network calls.
2. **Educators and automation** invoking the CLI to materialize stacks without cloning the repo. They need fast, reliable access to published catalog versions and the ability to operate in cached/offline scenarios (e.g., classrooms with spotty Wi-Fi or CI runners without persistent clones).

A local-only approach forces everyone to clone the repository, which is cumbersome for educators and expensive for CI. A remote-only approach makes contributing painful and breaks offline use. We needed a hybrid strategy that transparently detects a local checkout when available, otherwise fetches and caches remote catalog versions with integrity guarantees.

## Decision Drivers

* **Contributor Productivity:** Local changes to templates and services must be instantly reflected when running the CLI from the repo root.
* **Consumer Convenience:** Educators should be able to `npx @airnub/devc` without cloning the catalog.
* **Integrity:** Remote downloads require checksum verification to prevent corruption or tampering.
* **Offline Capability:** Cached catalogs must work when the network is unavailable.
* **Version Pinning:** Users must lock to specific tags, branches, or SHAs for reproducible lessons.
* **Performance:** Avoid repeated downloads; leverage a shared cache per ref.
* **Discoverability:** The CLI should auto-detect a catalog root while walking up the filesystem.

## Considered Options

* **Option A:** Local-only development requiring explicit clone of the catalog.
* **Option B:** Remote-only resolution, always downloading from GitHub.
* **Option C:** Hybrid detection with SHA256-verified caching.
* **Option D:** Publishing the catalog as a package (npm or OCI registry).

## Decision Outcome

**Chosen option:** "Option C: Hybrid detection with SHA256-verified caching"

The CLI first honors an explicit `--catalog-root` flag, then attempts to discover a local catalog root by walking up from the current directory. If neither path succeeds, it downloads the requested ref (default `main`) as a tarball, extracts it into `~/.cache/airnub-devc/<ref>/`, and records a SHA256 checksum. Subsequent runs reuse the cached copy after validating the checksum, ensuring offline functionality and integrity. The ref string is sanitized before use, preventing path traversal.

### Positive Consequences

* **Flexible Workflows:** Contributors get instant feedback on local edits, while educators and CI fetch stable releases without extra steps.
* **Integrity Guarantees:** Checksums detect tampering or incomplete downloads before the cache is used.【F:tools/airnub-devc/src/lib/catalog.ts†L87-L116】
* **Offline Support:** Once cached, the catalog can be used without network connectivity.【F:tools/airnub-devc/src/lib/catalog.ts†L118-L154】
* **Version Pinning:** Refs map to dedicated cache directories, so multiple versions can coexist safely.【F:tools/airnub-devc/src/lib/catalog.ts†L132-L154】
* **Simple Override:** Users can still point to a bespoke catalog root via CLI flag or environment variable.

### Negative Consequences

* **Cache Management:** Users may need to clear `~/.cache/airnub-devc` if a ref is corrupted, though checksum validation reduces the odds.
* **Disk Usage:** Each cached ref consumes space; frequent ref changes can accumulate data.
* **Complexity:** Resolution code now handles three pathways (explicit, discovered, remote) instead of one, increasing maintenance surface.
* **Stale Cache Risk:** Users might not realize they are using an outdated cache without a manual refresh command.

## Pros and Cons of the Options

### Option A: Local-Only Clone Requirement

**Pros:**
* Minimal implementation; always read from the filesystem.
* Git provides built-in integrity checks and versioning.

**Cons:**
* Forces every user to download the full repository, which is burdensome for casual educators.
* CI pipelines must clone on every run, slowing builds and increasing network usage.
* Offline only works if the user already cloned beforehand.

### Option B: Remote-Only Downloads

**Pros:**
* Stateless logic; no cache invalidation to manage.
* Always downloads the latest content.

**Cons:**
* Requires network access every time, breaking offline scenarios and adding latency.
* Susceptible to rate limits and transient network failures.
* Remote-only flows cannot consume unmerged local contributions.

### Option C: Hybrid Detection with Caching (Chosen)

**Pros:**
* Honors explicit overrides, autodetects local checkouts, and falls back to cached remote downloads in a predictable order.【F:tools/airnub-devc/src/lib/catalog.ts†L118-L154】
* Local discovery works by walking up the directory tree looking for catalog markers, so contributors do not need flags.【F:tools/airnub-devc/src/lib/fsutil.ts†L26-L40】
* Cached tarballs live alongside recorded SHA256 sums for verification before reuse.【F:tools/airnub-devc/src/lib/catalog.ts†L87-L116】

**Cons:**
* Requires maintenance of fetch, extraction, and verification logic.【F:tools/airnub-devc/src/lib/catalog.ts†L26-L83】
* Cache eviction strategy relies on user intervention (manual deletion or future tooling).

### Option D: Package Registry Distribution

**Pros:**
* Consumers could install specific versions via familiar package managers.
* Semantic versioning encourages disciplined release cadence.

**Cons:**
* Repository size exceeds typical npm package expectations; publishing large tarballs strains registries.
* Package releases make consuming feature branches difficult (no ad-hoc refs).
* Adds CI complexity to publish on every catalog change.

## Links

* [Catalog Resolution Implementation](../../tools/airnub-devc/src/lib/catalog.ts)
* [Catalog Discovery Utility](../../tools/airnub-devc/src/lib/fsutil.ts)
* Related: [ADR 0001: Use Docker Compose Fragments for Optional Services](./0001-compose-fragment-pattern.md)
* Related: [ADR 0003: Hardcoded Browser Sidecar Definitions](./0003-browser-sidecar-selection.md)
