# 3. Hardcoded Browser Sidecar Definitions

**Status:** accepted

**Date:** 2024-11-01

**Deciders:** Platform Team

**Technical Story:** Browser experience review for classroom parity across platforms

---

## Context and Problem Statement

Web development lessons require students to interact with a browser running inside the Dev Container so that debugging, performance profiling, and UI testing happen against the same environment as the application. This is critical when students use Codespaces or low-powered devices where running Chrome locally is infeasible.

Early prototypes allowed instructors to specify arbitrary browser images or rely on remote desktops bundled directly into templates. That flexibility came with serious drawbacks: untested images would break in Codespaces, security defaults varied wildly, and there was no consistent way to resolve port conflicts. We needed a curated approach that keeps browsers reliable, documents required credentials, and integrates with the generator’s port allocation and warning system.

## Decision Drivers

* **Reliability:** Browsers must be validated in Codespaces and local Docker so lessons do not collapse during workshops.
* **Security:** Default passwords and required environment variables must surface in warnings before a stack is shared.
* **Port Coordination:** Browser ports must coexist with template services; conflicts should be automatically resolved.
* **Stability Signaling:** Educators need to know which browsers are stable versus experimental or deprecated.
* **Platform Guidance:** Codespaces has strict networking rules (no UDP). Documentation should highlight platform-specific caveats.
* **Ease of Use:** Selecting a browser should be as simple as specifying an ID; no manual Compose editing.

## Considered Options

* **Option A:** Curated list of hardcoded browser sidecars in the catalog.
* **Option B:** Dynamic discovery of browser images from container registries.
* **Option C:** Allow user-supplied compose fragments per lesson.
* **Option D:** Package browsers as Dev Container features.

## Decision Outcome

**Chosen option:** "Option A: Curated, hardcoded browser sidecars"

We maintain a typed list of browser sidecar definitions in the CLI. Each entry describes the compose template path, service name, port requirements, stability, environment expectations, and platform notes. When a lesson manifest includes browsers, the generator validates selection against this list, merges the referenced fragments, reassigns ports as needed, and annotates the devcontainer with warnings about default credentials or missing secrets.

### Positive Consequences

* **Predictable Quality:** Only browsers that passed Codespaces and local smoke tests ship as options.【F:tools/airnub-devc/src/lib/services.ts†L128-L189】
* **Security Warnings:** Required environment variables and default passwords produce warnings before stack generation completes.【F:tools/airnub-devc/src/lib/stacks.ts†L826-L859】
* **Automatic Port Allocation:** Conflicting ports are reassigned into a reserved range, and compose fragments are rewritten to match.【F:tools/airnub-devc/src/lib/stacks.ts†L559-L636】
* **Platform Notes:** Browser metadata carries Codespaces and local guidance surfaced to instructors during generation.【F:tools/airnub-devc/src/lib/services.ts†L128-L176】
* **Lifecycle Control:** Experimental browsers require explicit opt-in; deprecated entries can remain for compatibility without surprise regressions.【F:tools/airnub-devc/src/lib/services.ts†L128-L189】

### Negative Consequences

* **Limited Extensibility:** Instructors cannot register arbitrary images without modifying the catalog and publishing a new release.
* **Maintenance Overhead:** Platform team owns browser image upgrades, verification, and metadata updates.
* **Catalog Coupling:** Adding a browser requires coordinated changes across the CLI and the corresponding template fragment.

## Pros and Cons of the Options

### Option A: Hardcoded Browser Sidecars (Chosen)

**Pros:**
* Strong typing ensures metadata consistency (ports, env vars, notes).【F:tools/airnub-devc/src/lib/services.ts†L111-L189】
* Validation rejects unknown IDs and enforces experimental opt-in, preventing surprise breakages.【F:tools/airnub-devc/src/lib/stacks.ts†L922-L956】
* Generator merges compose fragments and devcontainer metadata while warning about default credentials and missing secrets.【F:tools/airnub-devc/src/lib/stacks.ts†L780-L863】【F:tools/airnub-devc/src/lib/stacks.ts†L1018-L1041】

**Cons:**
* Requires catalog updates to add or modify browsers.
* Harder for advanced users to experiment with bespoke setups without forking.

### Option B: Dynamic Registry Discovery

**Pros:**
* Third parties could publish browsers without modifying the catalog.
* Always shows the latest images and versions automatically.

**Cons:**
* No guarantees that discovered images work in Codespaces or follow security best practices.
* Hard to extract structured metadata (required env vars, port labels) from arbitrary images.
* Discovery adds startup latency and increases attack surface.

### Option C: User-Supplied Compose Fragments

**Pros:**
* Maximum flexibility; instructors can tailor browsers per lesson.
* No catalog release required for experimentation.

**Cons:**
* Places the burden of port coordination, health checks, and security warnings on instructors.
* No centralized stability metadata or platform guidance; quality varies wildly.
* Makes support difficult because every lesson could bundle a unique browser stack.

### Option D: Dev Container Features

**Pros:**
* Uses the official devcontainer feature distribution mechanism.
* Could leverage the feature marketplace for discovery.

**Cons:**
* Features execute during container creation and do not align with long-lived browser services.
* Hard to express port forwarding semantics or platform notes through feature metadata.
* Combining features with compose fragments complicates troubleshooting.

## Links

* [Browser Sidecar Definitions](../../tools/airnub-devc/src/lib/services.ts)
* [Browser Merge and Validation Logic](../../tools/airnub-devc/src/lib/stacks.ts)
* Related: [ADR 0001: Use Docker Compose Fragments for Optional Services](./0001-compose-fragment-pattern.md)
* Related: [ADR 0002: Hybrid Local and Remote Catalog Resolution](./0002-catalog-resolution.md)
