# Coding Agent Prompt: Create Architecture Decision Records (ADRs)

## Mission Objective

Create **Architecture Decision Records (ADRs)** documenting key design decisions in the Airnub DevContainers Catalog project. ADRs provide a historical record of architectural choices, their context, rationale, and consequences, enabling future contributors to understand **why** the system is built the way it is.

---

## Target ADRs to Create

### ADR Directory Structure

```
docs/adr/
├── README.md                           # ADR index and process guide
├── 0001-compose-fragment-pattern.md   # Service composition strategy
├── 0002-catalog-resolution.md         # Local vs remote catalog handling
└── 0003-browser-sidecar-selection.md  # Browser integration approach
```

---

## ADR Format Standard

All ADRs must follow the **Michael Nygard ADR format** with these sections:

### Template Structure

```markdown
# [Number]. [Title in Title Case]

**Status:** [proposed | accepted | deprecated | superseded]

**Date:** YYYY-MM-DD

**Deciders:** [List of people involved, or "Platform Team"]

**Technical Story:** [Optional: Link to issue, PR, or epic]

---

## Context and Problem Statement

[Describe the architectural problem or decision that needs to be made.
Include relevant background, constraints, and forces at play.]

## Decision Drivers

* [Driver 1: business requirement, technical constraint, or quality attribute]
* [Driver 2]
* [Driver 3]

## Considered Options

* [Option 1]
* [Option 2]
* [Option 3]

## Decision Outcome

**Chosen option:** "[Option X]"

[Explain why this option was selected. Reference decision drivers.]

### Positive Consequences

* [Benefit 1]
* [Benefit 2]

### Negative Consequences

* [Drawback 1]
* [Drawback 2]

## Pros and Cons of the Options

### [Option 1]

[Brief description]

**Pros:**
* [Advantage 1]
* [Advantage 2]

**Cons:**
* [Disadvantage 1]
* [Disadvantage 2]

### [Option 2]

[Brief description]

**Pros:**
* [Advantage 1]

**Cons:**
* [Disadvantage 1]

### [Option 3]

[Brief description]

**Pros:**
* [Advantage 1]

**Cons:**
* [Disadvantage 1]

## Links

* [Related ADR](./0000-example.md)
* [GitHub Issue](https://github.com/org/repo/issues/123)
* [Documentation](../path/to/doc.md)
```

---

## ADR #1: Compose Fragment Pattern

### File: `docs/adr/0001-compose-fragment-pattern.md`

**Context to Include:**

This ADR should explain the decision to use **modular Docker Compose fragments** for optional services (Supabase, Redis, Kafka, etc.) rather than:
- A single monolithic docker-compose.yml
- Embedded service definitions in templates
- External package managers (Helm, Kustomize)
- Dev Container features for service management

**Key Points to Document:**

1. **Problem:** Students/educators need optional backing services (databases, message queues, workflow engines) that can be included on-demand in lesson environments.

2. **Requirements:**
   - Work identically in Codespaces and local Docker
   - Allow selective inclusion (not all lessons need all services)
   - Support customization (ports, env vars, versions)
   - Maintain health checks for startup readiness
   - Keep catalog maintainable (update one service without touching others)

3. **Considered Options:**
   - **Option A:** Single docker-compose.yml with all services (rejected: forces students to run everything)
   - **Option B:** Compose fragments (services/*.yml) merged at generation time (CHOSEN)
   - **Option C:** Dev Container features wrapping docker-compose (rejected: limited compose support in spec)
   - **Option D:** External orchestration (K8s, Helm) (rejected: too complex for classroom use)

4. **Decision Rationale:**
   - Compose fragments provide **modularity** without the complexity of orchestration
   - YAML merging preserves comments and formatting
   - Each fragment is self-contained with health checks
   - Easy to version and maintain independently
   - Compatible with Dev Container lifecycle hooks

5. **Consequences:**
   - **Positive:** Clean separation, easy to add new services, works in all environments
   - **Negative:** Requires custom YAML merging logic, potential port conflicts (mitigated by port allocation)

6. **Implementation Reference:**
   - Service registry: `catalog/services.json`
   - Fragment location: `services/*/docker-compose.*.yml`
   - Merge logic: `tools/airnub-devc/src/lib/stacks.ts` (mergeComposeDocument)

**Example Structure:**

```markdown
# 1. Use Docker Compose Fragments for Optional Services

**Status:** accepted

**Date:** 2024-10-15

**Deciders:** Platform Team

---

## Context and Problem Statement

Classroom lesson environments need optional backing services (databases, message queues,
workflow engines) that can be included selectively based on lesson requirements. The
solution must work identically in GitHub Codespaces and local Docker environments,
support easy customization, and remain maintainable as the catalog grows.

**Current Challenge:**
- Not all lessons need the same services (AI lesson needs PostgreSQL, data engineering
  lesson needs Kafka)
- Services must start in correct order with health checks
- Port conflicts must be avoided when multiple services are included
- Instructors need to customize environment variables and versions

## Decision Drivers

* **Selective Inclusion:** Only run services needed by the lesson (minimize resource usage)
* **Local Parity:** Must work identically on Codespaces and local Docker/Podman
* **Maintainability:** Service updates should not require touching all templates
* **Simplicity:** Instructors should understand service configuration without deep DevOps knowledge
* **Health Checks:** Services must report readiness for dependent startup order
* **Customization:** Allow per-lesson overrides (ports, versions, env vars)

## Considered Options

* **Option A:** Single monolithic docker-compose.yml with all services
* **Option B:** Modular Compose fragments merged at stack generation time
* **Option C:** Dev Container features wrapping docker-compose
* **Option D:** Kubernetes/Helm for orchestration

## Decision Outcome

**Chosen option:** "Option B: Modular Compose fragments"

We adopt a **service fragment pattern** where each optional service lives in
`services/<service-name>/docker-compose.<service-name>.yml`. When generating a stack,
the CLI merges requested fragments into the base template's docker-compose.yml while
preserving comments and handling port conflicts.

### Positive Consequences

* **Modularity:** Each service is self-contained with its own health checks, env vars, and README
* **Maintainability:** Update Supabase without touching Redis or Kafka configurations
* **Selective Loading:** Only requested services are materialized in the workspace
* **Version Control:** Each fragment can be versioned independently via `services.json`
* **Discovery:** Service registry provides metadata (stability, ports, owners, docs)
* **Local Parity:** Works identically on Docker Compose v2 everywhere (no cloud-specific features)

### Negative Consequences

* **Custom Merge Logic:** Requires YAML-aware merging to preserve comments and structure
* **Port Conflicts:** Requires automatic port reassignment when fragments collide (mitigated by 45000-49999 reserved range)
* **Learning Curve:** Contributors must understand the fragment + registry pattern
* **No Dynamic Discovery:** Services must be explicitly listed in generation request (not auto-detected from code)

## Pros and Cons of the Options

### Option A: Single Monolithic Compose File

**Description:** One `docker-compose.yml` with all possible services, using profiles to
enable/disable them.

**Pros:**
* Simple: everything in one file
* Native Docker Compose profiles support

**Cons:**
* **Resource Waste:** Students must download all images even if unused
* **Clutter:** 200+ line compose file with unused services confuses beginners
* **No Independent Versioning:** Updating one service requires careful testing of all others
* **Port Hardcoding:** All ports must be pre-allocated, limiting flexibility

### Option B: Modular Compose Fragments (CHOSEN)

**Description:** Each service lives in `services/<name>/docker-compose.<name>.yml`.
The CLI merges requested fragments into the base template at generation time.

**Pros:**
* **Selective Loading:** Only include needed services
* **Clean Separation:** Each service has its own directory with README, .env.example, health checks
* **Independent Updates:** Change Kafka version without retesting Supabase
* **Stability Classification:** Mark services as stable/experimental/deprecated via registry
* **Port Allocation:** Automatically reassign conflicting ports to 45000-49999 range
* **Comment Preservation:** YAML merging retains original comments and formatting

**Cons:**
* **Merge Complexity:** Requires custom logic to merge services, volumes, networks (implemented via `yaml` library)
* **Static Manifest:** Services must be declared at generation time, not dynamically discovered
* **Debugging:** Instructors must understand which fragments were merged if issues occur

### Option C: Dev Container Features for Services

**Description:** Wrap each service as a Dev Container feature that starts docker-compose
internally.

**Pros:**
* Uses official Dev Container spec mechanism
* Feature marketplace distribution

**Cons:**
* **Limited Compose Support:** Features run during container creation, not ideal for long-lived services
* **No Native Lifecycle:** Features lack equivalent of `depends_on` and health checks
* **Nesting Confusion:** Running docker-compose inside a Dev Container feature is non-standard
* **Debugging:** Two layers of abstraction (feature + compose) complicates troubleshooting

### Option D: Kubernetes/Helm for Orchestration

**Description:** Use Kubernetes manifests or Helm charts for service management.

**Pros:**
* Industry-standard orchestration
* Rich ecosystem of charts

**Cons:**
* **Massive Complexity:** Instructors need K8s knowledge (clusters, deployments, services, ingress)
* **Local Parity Breaks:** Codespaces uses Docker, local K8s (kind/minikube) differs significantly
* **Overhead:** K8s control plane too heavy for single-user lesson environments
* **Poor Fit:** Dev Containers are Docker-centric; K8s is overkill for classroom use

## Implementation Details

### Service Registry Structure

Services are cataloged in `catalog/services.json`:

```json
{
  "services": [
    {
      "id": "supabase",
      "label": "Supabase (Postgres + REST + Realtime + Studio)",
      "templatePath": "services/supabase",
      "stability": "stable",
      "ports": [54322, 54323, 54324, 54325],
      "docs": "services/supabase/README.md"
    },
    {
      "id": "kafka",
      "label": "Apache Kafka (KRaft mode)",
      "templatePath": "services/kafka",
      "stability": "experimental",
      "since": "0.2.0"
    }
  ]
}
```

### Fragment Example (Supabase)

`services/supabase/docker-compose.supabase.yml`:

```yaml
services:
  supabase-db:
    image: supabase/postgres:15.1.1.67
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-supabase}
    ports: ["54322:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -h localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Merge Process

1. Load base template `docker-compose.yml` from template (e.g., `templates/nextjs-supabase`)
2. Materialize requested service fragments to `.devc/services/<name>/`
3. Parse base compose as YAML AST (preserves comments)
4. For each fragment:
   - Parse fragment YAML
   - Merge `services:` section (add new services, skip if name exists)
   - Merge `volumes:`, `networks:`, `configs:`, `secrets:` top-level keys
   - Detect and reassign conflicting ports to 45000-49999 range
5. Serialize merged YAML with preserved formatting
6. Write to workspace `docker-compose.yml`

### Port Conflict Resolution

When a browser sidecar or service wants port 8080 but it's already used:

1. Detect conflict by scanning `forwardPorts` (devcontainer.json) and `ports` (compose services)
2. Allocate next available port in range 45000-49999
3. Rewrite service `ports:` mapping: `"45000:8080"`
4. Update `forwardPorts` and `portsAttributes` in devcontainer.json
5. Log warning: `"Port 8080 for Neko Chrome reassigned to 45000"`

## Alternative Patterns Considered

### Pattern: Embedded Services in Templates

**Approach:** Each template (nextjs-supabase, python-airflow) bundles its required
services directly in docker-compose.yml.

**Why Rejected:**
- **Duplication:** Supabase config copied across 5 templates → maintenance nightmare
- **No Sharing:** Can't reuse service definitions across templates
- **Bloat:** Templates become huge with embedded services

### Pattern: Submodules for Services

**Approach:** Git submodules for each service (services/supabase as separate repo).

**Why Rejected:**
- **Complexity:** Instructors must manage submodule updates (`git submodule update --recursive`)
- **Versioning Confusion:** Submodule commits don't align with catalog versions
- **Catalog Coupling:** Services are tightly integrated with catalog structure, not truly independent

## Links

* [Service Registry Documentation](../services/README.md)
* [Compose Merge Implementation](../../tools/airnub-devc/src/lib/stacks.ts#L541)
* [Platform Architecture](../platform-architecture.md)
* Related: [ADR 0003: Browser Sidecar Selection](#) (port allocation strategy)
```

---

## ADR #2: Catalog Resolution Strategy

### File: `docs/adr/0002-catalog-resolution.md`

**Context to Include:**

This ADR should explain the decision to support **both local and remote catalog resolution** rather than:
- Local-only development
- Remote-only (always fetch from GitHub)
- Package registry distribution (npm, Docker registry)

**Key Points to Document:**

1. **Problem:** Developers and instructors need access to the catalog (templates, features, services) in different scenarios:
   - Contributors working on the catalog itself (local)
   - Educators using the CLI without cloning the repo (remote)
   - CI pipelines building lesson images (remote, but cached)

2. **Requirements:**
   - Support both local development and remote consumption
   - Cache remote catalogs to avoid repeated downloads
   - Verify integrity of remote catalogs (checksums)
   - Allow pinning to specific versions (refs/tags)
   - Graceful fallback when offline

3. **Considered Options:**
   - **Option A:** Local-only (rejected: requires cloning 500MB+ repo)
   - **Option B:** Remote-only, always fetch (rejected: slow, requires network)
   - **Option C:** Hybrid local + remote with caching (CHOSEN)
   - **Option D:** Package registry (npm publish @airnub/catalog) (rejected: versioning complexity)

4. **Decision Rationale:**
   - Hybrid approach supports both contributor and consumer workflows
   - Caching with SHA256 verification ensures integrity
   - Supports versioning via Git refs (main, v1.2.0, feature branches)
   - Discoverable catalog root for monorepo contributors

5. **Consequences:**
   - **Positive:** Flexible, works offline (cached), verifiable integrity
   - **Negative:** Requires cache management, adds complexity to resolution logic

6. **Implementation Reference:**
   - Resolution logic: `tools/airnub-devc/src/lib/catalog.ts` (resolveCatalog)
   - Cache location: `~/.cache/airnub-devc/<ref>/`
   - Discovery: Walks up from CWD looking for `templates/` directory

**Example Structure:**

```markdown
# 2. Hybrid Local and Remote Catalog Resolution

**Status:** accepted

**Date:** 2024-10-20

**Deciders:** Platform Team

---

## Context and Problem Statement

The Dev Containers catalog contains templates, features, services, and schemas totaling
~500MB. Different personas access the catalog in different contexts:

- **Contributors** actively develop templates and features (need local changes)
- **Educators** generate lesson stacks using the CLI (don't want to clone repo)
- **CI Pipelines** build lesson images (need cached, verifiable catalog)
- **Offline Users** work in networks without GitHub access (need cached copy)

How do we enable all these workflows without forcing everyone to clone the full repository?

## Decision Drivers

* **Contributor Experience:** Must support local development with instant feedback on changes
* **Consumer Convenience:** Educators shouldn't clone 500MB repo to use the CLI
* **Integrity Verification:** Remote catalogs must be tamper-proof (SHA256 checksums)
* **Versioning:** Support pinning to specific catalog versions (Git refs/tags)
* **Offline Support:** Cached catalog should work without network access
* **Discoverability:** Auto-detect local catalog when running CLI from within the repo
* **Performance:** Avoid re-downloading catalog on every CLI invocation

## Considered Options

* **Option A:** Local-only (require git clone)
* **Option B:** Remote-only (always fetch from GitHub)
* **Option C:** Hybrid local + remote with caching (SHA256 verified)
* **Option D:** Package registry (npm publish @airnub/catalog)

## Decision Outcome

**Chosen option:** "Option C: Hybrid local + remote with SHA256-verified caching"

We implement a **three-tier resolution strategy**:

1. **Explicit `--catalog-root`:** Use provided path if specified
2. **Local Discovery:** Walk up from CWD, look for `templates/` directory (for contributors)
3. **Remote Fetch:** Download tarball from GitHub, cache at `~/.cache/airnub-devc/<ref>/`

Remote catalogs are verified with SHA256 checksums stored in `.airnub-cache/catalog.tar.gz.sha256`.
If the checksum mismatches, the cache is invalidated and re-downloaded.

### Positive Consequences

* **Flexible:** Supports contributor (local) and consumer (remote) workflows
* **Fast:** Cached catalogs load instantly after first download
* **Verifiable:** SHA256 checksums prevent corruption/tampering
* **Versioned:** Pin to `--catalog-ref=v1.2.0` for reproducible builds
* **Offline:** Cached catalog works without network once downloaded
* **Discoverable:** CLI auto-detects local catalog when run from repo checkout

### Negative Consequences

* **Cache Management:** Users may need to manually clear `~/.cache/airnub-devc/` if corrupted
* **Disk Usage:** Each ref consumes ~50MB compressed (mitigated by ref sanitization)
* **Complexity:** Resolution logic has three paths instead of one
* **Stale Cache:** Users may unknowingly use old cached catalog (mitigated by checksum validation)

## Pros and Cons of the Options

### Option A: Local-Only (Require Git Clone)

**Description:** All users must `git clone` the catalog repo before using the CLI.

**Pros:**
* **Simple:** Single code path, no caching logic
* **Always Fresh:** Users always have the latest changes
* **No Integrity Concerns:** Git handles verification

**Cons:**
* **Large Download:** 500MB+ repo with history (prohibitive for casual users)
* **Contributor-Only:** Educators just want to generate stacks, not maintain a clone
* **CI Overhead:** Every pipeline must clone full repo (slow, quota-consuming)
* **Offline Fails:** Can't use CLI without local clone

### Option B: Remote-Only (Always Fetch)

**Description:** CLI always downloads catalog from GitHub on every invocation.

**Pros:**
* **No Stale Data:** Always fetches latest
* **No Cache Management:** Stateless

**Cons:**
* **Network Dependency:** Requires internet on every run (breaks offline use)
* **Slow:** 2-5 seconds download latency per invocation
* **Rate Limiting:** GitHub API throttles frequent fetches
* **Wasteful:** Re-downloads unchanged catalog repeatedly

### Option C: Hybrid Local + Remote with Caching (CHOSEN)

**Description:** Three-tier resolution: explicit path → local discovery → remote cached.

**Pros:**
* **Best of Both Worlds:** Contributors use local, consumers use cached remote
* **Fast:** Cached remote loads in <100ms
* **Offline Support:** Works with cached copy
* **Verifiable:** SHA256 checksum validation
* **Versioned:** Supports `--catalog-ref` for pinning
* **Auto-Discovery:** Detects local catalog for contributors

**Cons:**
* **Complexity:** Three code paths to maintain
* **Cache Stale Risk:** Users may not realize cache is old (mitigated by `--force-refresh` flag)
* **Disk Usage:** Multiple refs consume space (mitigated by ref sanitization)

### Option D: Package Registry (npm publish)

**Description:** Publish catalog as npm package (`@airnub/catalog`), install via npm.

**Pros:**
* **Standard Distribution:** Uses familiar npm tooling
* **Versioning:** Semantic versioning via npm

**Cons:**
* **Binary Size:** npm packages >100MB are problematic
* **Publish Overhead:** Requires npm publish on every catalog change (CI complexity)
* **Versioning Mismatch:** npm versions vs Git tags create confusion
* **No Transient Refs:** Can't use `--catalog-ref=feature-branch` (only published versions)
* **Dependency Pollution:** Adds catalog as dependency to every project

## Implementation Details

### Resolution Algorithm

```typescript
export async function resolveCatalog(options: CatalogOptions): Promise<CatalogContext> {
  // 1. Explicit path (highest priority)
  if (options.catalogRoot) {
    const resolved = path.resolve(options.catalogRoot);
    if (!await fs.pathExists(resolved)) {
      throw new Error(`Catalog root not found: ${resolved}`);
    }
    return { root: resolved, mode: "local", ref: "local" };
  }

  // 2. Local discovery (walk up from CWD)
  const discovered = discoverCatalogRoot();
  if (discovered) {
    return { root: discovered, mode: "local", ref: "local" };
  }

  // 3. Remote fetch (with caching)
  const ref = options.catalogRef ?? "main";
  const cacheDir = path.join(os.homedir(), ".cache", "airnub-devc", sanitizeRef(ref));

  if (await fs.pathExists(cacheDir)) {
    const valid = await verifyCachedCatalog(cacheDir).catch(() => false);
    if (!valid) {
      await fs.remove(cacheDir); // Invalidate corrupted cache
    }
  }

  if (!await fs.pathExists(cacheDir)) {
    await downloadCatalog(ref, cacheDir);
  }

  return { root: cacheDir, mode: "remote", ref };
}
```

### Cache Directory Structure

```
~/.cache/airnub-devc/
├── main/                                  # Cached main branch
│   ├── .airnub-cache/
│   │   ├── catalog.tar.gz                # Downloaded tarball
│   │   └── catalog.tar.gz.sha256         # Integrity checksum
│   ├── templates/
│   ├── features/
│   └── services/
├── v1.2.0/                                # Cached v1.2.0 tag
└── feature_awesome-browsers/             # Cached feature branch (sanitized)
```

### Integrity Verification

**Download Process:**
1. Fetch `https://codeload.github.com/airnub-labs/devcontainers-catalog/tar.gz/{ref}`
2. Stream to temp file while computing SHA256 hash
3. Extract tarball to temp directory
4. Move extracted catalog to cache directory
5. Store tarball and SHA256 in `.airnub-cache/`

**Verification Process:**
1. Check if `.airnub-cache/catalog.tar.gz` exists
2. Read recorded SHA256 from `.airnub-cache/catalog.tar.gz.sha256`
3. Recompute SHA256 of tarball
4. If mismatch → invalidate cache, re-download
5. If match → use cached catalog

### Ref Sanitization

Git refs may contain characters invalid for filesystem paths:

```typescript
function sanitizeRef(ref: string): string {
  return ref.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Examples:
// "main" → "main"
// "v1.2.0" → "v1.2.0"
// "feature/awesome-browsers" → "feature_awesome-browsers"
```

### Local Discovery Algorithm

```typescript
export function discoverCatalogRoot(): string | null {
  let current = process.cwd();
  while (current !== path.parse(current).root) {
    const candidate = path.join(current, "templates");
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return current;
    }
    current = path.dirname(current);
  }
  return null;
}
```

### CLI Options

```bash
# Use local catalog (explicit path)
devc generate --catalog-root=/path/to/catalog lesson.yaml

# Use cached main branch (default)
devc generate lesson.yaml

# Use specific version
devc generate --catalog-ref=v1.2.0 lesson.yaml

# Use feature branch
devc generate --catalog-ref=feature/new-template lesson.yaml

# Force refresh cache (ignore cached copy)
devc generate --force-refresh lesson.yaml
```

## Security Considerations

### Tarball Verification

**Threat:** Attacker could tamper with cached tarball or MITM the download.

**Mitigation:**
- SHA256 checksum verification on every load
- If mismatch detected → invalidate cache, re-download from GitHub (trusted source)
- Cache stored in user-specific directory (`~/.cache/`) with standard permissions

**Not Mitigated:**
- Initial download over HTTP (GitHub uses HTTPS, but theoretically vulnerable to MITM)
- No GPG signature verification (future enhancement)

### Ref Injection

**Threat:** User provides malicious ref like `../../../../etc/passwd`.

**Mitigation:**
- Ref sanitization replaces all non-alphanumeric (except `._-`) with `_`
- Cache directory is always under `~/.cache/airnub-devc/`
- No path traversal possible

## Links

* [Catalog Resolution Implementation](../../tools/airnub-devc/src/lib/catalog.ts)
* [Cache Verification Tests](../../tools/airnub-devc/src/lib/__tests__/catalog.spec.ts)
* [Platform Architecture](../platform-architecture.md)
* Related: [ADR 0001: Compose Fragment Pattern](#) (uses catalog resolution)
```

---

## ADR #3: Browser Sidecar Selection

### File: `docs/adr/0003-browser-sidecar-selection.md`

**Context to Include:**

This ADR should explain the decision to use **hardcoded browser sidecar definitions** rather than:
- Dynamic discovery from Docker registries
- User-provided custom browser images
- Template-embedded browser configs
- Browser features (like Supabase is a feature)

**Key Points to Document:**

1. **Problem:** Students need access to Chrome/Firefox with DevTools for web development lessons. Solutions must work in Codespaces (WebRTC restrictions) and locally.

2. **Requirements:**
   - Support multiple browser technologies (noVNC, Neko, Kasm, Webtop)
   - Handle Codespaces networking limitations (no UDP for WebRTC)
   - Provide stable, classroom-tested configurations
   - Allow port customization (automatic conflict resolution)
   - Enable experimental browsers without breaking production stacks

3. **Considered Options:**
   - **Option A:** Hardcoded browser sidecar list (CHOSEN)
   - **Option B:** Dynamic discovery from Docker registry tags
   - **Option C:** User-provided custom browser compose files
   - **Option D:** Browser as Dev Container features

4. **Decision Rationale:**
   - Hardcoded list provides **stability** (tested configurations)
   - Allows **stability classification** (stable/experimental)
   - Enables **platform-specific notes** (Codespaces vs local networking)
   - Simplifies UX (select by ID, not configure from scratch)
   - Facilitates **breaking change management** (deprecate old browsers)

5. **Consequences:**
   - **Positive:** Stable, tested, easy to use, clear upgrade path
   - **Negative:** Requires catalog update to add new browsers, less flexible for power users

6. **Implementation Reference:**
   - Browser definitions: `tools/airnub-devc/src/lib/services.ts` (BROWSER_SIDECARS)
   - Selection logic: `parseBrowserSelection()`
   - Port allocation: `allocateBrowserPorts()`

**Example Structure:**

```markdown
# 3. Hardcoded Browser Sidecar Definitions

**Status:** accepted

**Date:** 2024-11-01

**Deciders:** Platform Team

**Technical Story:** Issue #50 (Browser sidecar templates), Issue #52 (Classroom overrides)

---

## Context and Problem Statement

Web development lessons require students to access Chrome/Firefox with DevTools Protocol
for debugging, performance profiling, and testing. Browsers must run in the dev container
environment (not student's local machine) to ensure consistent behavior.

**Challenges:**
- GitHub Codespaces does not forward UDP (breaks WebRTC for low-latency remoting)
- Multiple browser remoting technologies exist (noVNC, Neko, Kasm, Webtop) with different tradeoffs
- Port conflicts when multiple browser sidecars or services are added to a stack
- Security: Default passwords must be overridden before sharing workspaces
- Experimental browsers (Firefox remote debugging) need opt-in to avoid breaking production

How do we provide a curated set of browser options that work reliably across environments?

## Decision Drivers

* **Reliability:** Browsers must be classroom-tested and known to work in Codespaces/local
* **Stability Classification:** Clearly distinguish stable (Chrome) from experimental (Firefox)
* **Security:** Warn instructors about default credentials and required env vars
* **Port Conflict Resolution:** Automatically reassign ports when browsers collide
* **Platform Adaptation:** Handle Codespaces networking limits (no UDP, TCP mux fallback)
* **Upgrade Path:** Allow deprecating old browser versions while maintaining backward compatibility
* **Ease of Use:** Instructors select browsers by ID, not by configuring compose from scratch

## Considered Options

* **Option A:** Hardcoded browser sidecar definitions in catalog
* **Option B:** Dynamic discovery from Docker registry tags
* **Option C:** User-provided custom browser Docker Compose files
* **Option D:** Browsers as Dev Container features

## Decision Outcome

**Chosen option:** "Option A: Hardcoded browser sidecar definitions"

We define a **curated list of browser sidecars** in `tools/airnub-devc/src/lib/services.ts`
as the `BROWSER_SIDECARS` constant. Each sidecar includes:

- **ID:** Unique identifier (e.g., `neko-chrome`, `kasm-chrome`)
- **Label:** Human-readable name
- **Template Path:** Location of docker-compose.yml fragment
- **Service Name:** Docker Compose service name
- **Ports:** Required port mappings
- **Port Labels:** Descriptions for forwarded ports
- **Required Env Vars:** Secrets that must be set (e.g., `NEKO_USER_PASSWORD`)
- **Stability:** `stable` | `experimental` | `deprecated`
- **Platform Notes:** Codespaces-specific and local-specific guidance

### Positive Consequences

* **Curated Quality:** Only classroom-tested browsers are available (reduces support burden)
* **Stability Gates:** Experimental browsers require `--include-experimental` flag (prevents accidental breakage)
* **Security Warnings:** CLI warns about missing passwords and default credentials
* **Port Automation:** Conflicting ports are auto-reassigned to 45000-49999 range
* **Platform Awareness:** Notes guide instructors on Codespaces UDP limits and local optimizations
* **Upgrade Management:** Deprecate old browsers while maintaining compatibility

### Negative Consequences

* **Limited Flexibility:** Power users can't easily add custom browsers without modifying catalog
* **Catalog Coupling:** New browsers require catalog update + CLI release
* **Maintenance:** Browser image updates need testing across Codespaces and local environments
* **Discoverability:** Users must know browser IDs (mitigated by `devc list-browsers` command)

## Pros and Cons of the Options

### Option A: Hardcoded Browser Sidecar Definitions (CHOSEN)

**Description:** Catalog defines list of supported browsers with metadata (ports, env vars,
stability). CLI validates selection and provides warnings.

**Pros:**
* **Tested Configurations:** Every browser is validated in Codespaces + local before release
* **Stability Control:** Mark unstable browsers as experimental (opt-in)
* **Security Checks:** CLI warns about missing credentials before stack creation
* **Platform Adaptation:** Codespaces-specific notes (TCP mux for WebRTC)
* **Versioning:** Deprecate old browsers without breaking existing stacks (catalog version pins)

**Cons:**
* **Catalog Updates Required:** Adding a browser needs PR to catalog
* **Limited Customization:** Users can't tweak browser configs without forking
* **Centralized Maintenance:** Platform team must keep browser images updated

### Option B: Dynamic Discovery from Docker Registry

**Description:** CLI queries Docker registries (e.g., GHCR, Docker Hub) for images tagged
with `devcontainer-browser` label, auto-discovers capabilities.

**Pros:**
* **Decentralized:** Third parties can publish browsers without catalog changes
* **Always Fresh:** New browsers appear automatically

**Cons:**
* **No Quality Control:** Untested browsers could break student environments
* **Security Risk:** Malicious images could be discovered and used
* **Metadata Gaps:** Images may not expose required env vars or platform notes
* **Port Conflicts:** No central registry of port allocations (collisions likely)
* **Slow Discovery:** Querying registries adds latency to CLI startup

### Option C: User-Provided Custom Browser Compose Files

**Description:** Instructors provide their own `docker-compose.browser.yml` files alongside
lesson manifests.

**Pros:**
* **Maximum Flexibility:** Full control over browser configuration
* **No Catalog Dependency:** Works with any Docker image

**Cons:**
* **Expert-Only:** Requires Docker Compose + networking expertise
* **No Validation:** CLI can't warn about Codespaces UDP limits or missing passwords
* **Port Conflicts:** Manual port management (no automatic reassignment)
* **Fragmentation:** Every instructor invents their own browser setup (poor reusability)
* **Support Burden:** Platform team must debug arbitrary custom configurations

### Option D: Browsers as Dev Container Features

**Description:** Wrap each browser as a Dev Container feature that installs/starts the
browser during container creation.

**Pros:**
* **Spec-Compliant:** Uses official Dev Container features mechanism
* **Marketplace Distribution:** Can publish to VS Code feature marketplace

**Cons:**
* **Lifecycle Mismatch:** Features run at image build time, browsers should run at container start
* **No Service Dependencies:** Features lack `depends_on` equivalent for service ordering
* **Networking Complexity:** Features can't easily declare forwarded ports with labels
* **Debugging:** Mixing features + compose makes troubleshooting harder

## Implementation Details

### Browser Sidecar Definition

```typescript
export type BrowserSidecar = {
  id: string;                      // Unique identifier (e.g., "neko-chrome")
  label: string;                   // Human-readable name
  templatePath: string;            // Path to compose fragment (e.g., "templates/classroom-neko-webrtc/.template")
  serviceName: string;             // Docker Compose service name (e.g., "neko")
  ports: number[];                 // Required ports
  portLabels: Record<number, { label: string; onAutoForward: "openBrowser" | "silent" }>;
  containerEnv?: Record<string, string>;   // Default env vars (e.g., default passwords)
  requiredEnv?: string[];          // Env vars that MUST be set (e.g., ["NEKO_USER_PASSWORD"])
  experimental?: boolean;          // Requires --include-experimental
  notes?: string[];                // General usage notes
  compatibility?: {
    codespaces?: { notes?: string[] };  // Codespaces-specific guidance
    local?: { notes?: string[] };        // Local Docker guidance
  };
};
```

### Supported Browsers (as of v0.2.0)

| ID | Label | Technology | Stability | Codespaces UDP |
|----|-------|-----------|-----------|----------------|
| `neko-chrome` | Neko Chrome (WebRTC) | Neko/WebRTC | stable | TCP mux fallback |
| `neko-firefox` | Neko Firefox (WebRTC) | Neko/WebRTC | experimental | TCP mux fallback |
| `kasm-chrome` | Kasm Chrome | KasmVNC/HTTPS | stable | N/A (HTTPS only) |

### Selection Validation

```typescript
export function parseBrowserSelection(options: {
  withBrowsersCsv?: string;
  withBrowser?: string[];
  includeExperimental?: boolean;
}): BrowserSidecar[] {
  const ids = new Set<string>();

  // Parse CSV and array inputs
  if (options.withBrowsersCsv) {
    options.withBrowsersCsv.split(",").forEach(id => ids.add(id.trim()));
  }
  options.withBrowser?.forEach(id => ids.add(id.trim()));

  // Validate each ID
  const selected: BrowserSidecar[] = [];
  for (const id of ids) {
    const browser = getBrowserSidecar(id);

    if (!browser) {
      throw new Error(`Unknown browser sidecar: ${id}`);
    }

    if (browser.experimental && !options.includeExperimental) {
      throw new Error(
        `${browser.label} (${browser.id}) is experimental. ` +
        `Pass --include-experimental to opt into experimental sidecars.`
      );
    }

    selected.push(browser);
  }

  return selected;
}
```

### Port Conflict Resolution

When generating a stack with multiple browsers or services:

1. **Collect Used Ports:**
   - Parse `forwardPorts` from base template devcontainer.json
   - Parse `ports` from all services in docker-compose.yml

2. **Allocate Browser Ports:**
   - For each browser, check if its desired ports are already used
   - If conflict detected, allocate next available port in range 45000-49999
   - Update port mappings in browser's docker-compose fragment
   - Update `forwardPorts` and `portsAttributes` in devcontainer.json

3. **Log Reassignments:**
   - Add note to merge plan: `"Port 8080 for Neko Chrome reassigned to 45000"`
   - Instructor sees warnings before committing stack

**Example:**
```typescript
// Base template uses 8080 for Next.js dev server
// Neko Chrome also wants 8080 for UI

const { allocations, notes } = allocateBrowserPorts(
  [nekoChromeSidecar],
  new Set([8080]) // already used
);

// Result:
// allocations[0].portMap = Map { 8080 => 45000, 59000 => 59000 }
// notes = ["Port 8080 for Neko Chrome (Web UI) reassigned to 45000."]
```

### Security Warnings

Before generating a stack, CLI checks for:

1. **Default Credentials:** Browser defines `containerEnv` with default password
   - ⚠️ Warning: `"Neko Chrome uses default credential NEKO_USER_PASSWORD; override it before sharing."`

2. **Missing Required Env:** Browser requires env var not set in devcontainer
   - ⚠️ Warning: `"Neko Chrome requires NEKO_USER_PASSWORD. Provide via containerEnv or Codespaces secrets."`

3. **School Mode Conflict:** `schoolMode: true` + public/org port visibility
   - ❌ Error: `"schoolMode=true forbids public or org-visible ports"`

### Platform-Specific Notes

```typescript
// Neko Chrome definition
{
  id: "neko-chrome",
  compatibility: {
    codespaces: {
      notes: ["Codespaces proxies do not forward UDP; this sidecar stays on TCP mux by default."]
    },
    local: {
      notes: ["Expose UDP 59000 and set NEKO_WEBRTC_UDPMUX=59000 locally for lower latency."]
    }
  }
}
```

When generating for Codespaces (`process.env.CODESPACES === "true"`), only Codespaces
notes are shown. Locally, only local notes appear.

### Stability Lifecycle

**Stable → Experimental → Deprecated → Removed**

1. **Experimental:** New browser requires `--include-experimental`
   ```typescript
   { id: "neko-firefox", experimental: true }
   ```

2. **Stable:** After 2+ releases with no critical bugs, promote to stable
   ```typescript
   { id: "neko-firefox", experimental: false, since: "0.3.0" }
   ```

3. **Deprecated:** When superseded by better option, mark deprecated
   ```typescript
   { id: "neko-chrome-old", stability: "deprecated", notes: ["Use neko-chrome instead."] }
   ```

4. **Removed:** After 2+ releases deprecated, remove from catalog

### CLI Commands

```bash
# List available browsers
devc list-browsers
# Output:
# Available browsers:
#   neko-chrome      Neko (WebRTC) Chrome [stable]
#   kasm-chrome      Kasm Chrome (KasmVNC) [stable]
#   neko-firefox     Neko (WebRTC) Firefox [experimental]

# Generate with browser
devc generate examples/lesson.yaml --browser=neko-chrome

# Generate with experimental browser
devc generate examples/lesson.yaml --browser=neko-firefox --include-experimental

# Generate with multiple browsers
devc generate examples/lesson.yaml --browser=neko-chrome --browser=kasm-chrome
```

## Future Enhancements

### Browser Capability Detection

Add structured capabilities to browser definitions:

```typescript
{
  id: "neko-chrome",
  capabilities: {
    devtools: { protocol: "chrome-devtools-protocol", port: 9222 },
    recorder: true,
    extensions: false
  }
}
```

CLI could validate lesson requirements: `"This lesson requires DevTools Protocol support"`

### Browser Version Pinning

Support version ranges in browser selection:

```bash
devc generate lesson.yaml --browser=neko-chrome@1.x
```

### Third-Party Browser Registration

Allow community browsers via external registry:

```bash
devc add-browser-source https://example.com/browsers.json
devc generate lesson.yaml --browser=custom-firefox
```

## Links

* [Browser Sidecar Definitions](../../tools/airnub-devc/src/lib/services.ts#L128)
* [Port Allocation Logic](../../tools/airnub-devc/src/lib/stacks.ts#L415)
* [Selection Tests](../../tools/airnub-devc/src/lib/__tests__/stacks.spec.ts)
* [Classroom Overrides Issue](https://github.com/airnub-labs/devcontainers-catalog/issues/52)
* Related: [ADR 0001: Compose Fragment Pattern](#) (browser sidecars are compose fragments)
* Related: [ADR 0002: Catalog Resolution](#) (browsers resolved from catalog)
```

---

## ADR Index File

### File: `docs/adr/README.md`

Create an index file that lists all ADRs and explains the process:

```markdown
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
```

---

## Implementation Guidelines

### General Principles

1. **Write for Future Contributors:**
   - Assume readers join the project 2 years from now
   - Explain context that may be obvious today but forgotten tomorrow
   - Document rejected alternatives (prevent re-litigating settled decisions)

2. **Be Objective, Not Defensive:**
   - Acknowledge tradeoffs and negative consequences
   - Don't oversell the chosen approach
   - Document what you wish you could do differently (if constraints allowed)

3. **Use Evidence, Not Opinions:**
   - "We chose X because benchmarks showed Y" (good)
   - "We chose X because it felt right" (bad)
   - Reference issues, PRs, performance data, user feedback

4. **Update ADRs When Context Changes:**
   - If an assumption is invalidated, update the "Context" section
   - If a better option emerges, create a new ADR that supersedes the old one
   - Never delete old ADRs (they're historical records)

### Writing Quality Standards

- ✅ Clear problem statement (anyone can understand the challenge)
- ✅ At least 3 alternatives considered (shows thorough evaluation)
- ✅ Pros and cons for each alternative (balanced analysis)
- ✅ Decision rationale references decision drivers (logical connection)
- ✅ Consequences are honest (acknowledge negatives)
- ✅ Links to code, issues, docs (verifiable)
- ✅ Examples where applicable (concrete, not abstract)

### Code Quality Standards

- ✅ ADRs stored in `docs/adr/` directory
- ✅ Numbered sequentially (0001, 0002, 0003, ...)
- ✅ Filenames use kebab-case: `NNNN-short-title.md`
- ✅ Index file (`README.md`) lists all ADRs in table
- ✅ Status field is one of: proposed | accepted | deprecated | superseded
- ✅ Date field uses ISO 8601 format (YYYY-MM-DD)

---

## Success Criteria

### Deliverables

- [ ] `docs/adr/` directory created
- [ ] `docs/adr/README.md` - ADR index and process guide
- [ ] `docs/adr/0001-compose-fragment-pattern.md` - ~600 lines
- [ ] `docs/adr/0002-catalog-resolution.md` - ~500 lines
- [ ] `docs/adr/0003-browser-sidecar-selection.md` - ~700 lines

### Quality Checklist

- [ ] Each ADR follows Michael Nygard format
- [ ] Problem statements are clear and specific
- [ ] At least 3 alternatives documented per decision
- [ ] Decision rationale references decision drivers
- [ ] Positive and negative consequences acknowledged
- [ ] Code references (file:line) included for implementation
- [ ] Links to related ADRs, issues, docs included
- [ ] Examples provided where applicable
- [ ] Markdown lint passes (`markdownlint docs/adr/*.md`)

### Validation Steps

```bash
# 1. Verify file structure
ls -la docs/adr/
# Should show: README.md, 0001-*.md, 0002-*.md, 0003-*.md

# 2. Check Markdown formatting
npx markdownlint docs/adr/*.md

# 3. Verify internal links
# (Manual check: click all links in ADRs to ensure they resolve)

# 4. Review completeness
# - Each ADR has all required sections
# - Status is "accepted" for implemented decisions
# - Dates are ISO 8601 format

# 5. Integration test: Reference ADRs in code comments
# Add comments like:
# // See ADR 0001 for why we use compose fragments
# // See ADR 0002 (catalog-resolution.md) for cache strategy
```

---

## Notes for the Agent

### What NOT to Do

- ❌ Don't create generic, template-only ADRs (fill in ALL sections with real content)
- ❌ Don't omit negative consequences (be honest about tradeoffs)
- ❌ Don't skip alternatives analysis (must have 3+ options considered)
- ❌ Don't write opinions without evidence ("X is better" → "X scored 2x faster in benchmarks")
- ❌ Don't create ADRs for trivial decisions (only architecturally significant choices)

### What TO Do

- ✅ Write for someone joining the project 2 years from now
- ✅ Explain context: business drivers, technical constraints, quality attributes
- ✅ Document alternatives thoroughly (why rejected, not just "we didn't choose it")
- ✅ Link to actual code, issues, PRs (make claims verifiable)
- ✅ Use concrete examples (port allocation, service merging, cache verification)
- ✅ Acknowledge negative consequences (builds trust, prevents surprises)
- ✅ Cross-reference related ADRs (decisions build on each other)

---

## Context for the Agent

This is a **high-impact documentation task** for the Airnub DevContainers Catalog project.
ADRs are the **missing link** between:
- Code (what is implemented)
- Documentation (how to use it)
- **ADRs (why it was designed this way)**

**Current state:** The project has strong code and docs but zero ADRs. Future contributors
and maintainers will struggle to understand design rationale.

**Goal:** Create a **living architectural history** that:
1. Prevents re-litigating settled decisions
2. Guides future enhancements (understand constraints before proposing changes)
3. Onboards contributors faster (context without tribal knowledge)
4. Demonstrates thoughtful engineering (thorough alternatives analysis)

These three ADRs are **foundational** because they document the core patterns:
- **Compose fragments** = service architecture
- **Catalog resolution** = distribution strategy
- **Browser sidecars** = extensibility model

---

## Resources

- **ADR Format Reference:** https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- **ADR Tools:** https://adr.github.io/
- **Example ADR Repository:** https://github.com/joelparkerhenderson/architecture-decision-record
- **MADR (Markdown ADR):** https://adr.github.io/madr/

---

**Good luck! Let's document the architectural wisdom embedded in this codebase. 🏛️📖**
