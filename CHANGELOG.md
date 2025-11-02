# Changelog

All notable changes to the Airnub DevContainers Catalog will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation reorganization (Phases 0-5)
- Enhanced documentation hub at `docs/README.md`
- New documentation structure with categorical directories
- Health checks and status tooling for sidecars
- CodespacesAdapter for GitHub Codespaces support
- noVNC observability features
- Lesson scaffolding enablement plan
- Manifest schema and generator scaffolding
- Stack generator SDK exposed
- MVP launch plan documentation

### Changed
- Documentation reorganized into `getting-started/`, `guides/`, `architecture/`, `reference/`, `vision/`, `operations/`, `contributing/` directories
- SECURITY.md moved to root per GitHub convention
- VERSIONING.md moved to `docs/reference/`
- MVP documentation promoted from `mvp-launch/` to `mvp/`
- Service documentation aligned with experimental policy

### Deprecated
- Legacy workspace architecture patterns (archived in `docs/archive/2024-10-28/`)
- Older catalog architecture documents (consolidated)

### Removed
- None (all deprecated content archived, not deleted)

### Fixed
- CLI workflows setup and triggers
- Documentation link references

## [2024-11-02] - Documentation Reorganization

### Added
- Phase 0: Preparation & Safety Net for doc reorganization
- Phase 1: Created documentation structure with categorical directories
- Phase 2: Archived legacy documentation with header notes
- Phase 3: Organized MVP & core architecture documentation
- Phase 4: Consolidated duplicate documentation
- Phase 5: Organized remaining documentation files
- Archive directory with date-organized historical docs
- Comprehensive README files for all documentation sections

### Changed
- All documentation files moved to appropriate categorical directories
- 17 core documentation files reorganized
- 6 legacy documents archived with explanatory headers
- 2 duplicate guides consolidated into single comprehensive guide

## [2024-11-01] - Health Checks & Observability

### Added
- Health checks for sidecars (#68)
- Status tooling for monitoring sidecar services
- Complete Codespaces adapter (#67)
- Sidecar observability features
- noVNC observability documentation (#66)

### Changed
- Service documentation and registry aligned with experimental policy (#65)

## [2024-10-31] - Generator & Manifest Features

### Added
- Stack generator SDK (#62)
- Lesson scaffolding enablement plan (#61)
- Manifest schema and generator scaffolding (#60)
- MVP launch plan document (#59)

### Fixed
- CLI workflows setup and triggers (#58)

## [2024-10-30] - Template & Stack Updates

### Added
- Multiple stack templates with service combinations
- Chrome CDP and browser automation support
- Webtop and noVNC desktop environment options
- Supabase local stack integration

### Changed
- Template naming conventions standardized
- Feature dependencies refined

## Earlier Releases

For changes prior to 2024-10-30, please see the git commit history:
```bash
git log --oneline --before="2024-10-30"
```

---

## Release Notes Format

Each release includes:

### Added
New features and capabilities added to the catalog.

### Changed
Changes to existing functionality.

### Deprecated
Features that will be removed in upcoming releases.

### Removed
Features that have been removed (rare - we prefer archiving).

### Fixed
Bug fixes and corrections.

### Security
Security-related changes and fixes.

---

## Version Tags

Releases are tagged using semantic versioning:
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward compatible manner
- **PATCH** version for backward compatible bug fixes

Example: `v1.2.3` where:
- `1` = Major version
- `2` = Minor version
- `3` = Patch version

---

## Links

- [Repository](https://github.com/airnub-labs/devcontainers-catalog)
- [Documentation](docs/README.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

---

**Note:** This CHANGELOG was created on 2025-11-02 as part of the documentation reorganization project. Previous changes were extracted from git history. Future releases will maintain this format prospectively.
