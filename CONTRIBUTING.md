# Contributing to the Devcontainers Catalog

Thank you for helping build the chat-to-classroom platform! This repository hosts the reusable features, templates, images, services, and schemas that power instructor-led lesson environments. The guidelines below keep contributions deterministic, reproducible, and aligned with our SaaS roadmap.

## Before You Start

1. **Review the docs**
   - [CATALOG.md](docs/CATALOG.md) for structure and lifecycle expectations
   - [DEVELOPMENT.md](docs/DEVELOPMENT.md) for local setup and tooling
   - [SECURITY.md](docs/SECURITY.md) for vulnerability and secret handling policies
   - [agents-mcp-contract.md](docs/agents-mcp-contract.md) for SaaS integration contracts
2. **Pick or file an issue**
   - Use the provided issue templates to outline the problem, manifest impact, and acceptance criteria.
   - For new ideas, highlight how the change helps instructors go from chat to classroom faster.
3. **Discuss breaking changes early**
   - Schema changes, renamed images, or template removals require a migration plan captured in `docs/MIGRATION*.md`.

## Development Environment

1. **Clone and install tooling**
   ```bash
   git clone https://github.com/airnub-labs/devcontainers-catalog.git
   cd devcontainers-catalog
   make install-tools
   ```
2. **Use devcontainers**
   - Open the repo in VS Code Dev Containers or GitHub Codespaces for a consistent toolchain.
   - Run `make lint` and `make test` locally before opening a PR.
3. **Follow feature/image guidelines**
   - Installers must be idempotent and avoid background daemons.
   - Never embed secrets. Use placeholders and document expected environment variables.
   - Templates should remain repo-agnostic and ready for the SaaS generator to consume.

## Pull Request Process

1. **Branch and scope**
   - Use descriptive branches (e.g. `feature/add-supabase-service`).
   - Keep changes focused; independent improvements should ship in separate PRs.
2. **Update documentation**
   - When behaviour changes, update the authoritative docs in `docs/` as part of the PR.
   - Capture verification evidence in `VARIFY.md` if you add or modify validation steps.
3. **Testing expectations**
   - Add or update automated tests in `features/`, `templates/`, or `scripts/` as appropriate.
   - For images, run smoke tests (`make smoke-tests`) and add new services to `compose_aggregate.sh` when required.
4. **Security hygiene**
   - Run `make trivy` (or check the CI output) to confirm images are free of known CVEs.
   - Dependabot alerts must be resolved promptly; do not merge PRs with failing security checks.
5. **PR checklist**
   - Fill out the pull request template completely.
   - Reference linked issues and note manifest or schema impact.
   - Include logs demonstrating deterministic outputs where relevant.

## After Merge

- Confirm CI pipelines are green on `main`.
- Watch for Dependabot PRs and coordinate releases to keep student environments up to date.
- Celebrate! Your contribution helps instructors deliver rich classroom experiences through a single chat prompt.

For any questions, reach out to the maintainers listed in [MAINTAINERS.md](docs/MAINTAINERS.md).
