# Experimental Services — Policy & Implementation Plan (devcontainers‑catalog + SDK/CLI)

## Why

Some service fragments (e.g., **Kafka**, **Temporal**, **Airflow**, **Dagster**) are powerful but complex. Until they’re exercised in real courses and validated in Codespaces/local, we should ship them as **opt‑in experiments**. This plan adds a light governance layer so experiments:

* are **hidden by default** in SDK/CLI and docs search,
* can be **explicitly enabled** with a flag or env var,
* graduate to **stable** after a checklist,
* and never surprise instructors or students.

---

## High‑level Overview

* Tag services/templates/features with a **stability** field: `"experimental" | "stable" | "deprecated"`.
* Default behavior: **exclude experimental** from SDK/CLI listings and generation.
* Expose via **feature flag**: `--include-experimental` (CLI) or `includeExperimental: true` (SDK) **or** env `DEVC_INCLUDE_EXPERIMENTAL=1`.
* Gate publishing and version tags: experimental builds use **pre‑release tags** (e.g., `1.3.0-exp.1`).
* Provide a **graduation checklist**; on completion, flip stability to `"stable"` and publish non‑pre‑release.

---

## Data Model Changes

### 1) Registry Types

```ts
// packages/sdk-core/src/types.ts
export type Stability = "experimental" | "stable" | "deprecated";

export type ServiceDescriptor = {
  id: string;                      // e.g., "kafka"
  label: string;                   // "Apache Kafka"
  templatePath: string;            // path to /.template fragment
  stability: Stability;            // NEW
  since?: string;                  // semver first introduced
  owners?: string[];               // GH handles/team
  docs?: string;                   // relative doc path or URL
  ports?: number[];                // preferred ports (advisory)
  notes?: string[];
};

export type BrowserSidecarDescriptor = ServiceDescriptor & {
  portLabels?: Record<number, { label: string; onAutoForward: "openBrowser" | "silent" }>;
  containerEnv?: Record<string, string>;
};
```

### 2) Template Metadata (optional)

Add a small `template.json` next to `.template/` to echo stability and guard accidental direct use.

```json
{
  "id": "kafka",
  "stability": "experimental",
  "owners": ["@airnub-labs/platform"],
  "since": "0.7.0",
  "docs": "docs/services/kafka.md"
}
```

---

## SDK Surface (Programmatic Control)

### 1) Listing APIs filter by stability

```ts
// packages/devc-sdk/src/index.ts
export type ListOptions = { includeExperimental?: boolean; includeDeprecated?: boolean };
export function listServices(opts?: ListOptions): ServiceDescriptor[];
export function listTemplates(opts?: ListOptions): TemplateDescriptor[];
```

Default: `includeExperimental=false`, `includeDeprecated=false`.

### 2) Generation respects the filter

```ts
export type GenerateStackInput = {
  template: string;
  services?: string[];             // non-browser services (kafka, airflow, temporal, dagster)
  browsers?: string[];             // sidecars
  includeExperimental?: boolean;   // NEW
  // ... other fields (features, inserts, etc.)
};
```

If a requested service is experimental **and** `includeExperimental` is not true (and env isn’t set), throw a `ValidationError` with guidance.

### 3) Environment Overrides

* `DEVC_INCLUDE_EXPERIMENTAL=1` → toggles SDK default on for the current process.
* `DEVC_INCLUDE_DEPRECATED=1` → similarly for deprecated.

---

## CLI UX

### Flags

* `--include-experimental` / `--include-deprecated`
* These affect **list** and **generate** commands.

### Behavior Examples

```bash
# Hidden by default
airnub-devc services ls  # shows only stable

# Explicit inclusion
airnub-devc services ls --include-experimental

# Generate stack with Kafka (experimental)
airnub-devc generate stack \
  --template stack-nextjs-supabase-browsers \
  --services kafka \
  --include-experimental
```

If a user omits the flag yet requests an experimental service, print:

```
Error: service "kafka" is experimental and disabled by default.
Re-run with --include-experimental (or set DEVC_INCLUDE_EXPERIMENTAL=1)
```

---

## Publishing & Versioning

### Pre‑release Tags for Experiments

* Experimental service fragments/images/features publish as **pre‑release**:

  * Image: `ghcr.io/.../kafka:0.7.0-exp.1`
  * Feature: `ghcr.io/.../feature-kafka:0.7.0-exp.1`
* `latest` tag **never** points to experimental.

### GH Actions Matrix

* `channel: stable | experimental` → controls which descriptors are published.
* Experimental pipeline enforces:

  * Required **README badge**: `status: experimental`.
  * Must include **owner** and **docs** links.

---

## Docs & Badges

### Badges

* In each service README: `![stability: experimental](https://img.shields.io/badge/stability-experimental-orange)`
* The catalog site/table should have a **column** for stability, with filters.

### Warnings

* Auto‑insert a notice at the top of experimental service docs:

  > This service is experimental. APIs, ports, and behavior may change. Not enabled by default in CLI/SDK.

---

## Graduation & Deprecation

### Graduation Checklist

1. **Functional parity** with intended scope (local + Codespaces).
2. **Docs**: quick start, ports, limits, troubleshooting.
3. **Autotests**: CI smoke (compose up, health check), basic e2e for Codespaces port forwarding.
4. **Stability window**: two minor releases without breaking changes.
5. **Two real classrooms** (or CI scenarios) report success.

On completion:

* Flip `stability` → `"stable"` in registry/template metadata.
* Publish **stable** semver tags; remove `-exp.*` channel mapping.

### Deprecation

* Mark `stability: "deprecated"`, add deprecation notice and EOL date.
* CLI/SDK hide by default; require `--include-deprecated` to list or generate.

---

## Compose & Devcontainer Merging Guards

* Experimental services **must not** auto‑attach unless requested.
* The merge planner should emit a **PlanNote** when an experimental service is included, summarizing resource demands (RAM/CPU/disk) and Codespaces suitability (e.g., Kafka needs >2GB RAM, long‑running brokers).
* For Codespaces: prefer minimal single-node or in-memory modes when available.

---

## Port Allocation Policy (Experiments)

* Declare preferred ports in registry; allocator falls back to a reserved experimental range (e.g., `47000–47999`).
* Always mark forwarded ports as **private** by default.

---

## Example: Registry Entries

```ts
export const SERVICES: ServiceDescriptor[] = [
  { id: "kafka", label: "Apache Kafka (single-node)", templatePath: "templates/services/kafka/.template", stability: "experimental", ports: [9092], docs: "docs/services/kafka.md" },
  { id: "temporal", label: "Temporal (dev server)", templatePath: "templates/services/temporal/.template", stability: "experimental", ports: [7233], docs: "docs/services/temporal.md" },
  { id: "airflow", label: "Apache Airflow", templatePath: "templates/services/airflow/.template", stability: "experimental", ports: [8080], docs: "docs/services/airflow.md" },
  { id: "dagster", label: "Dagster (web + daemon)", templatePath: "templates/services/dagster/.template", stability: "experimental", ports: [3000], docs: "docs/services/dagster.md" }
];
```

---

## SDK Enforcement Example

```ts
function mustBeAllowed(id: string, includeExperimental: boolean) {
  const svc = SERVICES.find(s => s.id === id);
  if (!svc) throw new ValidationError(`Unknown service: ${id}`);
  if (svc.stability === "experimental" && !includeExperimental && process.env.DEVC_INCLUDE_EXPERIMENTAL !== "1") {
    throw new ValidationError(`Service "${id}" is experimental. Re-run with includeExperimental or set DEVC_INCLUDE_EXPERIMENTAL=1.`);
  }
  if (svc.stability === "deprecated" && process.env.DEVC_INCLUDE_DEPRECATED !== "1") {
    throw new ValidationError(`Service "${id}" is deprecated. Re-run with --include-deprecated or set DEVC_INCLUDE_DEPRECATED=1.`);
  }
}
```

---

## CLI Wiring Example

```bash
# List only stable services
airnub-devc services ls

# Include experimental
airnub-devc services ls --include-experimental

# Generate with Temporal (experimental)
airnub-devc generate stack --template stack-nextjs-supabase-browsers \
  --services temporal --include-experimental
```

---

## CI Gates

* **Lint**: registry entries must have `stability`, `owners`, and `docs`.
* **Build**: experimental channel pushes only `*-exp.*` tags.
* **Test**: experimental services run a short health check (container starts, health endpoint 200) under timeouts suitable for Codespaces.

---

## Instructor/Student Safety UX

* When an experimental service is selected, print a **preflight summary** (RAM/CPU/disk, startup time, known issues) before writing files.
* Insert a README block in the generated repo under `/docs/EXPERIMENTS.md` describing the service and how to disable it quickly if problems arise.

---

## Migration Notes

* Existing single-browser/sidecar flow is unaffected; this plan only changes visibility & opt-in for heavy services.
* Graduation is a metadata flip + stable publish; no breaking change for consumers.

---

## Acceptance Criteria

* SDK & CLI hide experiments by default; explicit opt-in re-enables them.
* Registry updated with `stability` metadata for target services (kafka, temporal, airflow, dagster).
* Publishing pipeline emits `-exp.*` tags and never updates `latest` for experiments.
* Unit tests assert filtering, flag/env behavior, and error messages.
* Docs display badges and filters for stability.
