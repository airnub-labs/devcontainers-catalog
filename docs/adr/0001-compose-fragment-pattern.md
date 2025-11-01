# 1. Use Docker Compose Fragments for Optional Services

**Status:** accepted

**Date:** 2024-10-15

**Deciders:** Platform Team

**Technical Story:** Internal alignment on service modularity for lesson generation

---

## Context and Problem Statement

The DevContainers catalog powers classroom environments that combine a base development template with optional backing services.
Different lessons require radically different infrastructure footprints: a backend API lesson may only need Redis, while a data engineering lesson may require Kafka, Airflow, and Temporal. Running every possible service all the time would overwhelm student workspaces, especially on GitHub Codespaces and low-spec devices.

Prior to this decision the catalog had multiple ad-hoc approaches for bundling services into templates. Some templates vendored their own docker-compose snippets, others relied on shell scripts, and a few depended on Dev Container Features to launch daemons at container start. Those approaches created duplication, inconsistent health checks, and diverging service versions across templates. We needed a unified pattern that allows the CLI to compose a stack deterministically while keeping services reusable.

The challenge was to create a service packaging strategy that:

- Allows instructors to pick only the services needed for a lesson without hand editing YAML.
- Works the same way locally and in GitHub Codespaces.
- Keeps each service definition self-contained, with health checks and documentation, so it can evolve independently.
- Plays nicely with Dev Container lifecycle hooks and port forwarding rules enforced by the generator.

## Decision Drivers

* **Selective Inclusion:** Students should only pay the CPU, memory, and network cost of services explicitly requested by their lesson manifest.
* **Local/Remote Parity:** The same fragments must work under Docker Desktop, VS Code Dev Containers, and Codespaces without conditional logic.
* **Maintainability:** Updating Supabase, Kafka, or Redis must be possible without touching unrelated templates or duplicating changes across the repo.
* **Customization:** Instructors need to override ports, environment variables, or versions when manifest requirements demand it.
* **Health Visibility:** Every service must declare health checks so the generator can set up `depends_on` conditions and avoid race conditions during startup.
* **Catalog Governance:** The service registry should remain authoritative, enabling stability flags and metadata surfaced by the CLI.

## Considered Options

* **Option A:** Single monolithic docker-compose.yml with profiles covering every service.
* **Option B:** Modular Compose fragments (services/<service>/docker-compose.<service>.yml) merged at generation time.
* **Option C:** Dev Container Features that install and start services inside the main container.
* **Option D:** External orchestration (Kubernetes, Helm, Kustomize).

## Decision Outcome

**Chosen option:** "Option B: Modular Compose fragments"

We standardized on a fragment-based approach. Each optional service lives in `services/<service>/` with a dedicated Compose document, README, and `.env` example. The CLI reads a registry describing available services and merges fragments into the base template during stack generation. The merge process preserves comments, rewrites conflicting ports, and augments the devcontainer configuration so services auto-start with health checks respected.

### Positive Consequences

* **Modularity:** Services ship as reusable fragments that can be combined in any lesson, independent from template structure.
* **Ease of Updates:** A service can be updated in one place and automatically reused across all templates that reference it.
* **Deterministic Generation:** The CLI produces the same output for a manifest regardless of the host environment, improving reproducibility.
* **Catalog Metadata:** Stability and owner metadata live in the registry and surface via CLI filtering, enabling platform governance.
* **Documentation Alignment:** Each fragment includes docs and `.env` samples so instructors know how to configure credentials.

### Negative Consequences

* **Merge Complexity:** The generator must parse YAML, merge documents, and preserve formatting, increasing maintenance of merge utilities.
* **Port Conflict Handling:** Automatic port reassignment adds logic, and contributors must understand the reserved port range.
* **Learning Curve:** New contributors must learn the fragment registry model before creating or modifying services.
* **Static Manifest:** Services must be declared up front; we cannot introspect application code to auto-select fragments.

## Pros and Cons of the Options

### Option A: Single Monolithic Compose File

Monolithic docker-compose with profiles for toggling services.

**Pros:**
* Straightforward structure with one file for all services.
* Native `profiles` support for selective start.

**Cons:**
* Forces every student to download and build every service image even when unused.
* Makes the compose file unwieldy and hard to review, obscuring which services matter for a given lesson.
* Tight coupling prevents independent versioning or release cadence per service.
* Port reservations must be hardcoded globally, amplifying conflicts.

### Option B: Modular Compose Fragments (Chosen)

Registry-driven fragments merged into base templates at generation time.

**Pros:**
* Services are reusable assets referenced from `catalog/services.json`, including stability metadata and documentation pointers.【F:catalog/services.json†L1-L139】
* Individual fragments encapsulate health checks, ports, and environment expectations (e.g., Supabase defines multiple services with readiness probes).【F:services/supabase/docker-compose.supabase.yml†L1-L63】
* Merge logic rewrites conflicting ports while preserving compose structure, enabling deterministic stacks.【F:tools/airnub-devc/src/lib/stacks.ts†L520-L591】【F:tools/airnub-devc/src/lib/stacks.ts†L598-L636】
* Devcontainer configuration is updated alongside compose, adding run services, port labels, and security warnings in one pass.【F:tools/airnub-devc/src/lib/stacks.ts†L780-L863】

**Cons:**
* Requires sophisticated YAML-aware merging code maintained in the CLI.【F:tools/airnub-devc/src/lib/stacks.ts†L520-L636】
* Contributors must publish new fragments through the registry flow before they are usable.【F:tools/airnub-devc/src/lib/services.ts†L27-L60】

### Option C: Dev Container Features for Services

Encapsulate services as Dev Container Features that run docker-compose or start daemons during container creation.

**Pros:**
* Leverages the official devcontainer feature distribution model.
* Allows reuse through the VS Code marketplace.

**Cons:**
* Features run during build/creation; they lack lifecycle controls and health checks required for reliable multi-service orchestration.
* Nesting docker-compose inside features complicates debugging and violates the catalog’s deterministic generation contract.
* No native mechanism for reassigning ports or coordinating with template-level forwarding.

### Option D: External Orchestration (Kubernetes/Helm)

Use Kubernetes manifests or Helm charts for optional services.

**Pros:**
* Industry-standard tooling with rich ecosystems.
* Allows advanced orchestration primitives (scaling, secrets management).

**Cons:**
* Adds massive complexity and assumes instructors understand K8s operations, which is unrealistic for classroom settings.
* Breaks parity between Docker-based Codespaces and local environments.
* Requires additional infrastructure (clusters) that is unavailable in many student workflows.

## Links

* [Service Registry](../../catalog/services.json)
* [Supabase Compose Fragment](../../services/supabase/docker-compose.supabase.yml)
* [Stack Merge Logic](../../tools/airnub-devc/src/lib/stacks.ts)
* [Service Registry Loader](../../tools/airnub-devc/src/lib/services.ts)
* Related: [ADR 0002: Hybrid Local and Remote Catalog Resolution](./0002-catalog-resolution.md)
* Related: [ADR 0003: Hardcoded Browser Sidecar Definitions](./0003-browser-sidecar-selection.md)
