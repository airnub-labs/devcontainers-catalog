# Classroom — Linux Chrome (Headful)

Dedicated headful Chrome container for classrooms that require a managed browser without the full desktop experience of Webtop.

## Services

- `devcontainer` — Catalog base workspace image.
- `linux-chrome` — Placeholder for a maintained headful Chrome container. See TODO notes in the service fragment for the vetted image once finalized.

## Usage

This template wires the future headful Chrome service into the Dev Container spec. Until the image is finalized, treat the fragment as experimental and keep it out of CI. Instructors can still copy the `.template/.devcontainer/` folder to ensure repo wiring is ready.
