# Dagster Demo Repository Stub

This directory backs the Dagster compose fragment. The contents are mounted at `/opt/dagster/app` inside the `dagster dev` container so you can extend the demo with your own definitions.

## Contents

- `workspace.yaml` wires the repository module into Dagster's workspace loader.
- `repository.py` exposes a placeholder repository (`demo_repository`) that you can replace with pipelines, jobs, and schedules for your lesson.

## Customizing for a Lesson

1. Add your Dagster assets or jobs to `repository.py` or split them into additional Python modules.
2. Update `workspace.yaml` if you rename modules or want to register multiple repositories.
3. Regenerate the scaffold (`@airnub/devc lesson.generate`) so the updated repository ships with the lesson manifest.

The generator will copy any additional files you place here, allowing you to pre-seed sample data, schedules, or sensors required for the classroom experience.
