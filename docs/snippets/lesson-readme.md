# Student Lesson Scaffold

This scaffold points to a prebuilt lesson image hosted on GHCR and was emitted by `@airnub/devc`.

## Quickstart

1. Copy `.devcontainer/.env.example` to `.devcontainer/.env` and fill in any placeholders.
2. Open the repository in VS Code and choose **Dev Containers: Reopen in Container** (or launch in GitHub Codespaces).
3. The dev container will pull the prebuilt lesson image so students on low-power devices get the same experience as Codespaces.

## Lesson Image Automation

* The manifest that defines this lesson lives in `lesson.yaml`.
* `.github/workflows/prebuild.yml` shows how to publish the lesson image using GitHub Actions.
* To update the scaffold when the catalog changes, run:

```bash
npx @airnub/devc generate lesson -m lesson.yaml -o . --catalog-ref <sha>
```

Keep any custom lesson materials outside of the managed comment blocks so future updates merge cleanly.
