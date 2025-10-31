# MVP Launch Plan — Repo-Button First, Adapter-Ready Architecture

## 0) Purpose

Deliver a **government-funding-ready MVP** that proves impact (access for iPad/low-power devices, fast setup for teachers, reproducible stacks) while keeping the codebase **adapter-ready** for later upgrades:

* **A. Repo-button baseline (now)** — no Codespaces adapter required.
* **B. Thin CodespacesAdapter (later)** — automation, quotas, analytics.
* **C. DevPodAdapter (later)** — run anywhere (local/K8s/VMs/own AWS).

---

## 1) MVP Scope (what we will ship now)

**Core experience**

* Teacher selects a **course stack** (e.g., *Next.js + Supabase*) and **browser sidecars** (Neko Chrome/Firefox; Kasm Chrome) from the **devcontainers-catalog**.
* Platform generates a **course repo** in the teacher’s GitHub org (or uses an existing template repo).
* Students click **“Open in Codespaces”** on GitHub → fully web-based IDE; iPad/Chromebook parity.
* Each stack includes a **/classroom-browser** page and **labeled forwarded ports** for sidecars.
* Optional **Playwright smoke** script ships with the stack; teacher runs it manually in Codespaces.

**Out of scope (for MVP)**

* Programmatic create/stop Codespaces, port policy control, machine sizing, quotas.
* Non-GitHub providers (DevPod) and own AWS provisioning.
* Centralized compute billing.

**Why this qualifies for funding**

* **Equity of access** (works on iPad/low-power devices).
* **Time-to-first-lab** under 5 minutes.
* **Reproducibility and safety** via Dev Containers + sidecar browsers.

---

## 2) Architecture (now) — Adapter-Ready without Using One

**Guiding principle:** Separate **what** (provider-neutral) from **where** (provider-specific), even if the MVP only uses GitHub Codespaces buttons.

### 2.1 Provider-Neutral Core

* **Workspace Manifest** (internal object stored per course): stack ID/version, browser sidecars, ports (labels & privacy intent), secrets (logical names), policies (idle hint, max hours), links.
* **Capability Map (placeholder)**: schema exists; for MVP it stores a single profile `codespaces-default` (UDP=false, port privacy options, etc.). No code depends on it yet.
* **Generator Pipeline**: uses **devcontainers-catalog** to materialize stacks → commits to a GitHub repo (through teacher’s org permissions).

### 2.2 Launch Flow (no adapter)

* UI shows **“Open in Codespaces”** deep link for each repo.
* Local fallback: downloadable archive of `.devcontainer/` + `docker-compose.yml` + quickstart.

### 2.3 Data Model (minimal, future-proof)

* **Course** (name, org, roster source)
* **StackInstance** (stack_id@version, browsers[], repo_url, branch)
* **UsageEvents (optional MVP)**: first open timestamp; manual smoke status flag
* **ProviderProfile (future)**: stores selected provider (codespaces/devpod/local) per course/cohort

---

## 3) Future Extensions (designed but not built now)

### 3.1 B. Thin **CodespacesAdapter** (automation & governance)

**Responsibilities (later):**

* Repo lifecycle, **prebuilds**, **secrets** injection; **create/stop** Codespaces; set **port visibility**; **machine type caps**; **idle shutdown**; usage telemetry for **budgets/tiers**.
  **Unlocks:** paid tiers, quotas, analytics, policy enforcement, smoother faculty UX.

### 3.2 C. **DevPodAdapter** (run anywhere)

**Responsibilities (later):**

* Translate the same Workspace Manifest to **DevPod CLI** calls targeting Docker/K8s/SSH/Cloud (including **own AWS EC2/EKS**).
* Option A: guide students to install DevPod (laptops/desktops).
* Option B: run DevPod or Dev Containers CLI **server-side** on your runners to pre-provision workspaces; expose **openvscode-server** + **Neko/Kasm** in the browser (your “Codespaces-like” mode).

### 3.3 Optional: Third-party Control Planes

* Gitpod / Coder integration behind your UI if you need a hosted web IDE alternative without running your own infra.

---

## 4) MVP UX (teacher & student)

**Teacher**

* Pick stack + browsers → click **Generate Repo** → get GitHub repo link + **Codespaces** button.
* Share repo URL with students (or via GitHub Classroom).

**Student**

* Open repo → **Open in Codespaces** → run app; **open Neko/Kasm UI** via labeled port forward to access real Chrome/Firefox DevTools.

**Accessibility & Safety**

* Default instructions keep ports **Private**; require changing **default sidecar passwords** before sharing.

---

## 5) Success Metrics (funding-friendly)

* **Access**: ≥90% of iPad/Chromebook students can open DevTools via sidecar.
* **Speed**: time-to-first-lab < 5 minutes from invite.
* **Reliability**: smoke test passes in first session for ≥80% of repos.
* **Satisfaction**: ≥4.5/5 instructor onboarding score.

---

## 6) Risks & Mitigations (MVP)

* **Networking limits in Codespaces (no UDP)** → use Neko **TCP-mux** by default; Kasm over HTTPS/WebSocket.
* **Manual steps for prebuilds/secrets** → provide guided checklists and repo README playbooks.
* **Faculty bandwidth** → ship a “Create Course Repo” wizard to remove most setup friction.

---

## 7) Roadmap (phased)

**Phase 0 — MVP (funding demo)**

* Repo generation from catalog; Codespaces button; sidecars working; demo page; optional smoke script.

**Phase 1 — Faculty Quality of Life**

* Prebuild recipes; secret prompts; roster import; progress dashboard (manual events okay).

**Phase 2 — CodespacesAdapter**

* Automate create/stop; port visibility; machine caps; idle stop; usage aggregation; tiered quotas.

**Phase 3 — DevPodAdapter + Own AWS**

* Offer non-GitHub backends: local Docker/K8s, **AWS EC2/EKS**. Keep iPad users on Codespaces; laptops can choose DevPod. Optionally, server-side workspaces with openvscode-server + sidecars for a fully web UX under your brand.

**Phase 4 — Control Plane (optional)**

* Operate your own multi-tenant web IDE stack using Dev Containers CLI, openvscode-server, and Neko/Kasm; integrate SSO/LMS and fine-grained billing.

---

## 8) Funding Narrative (why this is worth support)

* **Equity & inclusion:** runs on the devices students already have (iPad/Chromebook/low-power laptops).
* **Teacher efficiency:** one-click course environments; no local setup.
* **Industry-relevant skills:** Dev Containers, modern cloud debugging workflows, cross-browser DevTools.
* **Scalable and sustainable:** adapter-ready design allows future governance, analytics, and cost control without re-architecture.

---

## 9) Implementation Checklist (MVP)

* [ ] Course wizard: select stack + browsers; generate repo (catalog pinned SHA).
* [ ] Repo README: quickstart for Codespaces; port labels; change passwords; /classroom-browser guide.
* [ ] Optional smoke script included (manual run).
* [ ] Telemetry hooks (basic): repo created; first Codespaces open (manual mark acceptable in MVP).
* [ ] Docs: teacher playbook; student quickstart; accessibility & safety notes.

---

## 10) What We Defer (deliberately)

* Automated Codespaces lifecycle & usage metering (saved for Phase 2).
* Non-GitHub providers and AWS/EKS (saved for Phase 3).
* Centralized compute billing (saved for Phase 4; SaaS billing only for features in MVP).
