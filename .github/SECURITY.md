# Security Policy

## Supported Versions

| Version | Supported |
| ------- | ---------- |
| main    | ✅ Active development |
| < 1.0   | ❌ Not yet released |

## Security Scanning

This repository employs multiple automated security scanning tools:

### 🔍 Vulnerability Scanning

- **Trivy**: Scans Docker images and npm dependencies for CVEs
  - Runs on: Pull requests, pushes to `main`, weekly schedule
  - Severity: CRITICAL, HIGH, MEDIUM
  - Reports: GitHub Security tab

- **Snyk**: Advanced dependency vulnerability analysis
  - Runs on: Pull requests, pushes to `main`, daily schedule
  - Severity threshold: HIGH
  - Dashboard: [Snyk App](https://app.snyk.io)

- **Dependabot**: Automated dependency updates
  - Scans: Docker images, npm packages
  - Frequency: Weekly
  - Auto-creates pull requests for updates

### 📦 Software Bill of Materials (SBOM)

SBOMs are automatically generated for all packages:
- **Formats**: CycloneDX 1.5 (JSON), SPDX 2.3 (JSON)
- **Triggers**: Pushes to `main`, releases, manual dispatch
- **Access**: GitHub Actions artifacts and release attachments

### 🛡️ Reporting a Vulnerability

If you discover a security vulnerability:

1. **Do not** open a public GitHub issue
2. Email: security@airnub.dev
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response Time**: We aim to respond within 48 hours.

### 🔒 Security Best Practices

When contributing:
- ✅ Never commit secrets, API keys, or credentials
- ✅ Use `.env.example` for environment variable templates
- ✅ Keep dependencies up to date
- ✅ Follow principle of least privilege
- ✅ Validate all user inputs
- ✅ Use TypeScript strict mode

### 📊 Security Metrics

Stay informed about the security posture:
- [Security Advisories](https://github.com/airnub-labs/devcontainers-catalog/security/advisories)
- [Dependency Graph](https://github.com/airnub-labs/devcontainers-catalog/network/dependencies)
- [Security Scanning Results](https://github.com/airnub-labs/devcontainers-catalog/security)
