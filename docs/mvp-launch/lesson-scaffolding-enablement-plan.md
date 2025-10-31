# Comhrá ↔ devcontainers‑catalog — Lesson Scaffolding Enablement Plan

## Purpose

Enable Comhrá to **auto‑scaffold ready‑to‑teach lesson repos** that open cleanly in Codespaces or local Dev Containers, including optional **browser sidecars** (Neko Chrome/Firefox, Kasm Chrome), onboarding, and assessment hooks—without changing your runtime architecture.

---

## High‑level Outcomes

* A stable **programmatic generator (SDK)** for `devcontainers‑catalog` that Comhrá can call.
* Declarative inputs (JSON/flags) yielding deterministic, version‑locked environments.
* Well‑known **lesson onboarding slots** in each generated repo (walkthroughs, tours, docs, assessments).
* Scalable **sidecar selection** via a single registry and safe merge logic (services/ports/env).
* Optional **autograding** and **LMS packaging** metadata ready for LTI/CC/QTI export by Comhrá.

---

## 1) Stable, Programmatic Generator API (SDK Mode)

Expose the generator as a library **and** keep the CLI. The SDK returns a plan suitable for previews and UIs.

### API Surface (TypeScript)

```ts
export type GenerateStackInput = {
  template: string;                     // e.g. "stack-nextjs-supabase-browsers"
  browsers?: string[];                  // e.g. ["neko-chrome", "neko-firefox"]
  features?: string[];                  // devcontainer features IDs
  inserts?: RepoInsert[];               // files to inject (walkthroughs, tours, tests...)
  preset?: string | null;               // optional image/preset name
  variables?: Record<string, string>;   // template variables
  semverLock?: boolean;                 // lock template/feature versions in output
  dryRun?: boolean;                     // plan only
};

export type RepoInsert = {
  path: string;             // repo-relative path
  content: string | Buffer; // file content
  mode?: number;            // unix mode, optional
};

export type MergePlan = {
  files: Array<{ path: string; op: "create" | "update" | "skip"; reason?: string }>;
  ports: Array<{ port: number; label?: string; visibility?: "private" | "org" | "public" }>;
  runServices: string[];
  env: Record<string, string>;
  notes: string[];           // warnings, collisions, follow-ups
};

export function generateStack(input: GenerateStackInput): Promise<{ plan: MergePlan; files?: Map<string, Buffer> }>
```

### Behavior

* **dryRun** returns a **plan** with no files. Comhrá can render a preview/diff.
* **semverLock** pins template/feature versions into the generated repo (e.g., lock feature digests, record catalog version in `.comhra.lock.json`).
* The SDK **never restores template placeholders** (e.g., Mustache) into the final output—only valid JSON/YAML is materialized.

---

## 2) Template & Feature Distribution Contract

* Publish selected **Templates/Features** to **GHCR** (e.g., `ghcr.io/airnub-labs/devcontainers-catalog/<name>:vX.Y.Z`).
* Maintain a `COLLECTION.yaml` index for discoverability and outside consumption.
* Keep inputs **declarative**: a single JSON spec captures template, features, sidecars, and variables, enabling re‑hydration of the same environment later.

### Example: Generation Spec (`.comhra/lesson.gen.json`)

```json
{
  "template": "stack-nextjs-supabase-browsers",
  "browsers": ["neko-chrome", "kasm-chrome"],
  "features": ["ghcr.io/devcontainers/features/node:1", "ghcr.io/devcontainers/features/python:1"],
  "variables": { "PROJECT_NAME": "Intro Web Lab" },
  "semverLock": true
}
```

---

## 3) Lesson‑Onboarding “Slots” (Well‑Known Paths)

Reserve canonical paths so Comhrá can drop in materials consistently. The generator includes **merge helpers** that append/patch these without clobbering user content.

| Path                        | Purpose                                     | Notes                                             |
| --------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `.vscode/walkthroughs.json` | VS Code Walkthrough steps inside the editor | Optional: or extension `contributes.walkthroughs` |
| `.tours/**`                 | CodeTour guided steps across files/lines    | Hidden by default if extension absent             |
| `assessments/qti/**`        | QTI 3.0 quizzes & items                     | Later exported into Common Cartridge              |
| `docs/**`                   | Lesson pages / short codelabs               | Publish via GitHub Pages if desired               |
| `analytics/**`              | Caliper/xAPI helpers for event logging      | Pluggable sink                                    |
| `.comhra/**`                | Gen spec, locks, metadata emitted by Comhrá | Not used at runtime                               |

### Merge Helpers

* JSON patch/merge for `devcontainer.json` (deep merge: `runServices`, `forwardPorts`, `portsAttributes`, `containerEnv`).
* YAML merge for Compose services (AST‑level to avoid indentation drift).
* File overlay strategy: `create` vs `update` with 3‑way merge for text files when possible; otherwise write new (+ note).

---

## 4) Sidecar Selection That Scales

Maintain a single **registry** of sidecars. Adding a future browser (e.g., WebKit) is an **append‑only** operation.

### Registry Shape

```ts
export type BrowserSidecar = {
  id: "neko-chrome" | "neko-firefox" | "kasm-chrome" | string;
  label: string;
  templatePath: string;     // points to /.template
  ports: number[];          // forwarded ports to add
  portLabels: Record<number, { label: string; onAutoForward: "openBrowser" | "silent" }>;
  containerEnv?: Record<string, string>; // defaults, non-overwriting
  requires?: string[];      // optional deps (e.g., shm tweaks)
};
```

### Merge Rules

* **runServices**: append + de‑dupe.
* **forwardPorts**: append + de‑dupe.
* **portsAttributes**: deep‑merge by port; last‑write wins for label unless collision detected.
* **containerEnv**: add **only if** the key is absent; never overwrite; emit a note if collision.
* **Visibility**: default to **Private** for Codespaces ports. Let org policy control public exposure.

---

## 5) Port Allocator + UDP Awareness

Avoid collisions as the matrix grows.

### Strategy

* Define **preferred ports** per sidecar (e.g., Neko Chrome: `8080`, `59000/tcp`; Neko Firefox: `8081`, `59010/tcp`; Kasm: `6901`).
* Run a **first‑fit allocator**: if a preferred port is busy, scan a reserved range (e.g., `45000–49999`) and assign the next free one. Update `portsAttributes` and notes accordingly.
* Codespaces is **TCP/HTTPS only**; set Neko to **TCP‑mux** by default. For local runs, the generator can insert commented **UDP** mappings as hints.

---

## 6) Autograding Hooks (Optional, High‑Leverage)

Ship a small, reusable preset Comhrá can drop in when lessons want instant feedback.

### Files

* `.github/workflows/classroom.yml` – runs tests, posts artifacts, optional summary.
* `tests/**` – example tests per language (Node/Python) with `npm test`/`pytest` wiring.
* `package.json`/`requirements.txt` additions guarded by the generator (avoid duplicate entries).

### Extras

* Output JUnit/JSON to feed LMS grade pass‑back (via Comhrá’s LTI AGS), or post a badge in the repo README.

---

## 7) Metadata Ready for LMS Packaging

Make generated repos self‑descriptive so Comhrá can emit a **Common Cartridge** and LTI links without re‑deriving structure.

### `lesson.json` (or `course.json`) schema (minimal)

```json
{
  "title": "Intro to Web — Layout & DevTools",
  "duration": 45,
  "prerequisites": ["HTML basics"],
  "outcomes": [
    { "text": "Inspect network requests", "caseGuid": "urn:case:...", "align": "assesses" },
    { "text": "Fix CSS layout bug using DevTools", "align": "teaches" }
  ],
  "assessments": [{ "id": "quiz-1", "format": "QTI", "path": "assessments/qti/quiz-1.zip" }],
  "stack": { "template": "stack-nextjs-supabase-browsers", "browsers": ["neko-chrome", "neko-firefox"], "features": ["node:1"] },
  "lrmi": {
    "educationalAlignment": [{
      "alignmentType": "teaches",
      "targetName": "Web debugging fundamentals",
      "targetUrl": "https://example.org/standards/fnd-1"
    }]
  }
}
```

Comhrá reads this to produce **LTI Deep Links**, CC manifests, and QTI packaging—and to present outcomes/progress in its UI.

---

## 8) Publishing & Versioning Hygiene

* Semver for templates/features, with changelogs.
* SDK returns the **exact versions** used so Comhrá can persist them in `.comhra.lock.json`.
* Provide a `catalog ls --json` command and matching SDK call for UI pickers.

---

## 9) Security, Privacy, and Classroom Defaults

* Default port visibility: **Private**; require explicit opt‑in to Org/Public.
* Require sidecar passwords via `containerEnv` in generated repos and flag if defaults are detected.
* Optional **policy gates**: a `--school-mode` flag disables public ports and enforces password overrides.

---

## 10) Developer Ergonomics (CLI Examples)

```bash
# Preview a plan (no files written)
airnub-devc generate stack \
  --template stack-nextjs-supabase-browsers \
  --with-browsers neko-chrome,kasm-chrome \
  --features ghcr.io/devcontainers/features/node:1 \
  --dry-run > plan.json

# Materialize to ./lesson-repo
airnub-devc generate stack \
  --template stack-nextjs-supabase-browsers \
  --with-browser neko-firefox \
  --out ./lesson-repo
```

---

## 11) Example Inserts Produced by Comhrá

* **Walkthrough** (`.vscode/walkthroughs.json`) — steps: clone, install, run, open Neko/Kasm, run tests.
* **CodeTour** (`.tours/*.tours`) — jump to teacher‑selected files.
* **Docs** (`docs/index.md`) — short lab narrative; link to LMS item.
* **Assessments** (`assessments/qti/quiz-1.zip`) — ready for LMS import.
* **Analytics** (`analytics/caliper.json`) — endpoint + auth scaffold.

---

## 12) Merge Algorithm Details

* **Compose (docker‑compose.yml)**: parse → AST merge services → re‑serialize with preserved comments where possible; avoid plain string splices.
* **devcontainer.json**: deep merge with rules (de‑dupe arrays, non‑overwriting env). Validate schema after merge.
* **Conflict notes**: emit human‑readable warnings in the plan; never silently drop keys.

---

## 13) Testing & CI

* Unit tests for merges (Compose/devcontainer), port allocator, and sidecar registry integrity.
* Golden‑file tests: generate a fixture repo and snapshot the output.
* CI job to build example stacks and run `devcontainer validate`.

---

## 14) Roadmap & Milestones

1. **M1 — SDK Mode (P0)**: export `generateStack()` with dry‑run plans; registry typed export; no placeholder leakage.
2. **M2 — Lesson Slots & Merge Helpers (P0)**: JSON/YAML merge utils; well‑known paths; unit tests.
3. **M3 — Port Allocator (P1)**: preferred → fallback ranges; update labels/notes.
4. **M4 — Autograding Preset (P1)**: workflow + tests template.
5. **M5 — Metadata (P1)**: `lesson.json` schema; lockfile emission.
6. **M6 — Distribution (P2)**: GHCR publishing + `COLLECTION.yaml`; `catalog ls --json`.

---

## 15) Net

You’re not changing your runtime architecture. By formalizing **SDK mode**, **well‑known lesson paths**, and small **port/merge plumbing**, Comhrá can generate lesson repos that **open and work immediately**—with sidecar browsers, onboarding, and assessments—across Codespaces and local Dev Containers.
