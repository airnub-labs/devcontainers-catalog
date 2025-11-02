# Devcontainers Classroom Platform Positioning Brief

Here’s a tight positioning brief, plus a lean MVP plan and pricing you can drop into a deck.

## Positioning Brief

### Problem

Classrooms and professional courses need turn-key, reproducible dev stacks that run the same on GitHub Codespaces and local Docker, and that give full Chrome/Firefox DevTools to students on iPads/Chromebooks. Today, platforms offer either (a) an IDE with DIY stack assembly, or (b) streamed desktops/browsers without devcontainers-native course stacks.

### What exists (and why it’s not enough)

- **GitHub Classroom + Codespaces:** one-click browser VS Code with devcontainers; great for assignments, but no built-in real browser sidecars—you assemble them yourself. Port forwarding is TCP/HTTP(S) with labels, but it’s transport, not a packaged browser.  
  Sources: GitHub Docs ×2.
- **Gitpod / Ona:** strong devcontainers support and multi-repo setups, but again you compose services; no ready-made classroom stacks with real Chrome/Firefox included.  
  Sources: gitpod.io ×2.
- **CodeSandbox:** now supports Dev Containers (even Compose) and has Classroom Mode, but devcontainer features like `portsAttributes` are limited, and there’s no built-in full Chrome/Firefox sidecar story.  
  Sources: CodeSandbox ×2.
- **StackBlitz WebContainers:** in-browser Node env (runs on iOS/iPadOS) but with mobile memory limits; it’s not a remote full Chrome with system DevTools.  
  Source: blog.stackblitz.com.
- **Kasm Workspaces / KasmVNC:** excellent streamed browsers/desktops (WebRTC/WebGL, KasmVNC), but infra tooling, not an education-ready, devcontainers-first course stack.  
  Source: docs.kasm.com.
- **Replit Teams for Education:** deprecated/removed, creating more demand for GitHub-centric options.  
  Source: Replit Blog.

### Your edge (why this is a gap you can fill)

- Devcontainers-native course stacks (e.g., Next.js + Supabase) that bundle optional Chrome/Firefox sidecars (Neko/Kasm) and run identically on Codespaces and local. Nothing mainstream packages this out of the box.  
  Source: GitHub Docs.
- Multi-select browsers at generate time → cross-browser testing parity on tablets/Chromebooks, while respecting Codespaces’ TCP/HTTP(S) forwarding model.  
  Source: GitHub Docs.
- Teacher-first UX: labeled ports, one-click launch, demo routes, and guided flows—features that platforms leave to instructors to build themselves. (CodeSandbox’s current port/label limitations underscore this opportunity.)  
  Source: CodeSandbox.

### Who cares first

- Bootcamps (rapid cohort setup, cross-device parity).
- University CS modules (repeatable labs, assessment hooks).
- Workforce upskilling (short courses needing “real web + DevTools” on any device).

## Lean MVP Plan

### Scope (v1, ~4–6 weeks of focused build)

**Teacher Dashboard (hosted SaaS)**

- Create & publish Courses (cohorts), pick template Stacks, select Browsers (Chrome/Firefox).
- “Launch in Codespaces” button + local Docker instructions.
- Cohort roster import (CSV/Google Sheet) and invite links.

**Three curated stacks (all devcontainers-native)**

- Next.js + Supabase (web full-stack baseline).
- Python + Jupyter + Postgres (data/ML baseline).
- Node + Prisma + Postgres + Redis (backend API baseline).
- Each ships a `/classroom-browser` demo page and sensible `forwardPorts` + labels (where supported).  
  Source: GitHub Docs.

**Two browser options (sidecars)**

- Neko Chrome (WebRTC with TCP-mux default for proxies/Codespaces).
- Neko Firefox (same transport defaults).
- Optional: Kasm Chrome (KasmVNC HTTPS) as a third choice for institutions that prefer VNC-style streaming.  
  Source: docs.kasmvnc.com.

**Playwright smoke tests (per stack)**

- One click from the dashboard to inject & run a minimal Playwright check inside the sidecar browser against `http://devcontainer:3000`, return PASS/FAIL badge for the lab.

**Billing toggle (SaaS features only)**

- Free Instructor (single course, limited cohort).
- Paid unlocks: multi-course, analytics, roster SSO, assessment exports.
- Compute (Codespaces/Gitpod/CodeSandbox) is BYO billing with the provider; your SaaS bills only for orchestration/dashboards.  
  Sources: GitHub Docs ×2, gitpod.io ×2.

### Key technical notes

- **Codespaces compatibility:** default to HTTP/HTTPS port forwarding labels; avoid UDP transport; Neko TCP-mux by default.  
  Source: GitHub Docs.
- **Local parity:** enable optional UDP ranges for smoother WebRTC when running on Docker locally.
- **Security defaults:** enforce non-default passwords for sidecars before allowing public/organization exposure; warn on public share. (Codespaces supports private/org/public port visibility.)  
  Source: GitHub Docs.
- **Extensibility:** browser registry (IDs, ports, labels) so adding Edge/WebKit later is additive.

### Success metrics (MVP)

- Time-to-first-lab < 5 minutes (teacher to student “Hello World” in browser sidecar).
- >90% students on iPad/Chromebook can open DevTools in sidecar and reach the app.
- <2 support tickets per cohort on “it works locally but not in Codespaces”.

## Simple, education-friendly pricing

Compute for Codespaces/Gitpod/CodeSandbox is paid to the provider. You charge for orchestration + templates + dashboard.

### Free Instructor (per instructor)

- 1 course, up to 30 students, 1 active stack, 1 browser choice.
- Basic templates & demo routes, community support.

### Bootcamp Pro (per cohort)

- €399/mo or €999/quarter.
- Unlimited stacks per course, multi-browser (Chrome+Firefox+Kasm optional).
- Playwright smoke badges, roster import, progress dashboard, priority support.

### University Dept (annual)

- €6,000/yr for up to 5 modules (up to 300 students).
- SSO (SAML/OIDC), custom templates, analytics export, TA roles, assisted onboarding.
- Optional add-on: private Kasm cluster integration (if the uni prefers on-prem streamed browsers).  
  Source: docs.kasm.com.

**Rationale:** Bootcamps buy per-cohort; universities budget annually per department/module. Your costs are predictable (mostly support + product), since runtime compute is BYO provider.

## Next steps

- Pilot with 1 bootcamp and 1 university module using “Next.js + Supabase” and both browsers.
- Capture video testimonials showing iPad/Chromebook DevTools parity and one-click launch.
- Expand the stack library based on instructor demand (e.g., Django + Postgres, Rust + Postgres, Go + Redis).
