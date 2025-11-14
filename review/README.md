# Review Artifact Scaffold

The review directory is pre-populated so audits can drop evidence without rewriting history. This mirrors the original request:

1. At the repo root, create a `review/` directory with subfolders for each task ID (`INV-101`, `TMP-201`, `IMG-301`, `FEA-401`, `SRV-501`, `STK-601`, `CLI-701`, `DOC-801`, `QA-901`, `OPS-1001`, `CI-1101`).
2. Add an initial `review/index.json` recording the current commit (`git rev-parse --short HEAD`) and empty artifact arrays for every task.
3. Document the artifact expectations in `review/README.md`, mirroring the user prompt so future audits stay consistent.
4. Commit the scaffold so subsequent reviews can drop artifacts without touching Git history outside `review/`.

Each task-specific subdirectory is reserved for attachments, notes, and structured findings aligned with its identifier. Update `index.json` as artifacts are added to keep the manifest in sync with committed evidence.
