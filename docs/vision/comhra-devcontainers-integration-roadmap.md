# Comhrá ↔ Devcontainers Catalog — Integration Roadmap (Education Platform)

## 1) Context & Vision

Comhrá is an education platform (Next.js core, OTel enabled) seeking seamless, reproducible developer environments for courses. The `devcontainers-catalog` provides composable, devcontainers‑native stacks (e.g., Next.js + Supabase) plus optional browser sidecars (Neko Chrome/Firefox, Kasm Chrome). The goal is a one‑click, identical experience in **GitHub Codespaces** and **local Docker**, with cross‑device parity for iPad/Chromebook learners.

## 2) Objectives

* **Zero‑friction course setup** for teachers; **one‑click launch** for students.
* **Selectable sidecar browsers** (one or many) for real DevTools access on any device.
* **Consistent behavior** local vs. Codespaces; sensible defaults and security.
* **Built‑in assessment** (lightweight Playwright smoke) and cohort orchestration.

## 3) Seamless Integration Plan

### A) Provision stacks from Comhrá (server → GitHub)

**Goal:** Teacher picks a course stack + browsers; Comhrá materializes a repo and surfaces an “Open in Codespaces” entry point.

**Mechanics**

* Organization‑level **GitHub App** with permissions to create repositories, set secrets, trigger workflows, and manage Codespaces.
* Comhrá **server API** to generate a stack (e.g., template `stack-nextjs-supabase-browsers`, browsers `[neko-chrome, neko-firefox, kasm-chrome]`, repo name/visibility, branch, course/cohort metadata).
* Use the **catalog generator** (pinned commit) to compose stack + chosen sidecars; then:

  * create the repository and initial branch,
  * commit generated files,
  * add a lightweight Playwright smoke workflow,
  * configure Codespaces prebuilds (optional),
  * create repository secrets for browser sidecars (e.g., NEKO_*, KASM_VNC_PW),
  * label the repository with course/cohort.
* Surface outputs to the UI: repository URL, default branch, **Codespaces launch link**.

### B) Launch & access (teacher/student UX)

In Comhrá (course → cohort):

* **Open in Codespaces** button for each student repo.
* **Local fallback**: downloadable archive with devcontainer + compose + local README.
* **Browser sidecars** visible as **labeled forwarded ports** (e.g., Neko Chrome UI, Neko Firefox UI, Kasm Chrome UI).

**Important defaults baked into generated stacks**

* App binds to **0.0.0.0** (sidecars can reach `http://devcontainer:3000`).
* **Neko** defaults to **TCP‑mux** (Codespaces‑safe); optional UDP for local.
* **Kasm** defaults to **HTTPS + WebSocket** (proxy‑friendly).
* Forwarded ports default to **Private** visibility.

### C) Assess (Playwright smoke, per lab)

* Each generated repo includes a minimal smoke test workflow and a matching script.
* Comhrá exposes “Run Smoke Test” on the cohort dashboard; it triggers the workflow, polls status, and displays a **PASS/FAIL** badge per repo.

### D) Roster & repository strategies

* **Assignment mode (recommended):** one repo per student/team (clear isolation, simple grading).
* **Shared repo + branches (demo labs):** single repo with pre‑created branches; simpler but less isolation.

### E) Secrets, security, cleanup

* Set browser sidecar passwords as **repo or org secrets** at creation time.
* Generated READMEs emphasize **Private** ports and credential changes before sharing.
* Idle **auto‑stop** for Codespaces via scheduled job or webhook integration.
* **Audit/observability**: log repo creation, codespace start/stop, and smoke outcomes (leveraging existing OTel).

## 4) Minimal additions to comhra-core-platform

### Backend

* Endpoints:

  * Create stack: generate repo from template + browsers; return links.
  * Trigger smoke: dispatch workflow and report status.
  * Manage Codespaces lifecycle: stop idle spaces for cost control.
* **GitHub App** install flow and token handling.
* **Job queue** for longer‑running tasks (repo generation, prebuilds, CI orchestration).

### Frontend (Teacher)

* **Create Stack** wizard: pick base stack, select one/many browsers, repo visibility, roster assignment.
* Cohort table with: Codespaces launch action, **sidecar port tips**, smoke status indicator, “Run Smoke” control.

### Frontend (Student)

* One‑click **Open in Codespaces**.
* Quick‑tips for opening the browser sidecar UI and testing the app at `http://devcontainer:3000`.
* Link to a small **/classroom‑browser** page bundled in the stack.

## 5) Repo‑level tweaks in devcontainers‑catalog

* Maintain the **multi‑select browser registry** (IDs, ports, labels, env defaults).
* Optional **port collision guard** in the generator; auto‑assign next free ports and update labels.
* Do **not** restore templating placeholders into materialized `devcontainer.json` to keep outputs valid.
* **Version** stacks (x.y) and **pin** a catalog commit SHA in Comhrá requests for reproducibility.

## 6) End‑to‑End Flow (TL;DR)

Teacher selects stack + browsers in Comhrá → Comhrá generates a tailored repo and secrets via the catalog generator → Teacher/Students launch Codespaces → App runs at `http://devcontainer:3000` → Browser sidecars open from labeled ports for real DevTools → Comhrá triggers smoke tests for instant validation → Comhrá auto‑stops idle Codespaces and tracks activity.

## 7) Phased Milestones

* **Phase 0 — Enablement (1–2 weeks):** GitHub App setup; generator pinning; basic repo creation; Codespaces launch button.
* **Phase 1 — MVP (2–4 weeks):** Three curated stacks, two browsers (Neko Chrome/Firefox), demo page, smoke tests, cohort dashboard.
* **Phase 2 — Scale (3–6 weeks):** Port collision guard, prebuilds, improved reporting, idle auto‑stop, SSO for instructors/TAs.
* **Phase 3 — Enterprise/Edu (6–10 weeks):** Analytics exports, TA roles, multi‑course management, Kasm integration option, on‑prem connectors.

## 8) Success Metrics

* Time‑to‑first‑lab: **< 5 minutes** from create to running app + DevTools.
* Cross‑device parity: **> 90%** learners on iPad/Chromebook can open DevTools and reach the app.
* Support: **< 2** environment tickets per cohort for “works local vs Codespaces”.
* Adoption: **> 80%** repos complete smoke tests within first lab session.

## 9) Risks & Mitigations

* **Networking constraints:** Codespaces lacks UDP → default to Neko TCP‑mux and Kasm WS/HTTPS.
* **Security:** enforce non‑default passwords before exposing ports; default to Private visibility.
* **Template brittleness:** keep outputs free of templating markers; CI lint for devcontainer validity.
* **Cost control:** enforce idle shutdowns; monitor usage in dashboard.

## 10) Open Questions

* Which identity/SSO providers should be prioritized for instructor/TA roles?
* Preferred roster source: CSV, Google Classroom, LMS (LTI) integration?
* Minimum set of first‑class stacks for launch (beyond Next.js + Supabase)?
* Do we need an institutional on‑prem Kasm option for universities?
