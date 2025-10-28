# Airnub DevContainers Catalog

**Primitives:**
- **Features** → install tooling (Supabase CLI, Node, CUDA, etc.). No services, idempotent.
- **Templates** → ship a ready-to-use `.devcontainer/` payload (can be multi-container via Compose).
- **Images** → prebuilt base(s) to speed builds.

> There’s no formal **“Stack”** object in the devcontainers spec. In this catalog, a **stack** is just a **flavor of Template** that combines features + sidecars + ports into a tested combo.

## What’s in this repo

- `features/` — install-only, idempotent. No services.
- `templates/` — opinionated dev environments. Includes **stack templates** (e.g., `stack-nextjs-supabase-webtop`).
- `images/` — optional prebuilt bases to accelerate `dev` service startup.
- `docs/` — spec alignment, architecture, publish/test pipelines.

## Using stacks (templates)

You can **materialize** a template’s payload (`.template/.devcontainer/*`) into a workspace repo, or reference a prebuilt image + features.

**Examples:**
- `templates/stack-nextjs-supabase-webtop/`
- `templates/stack-web-node-supabase-webtop/`

Each stack template specifies:
- `dockerComposeFile` (e.g., `dev` + `redis` + GUI sidecar `webtop`/`novnc`)
- port labels (9222 CDP, 3001/6080 desktop, 6379 Redis)
- feature set (Node, Supabase CLI, agent-tooling CLIs, etc.)

## Where do Supabase/Redis live?

- In **stack templates** via Compose sidecars and/or CLI-managed local via a Feature and `postStart` helper.
- Prefer Supabase **CLI-managed local**; provide a separate template flavor for a fully containerized Supabase stack when needed.

## Minimal taxonomy

- **Feature** = “Install this tool.”
- **Template** = “Bring these containers + ports + policies together.”
- **Image** = “Prebaked base for the dev container (optional).”
- **Stack** = “An opinionated Template (plus optional matching Image) with a tested combo: Node + pnpm + Redis + Supabase + GUI + CDP.”

## Reproducibility

Each template may include a `stack.lock.json` (or README table) pinning feature versions and image digests.

## Publish & Test

- GitHub Actions publish **Features** (OCI) and **Images** (GHCR), and test **Templates** by materializing their payloads and running smoke checks.
