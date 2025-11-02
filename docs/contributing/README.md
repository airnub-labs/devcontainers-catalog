# Contributing

> Guidelines for contributing to the devcontainers-catalog

This directory contains documentation for contributors including development setup, maintainer guides, and security policies.

---

## Contribution Guides

### [Development](./development.md)
**Development environment setup**

Get started contributing:
- Local development setup
- Prerequisites and tools
- Running tests
- Build and validation workflows

### [Maintainers](./maintainers.md)
**Maintainer guidelines and procedures**

For maintainers:
- Release processes
- Review guidelines
- Publishing workflows
- Repository management

---

## Quick Start for Contributors

1. **Fork the repository**
2. **Clone your fork:** `git clone https://github.com/YOUR_USERNAME/devcontainers-catalog`
3. **Create a branch:** `git checkout -b feature/your-feature`
4. **Make changes** and test locally
5. **Commit:** Follow [conventional commits](https://www.conventionalcommits.org/)
6. **Push:** `git push origin feature/your-feature`
7. **Open a Pull Request**

---

## Contribution Types

### Features
- New Dev Container features
- Templates and stacks
- Service fragments
- Generator improvements

### Documentation
- Guide improvements
- API documentation
- Examples and tutorials
- Architecture docs

### Bug Fixes
- Feature bugs
- Template issues
- Generator problems
- Documentation errors

### Testing
- Test coverage
- Integration tests
- Smoke tests
- CI improvements

---

## Code Standards

### Features
- Idempotent install scripts
- No long-running daemons
- Proper `installsAfter` dependencies
- DevContainer spec compliance

### Templates
- Variable substitution support
- Minimal, focused configurations
- Clear documentation
- Working examples

### Documentation
- Clear, concise writing
- Code examples included
- Proper markdown formatting
- Links validated

---

## Related Documentation

- **[Main CONTRIBUTING.md](../../CONTRIBUTING.md)** - Repository contribution guidelines
- **[CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md)** - Community standards
- **[SECURITY.md](../../SECURITY.md)** - Security policies and vulnerability reporting
- **[Architecture](../architecture/README.md)** - System design

---

**Last Updated:** 2025-11-02 (Phase 5: Organize Remaining Docs)
