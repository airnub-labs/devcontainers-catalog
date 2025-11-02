# Coding Agent Prompt: CI/CD, Security, and Documentation Excellence

## Executive Summary

This prompt guides implementation of advanced CI/CD workflows, comprehensive security scanning, and automated API documentation to achieve a **10/10 codebase score**. You will enhance the existing GitHub Actions infrastructure with coverage reporting, security automation, TypeDoc documentation, and release workflows.

**Target Score**: 10.0/10
**Current State**: 9.3/10
**Gap to Close**: +0.7 points across CI/CD, Security, and Documentation categories

---

## Prerequisites & Context

### Current Codebase State

**Project**: `airnub-labs/devcontainers-catalog`
**Repository Root**: `/home/user/devcontainers-catalog`

**Packages Structure**:
```
packages/
├── sdk-codespaces-adapter/    # GitHub Codespaces SDK (TypeScript, vitest ^2.1.4)
└── sidecar-agent/             # Sidecar agent binary (TypeScript, no tests)

tools/
├── airnub-devc/               # CLI tool (TypeScript, vitest ^1.6.0)
└── catalog-generator/         # Catalog generator (Node native test runner)
```

**Existing CI/CD Workflows** (14 total):
- **CI Workflows (9)**: `ci-pr-check.yml`, `ci-cli-test.yml`, `ci-manifest-generator.yml`, `ci-smoke-tests.yml`, `ci-lint-namespaces.yml`, `ci-validate-devcontainers.yml`, `ci-cli-e2e.yml`, `ci-test-features.yml`, `ci-test-templates.yml`
- **CD Workflows (5)**: `cd-publish-features.yml`, `cd-publish-templates.yml`, `cd-build-images.yml`, `cd-build-presets.yml`, `cd-publish-lesson-images.yml`

**Testing Infrastructure**:
- `tools/airnub-devc`: Vitest 1.6.0 with 3 test files (`catalog.spec.ts`, `services.spec.ts`, `stacks.spec.ts`) - **~85% coverage**
- `packages/sdk-codespaces-adapter`: Vitest 2.1.4 with adapter tests - **~75% coverage**
- `tools/catalog-generator`: Node.js native test runner

**Security Tools in Use**:
- Trivy vulnerability scanning (in `cd-build-images.yml`)
- Dependabot for Docker images
- SARIF upload to GitHub CodeQL

**Documentation**:
- 46 markdown files in `docs/`
- 3 Architecture Decision Records (ADRs)
- Comprehensive JSDoc coverage in TypeScript sources
- **Missing**: Generated API documentation (TypeDoc)

---

## Mission: Four-Pillar Enhancement

You will implement **four critical improvements** to achieve excellence:

### 1. Coverage Metrics Reporting 📊
- Add vitest coverage collection to CI workflows
- Generate coverage badges for README
- Report coverage trends in pull requests
- Configure coverage thresholds (80%+)

### 2. TypeDoc API Documentation 📚
- Configure TypeDoc for both TypeScript packages
- Generate HTML documentation from JSDoc comments
- Deploy to GitHub Pages via GitHub Actions
- Add API documentation links to README

### 3. Security Scanning Automation 🔒
- Expand Trivy scanning to all Docker images and npm packages
- Add Snyk for dependency vulnerability analysis
- Generate SBOM (Software Bill of Materials) for supply chain transparency
- Integrate security checks into PR workflows

### 4. CI/CD Enhancements 🚀
- Implement coverage diff reporting in PRs
- Add semantic versioning automation (conventional commits)
- Create release workflow with changelog generation
- Optimize workflow performance and caching

---

## Detailed Implementation Guide

## PILLAR 1: Coverage Metrics Reporting 📊

### Context

Current test coverage is strong (~75-85%) but **not visible** in the repository:
- No coverage reports in CI
- No coverage badges
- No coverage trends over time
- No PR coverage diffs

**Goal**: Make test coverage visible, measurable, and enforced.

---

### Task 1.1: Configure Vitest Coverage

**File**: `tools/airnub-devc/vitest.config.ts` (create)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8', // Use v8 for fastest coverage (recommended)
      reporter: [
        'text',        // Terminal output
        'text-summary', // Summary for CI logs
        'json',        // Machine-readable for coverage diff
        'json-summary', // Compact summary for badges
        'html',        // HTML report for local viewing
        'lcov',        // Standard format for external tools
        'cobertura'    // XML format for some CI tools
      ],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/__tests__/**',
        'src/types/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts'
      ],
      all: true, // Include all files, even untested ones
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      // Fail CI if coverage drops below thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
        autoUpdate: false // Don't auto-update thresholds
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**File**: `packages/sdk-codespaces-adapter/vitest.config.ts` (create)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./src/__tests__/setup.ts'], // If needed for mocks
    coverage: {
      provider: 'v8',
      reporter: [
        'text',
        'text-summary',
        'json',
        'json-summary',
        'html',
        'lcov',
        'cobertura'
      ],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/__tests__/**',
        'src/types.ts', // Type-only file
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts'
      ],
      all: true,
      lines: 75,
      functions: 75,
      branches: 70,
      statements: 75,
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75,
        autoUpdate: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**Update Package Scripts**:

`tools/airnub-devc/package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^1.6.0",
    "vitest": "^1.6.0"
  }
}
```

`packages/sdk-codespaces-adapter/package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^2.1.4",
    "vitest": "^2.1.4"
  }
}
```

---

### Task 1.2: CI Coverage Reporting Workflow

**File**: `.github/workflows/ci-coverage-report.yml` (create)

```yaml
name: Coverage Report

on:
  pull_request:
    paths:
      - 'packages/**/*.ts'
      - 'tools/**/*.ts'
      - 'packages/**/package.json'
      - 'tools/**/package.json'
      - '.github/workflows/ci-coverage-report.yml'
  push:
    branches:
      - main
    paths:
      - 'packages/**/*.ts'
      - 'tools/**/*.ts'

permissions:
  contents: read
  pull-requests: write # For PR comments

jobs:
  coverage-airnub-devc:
    name: Coverage - airnub-devc
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for coverage comparison

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: tools/airnub-devc/package-lock.json

      - name: Install dependencies
        working-directory: tools/airnub-devc
        run: npm ci

      - name: Run tests with coverage
        working-directory: tools/airnub-devc
        run: npm run test:coverage

      - name: Generate coverage summary
        id: coverage-summary
        working-directory: tools/airnub-devc
        run: |
          # Extract coverage percentages from json-summary
          LINES=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
          STATEMENTS=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
          FUNCTIONS=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
          BRANCHES=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)

          echo "lines=$LINES" >> $GITHUB_OUTPUT
          echo "statements=$STATEMENTS" >> $GITHUB_OUTPUT
          echo "functions=$FUNCTIONS" >> $GITHUB_OUTPUT
          echo "branches=$BRANCHES" >> $GITHUB_OUTPUT

      - name: Upload coverage reports
        uses: actions/upload-artifact@v4
        with:
          name: coverage-airnub-devc
          path: |
            tools/airnub-devc/coverage/coverage-summary.json
            tools/airnub-devc/coverage/lcov.info
            tools/airnub-devc/coverage/cobertura-coverage.xml
          retention-days: 30

      - name: Comment coverage on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const lines = '${{ steps.coverage-summary.outputs.lines }}';
            const statements = '${{ steps.coverage-summary.outputs.statements }}';
            const functions = '${{ steps.coverage-summary.outputs.functions }}';
            const branches = '${{ steps.coverage-summary.outputs.branches }}';

            const body = `## 📊 Coverage Report: \`airnub-devc\`

            | Metric | Coverage |
            |--------|----------|
            | **Lines** | ${lines}% |
            | **Statements** | ${statements}% |
            | **Functions** | ${functions}% |
            | **Branches** | ${branches}% |

            <details>
            <summary>Coverage Thresholds</summary>

            - ✅ Lines: 80%
            - ✅ Statements: 80%
            - ✅ Functions: 80%
            - ✅ Branches: 75%

            </details>
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });

  coverage-sdk-codespaces:
    name: Coverage - sdk-codespaces-adapter
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: packages/sdk-codespaces-adapter/package-lock.json

      - name: Install dependencies
        working-directory: packages/sdk-codespaces-adapter
        run: npm ci

      - name: Run tests with coverage
        working-directory: packages/sdk-codespaces-adapter
        run: npm run test:coverage

      - name: Generate coverage summary
        id: coverage-summary
        working-directory: packages/sdk-codespaces-adapter
        run: |
          LINES=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
          STATEMENTS=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
          FUNCTIONS=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
          BRANCHES=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)

          echo "lines=$LINES" >> $GITHUB_OUTPUT
          echo "statements=$STATEMENTS" >> $GITHUB_OUTPUT
          echo "functions=$FUNCTIONS" >> $GITHUB_OUTPUT
          echo "branches=$BRANCHES" >> $GITHUB_OUTPUT

      - name: Upload coverage reports
        uses: actions/upload-artifact@v4
        with:
          name: coverage-sdk-codespaces
          path: |
            packages/sdk-codespaces-adapter/coverage/coverage-summary.json
            packages/sdk-codespaces-adapter/coverage/lcov.info
            packages/sdk-codespaces-adapter/coverage/cobertura-coverage.xml
          retention-days: 30

      - name: Comment coverage on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const lines = '${{ steps.coverage-summary.outputs.lines }}';
            const statements = '${{ steps.coverage-summary.outputs.statements }}';
            const functions = '${{ steps.coverage-summary.outputs.functions }}';
            const branches = '${{ steps.coverage-summary.outputs.branches }}';

            const body = `## 📊 Coverage Report: \`sdk-codespaces-adapter\`

            | Metric | Coverage |
            |--------|----------|
            | **Lines** | ${lines}% |
            | **Statements** | ${statements}% |
            | **Functions** | ${functions}% |
            | **Branches** | ${branches}% |

            <details>
            <summary>Coverage Thresholds</summary>

            - ✅ Lines: 75%
            - ✅ Statements: 75%
            - ✅ Functions: 75%
            - ✅ Branches: 70%

            </details>
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });

  coverage-badge:
    name: Generate Coverage Badge
    runs-on: ubuntu-latest
    needs: [coverage-airnub-devc, coverage-sdk-codespaces]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          ref: main
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Download coverage artifacts
        uses: actions/download-artifact@v4
        with:
          pattern: coverage-*
          path: ./coverage-reports

      - name: Calculate average coverage
        id: calc-coverage
        run: |
          # Calculate average across both packages
          DEVC_LINES=$(jq -r '.total.lines.pct' coverage-reports/coverage-airnub-devc/coverage-summary.json)
          SDK_LINES=$(jq -r '.total.lines.pct' coverage-reports/coverage-sdk-codespaces/coverage-summary.json)

          AVG_COVERAGE=$(echo "scale=1; ($DEVC_LINES + $SDK_LINES) / 2" | bc)
          echo "coverage=$AVG_COVERAGE" >> $GITHUB_OUTPUT

      - name: Create coverage badge
        uses: schneegans/dynamic-badges-action@v1.7.0
        with:
          auth: ${{ secrets.GITHUB_TOKEN }}
          gistID: <REPLACE_WITH_GIST_ID> # Create a gist for badge storage
          filename: devcontainers-catalog-coverage.json
          label: coverage
          message: ${{ steps.calc-coverage.outputs.coverage }}%
          valColorRange: ${{ steps.calc-coverage.outputs.coverage }}
          maxColorRange: 100
          minColorRange: 0
```

**Configuration Notes**:
- **Gist ID**: You'll need to create a GitHub Gist to store badge data. Replace `<REPLACE_WITH_GIST_ID>` with your gist ID.
- **Alternative Badge Solutions**: Can use Codecov, Coveralls, or Shields.io endpoint badges

---

### Task 1.3: Coverage Diff in Pull Requests

**File**: `.github/workflows/ci-coverage-diff.yml` (create)

```yaml
name: Coverage Diff

on:
  pull_request:
    paths:
      - 'packages/**/*.ts'
      - 'tools/**/*.ts'
      - '!**/*.spec.ts'
      - '!**/*.test.ts'

permissions:
  contents: read
  pull-requests: write

jobs:
  coverage-diff:
    name: Coverage Comparison
    runs-on: ubuntu-latest
    steps:
      - name: Checkout PR branch
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install and test PR branch (airnub-devc)
        working-directory: tools/airnub-devc
        run: |
          npm ci
          npm run test:coverage
          cp coverage/coverage-summary.json /tmp/pr-coverage-devc.json

      - name: Install and test PR branch (sdk-codespaces)
        working-directory: packages/sdk-codespaces-adapter
        run: |
          npm ci
          npm run test:coverage
          cp coverage/coverage-summary.json /tmp/pr-coverage-sdk.json

      - name: Checkout base branch
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.base.sha }}
          clean: false

      - name: Test base branch (airnub-devc)
        working-directory: tools/airnub-devc
        run: |
          npm ci
          npm run test:coverage
          cp coverage/coverage-summary.json /tmp/base-coverage-devc.json

      - name: Test base branch (sdk-codespaces)
        working-directory: packages/sdk-codespaces-adapter
        run: |
          npm ci
          npm run test:coverage
          cp coverage/coverage-summary.json /tmp/base-coverage-sdk.json

      - name: Generate coverage diff report
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');

            function readCoverage(path) {
              return JSON.parse(fs.readFileSync(path, 'utf8'));
            }

            function formatDiff(prVal, baseVal) {
              const diff = (prVal - baseVal).toFixed(2);
              const sign = diff >= 0 ? '+' : '';
              const emoji = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
              return `${emoji} ${sign}${diff}%`;
            }

            const prDevc = readCoverage('/tmp/pr-coverage-devc.json');
            const baseDevc = readCoverage('/tmp/base-coverage-devc.json');
            const prSdk = readCoverage('/tmp/pr-coverage-sdk.json');
            const baseSdk = readCoverage('/tmp/base-coverage-sdk.json');

            const body = `## 📊 Coverage Diff Report

            ### \`airnub-devc\`

            | Metric | Base | PR | Diff |
            |--------|------|-----|------|
            | Lines | ${baseDevc.total.lines.pct}% | ${prDevc.total.lines.pct}% | ${formatDiff(prDevc.total.lines.pct, baseDevc.total.lines.pct)} |
            | Statements | ${baseDevc.total.statements.pct}% | ${prDevc.total.statements.pct}% | ${formatDiff(prDevc.total.statements.pct, baseDevc.total.statements.pct)} |
            | Functions | ${baseDevc.total.functions.pct}% | ${prDevc.total.functions.pct}% | ${formatDiff(prDevc.total.functions.pct, baseDevc.total.functions.pct)} |
            | Branches | ${baseDevc.total.branches.pct}% | ${prDevc.total.branches.pct}% | ${formatDiff(prDevc.total.branches.pct, baseDevc.total.branches.pct)} |

            ### \`sdk-codespaces-adapter\`

            | Metric | Base | PR | Diff |
            |--------|------|-----|------|
            | Lines | ${baseSdk.total.lines.pct}% | ${prSdk.total.lines.pct}% | ${formatDiff(prSdk.total.lines.pct, baseSdk.total.lines.pct)} |
            | Statements | ${baseSdk.total.statements.pct}% | ${prSdk.total.statements.pct}% | ${formatDiff(prSdk.total.statements.pct, baseSdk.total.statements.pct)} |
            | Functions | ${baseSdk.total.functions.pct}% | ${prSdk.total.functions.pct}% | ${formatDiff(prSdk.total.functions.pct, baseSdk.total.functions.pct)} |
            | Branches | ${baseSdk.total.branches.pct}% | ${prSdk.total.branches.pct}% | ${formatDiff(prSdk.total.branches.pct, baseSdk.total.branches.pct)} |
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

---

### Task 1.4: Update README with Coverage Badge

**File**: `README.md` (update)

Add coverage badge to the top of the README, after the title:

```markdown
# DevContainers Catalog

[![CI Status](https://github.com/airnub-labs/devcontainers-catalog/actions/workflows/ci-cli-test.yml/badge.svg)](https://github.com/airnub-labs/devcontainers-catalog/actions/workflows/ci-cli-test.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/<YOUR_USERNAME>/<GIST_ID>/raw/devcontainers-catalog-coverage.json)](https://github.com/airnub-labs/devcontainers-catalog/actions/workflows/ci-coverage-report.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A curated catalog of DevContainer features, templates, services, and presets for classroom-ready development environments.
```

**Additional Badges to Consider**:
```markdown
[![TypeDoc](https://img.shields.io/badge/API%20Docs-TypeDoc-blue)](https://airnub-labs.github.io/devcontainers-catalog/)
[![Security: Trivy](https://img.shields.io/badge/Security-Trivy-green)](https://github.com/airnub-labs/devcontainers-catalog/security)
```

---

## PILLAR 2: TypeDoc API Documentation 📚

### Context

Current documentation is comprehensive but **lacks generated API docs**:
- 129 JSDoc blocks exist in TypeScript sources
- No HTML API documentation
- No hosted documentation site
- Developers must read source code to understand APIs

**Goal**: Generate beautiful, searchable API documentation from JSDoc and deploy to GitHub Pages.

---

### Task 2.1: Configure TypeDoc

**File**: `tools/airnub-devc/typedoc.json` (create)

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["./src/sdk.ts"],
  "entryPointStrategy": "expand",
  "out": "../../docs-site/api/airnub-devc",
  "plugin": ["typedoc-plugin-markdown"],
  "name": "Airnub DevContainers CLI",
  "includeVersion": true,
  "readme": "./README.md",
  "categorizeByGroup": true,
  "categoryOrder": [
    "Core",
    "Stack Generation",
    "Catalog",
    "Services",
    "Types",
    "*"
  ],
  "groupOrder": [
    "Functions",
    "Classes",
    "Interfaces",
    "Type Aliases",
    "Enums"
  ],
  "exclude": [
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/node_modules/**",
    "**/dist/**"
  ],
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": true,
  "validation": {
    "notExported": true,
    "invalidLink": true,
    "notDocumented": false
  },
  "sort": ["source-order"],
  "kindSortOrder": [
    "Function",
    "Class",
    "Interface",
    "TypeAlias",
    "Enum",
    "Variable"
  ],
  "navigation": {
    "includeCategories": true,
    "includeGroups": true
  },
  "visibilityFilters": {
    "protected": true,
    "private": false,
    "inherited": true,
    "external": false
  },
  "searchInComments": true,
  "searchInDocuments": true
}
```

**File**: `packages/sdk-codespaces-adapter/typedoc.json` (create)

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["./src/index.ts"],
  "entryPointStrategy": "expand",
  "out": "../../docs-site/api/sdk-codespaces-adapter",
  "plugin": ["typedoc-plugin-markdown"],
  "name": "Codespaces Adapter SDK",
  "includeVersion": true,
  "readme": "./README.md",
  "categorizeByGroup": true,
  "categoryOrder": [
    "Core",
    "Authentication",
    "Codespaces",
    "Secrets",
    "Types",
    "*"
  ],
  "groupOrder": [
    "Classes",
    "Functions",
    "Interfaces",
    "Type Aliases",
    "Enums"
  ],
  "exclude": [
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/node_modules/**",
    "**/dist/**"
  ],
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": true,
  "validation": {
    "notExported": true,
    "invalidLink": true,
    "notDocumented": false
  },
  "sort": ["source-order"],
  "kindSortOrder": [
    "Class",
    "Interface",
    "Function",
    "TypeAlias",
    "Enum",
    "Variable"
  ],
  "navigation": {
    "includeCategories": true,
    "includeGroups": true
  },
  "visibilityFilters": {
    "protected": true,
    "private": false,
    "inherited": true,
    "external": false
  },
  "searchInComments": true,
  "searchInDocuments": true
}
```

**Update Package Dependencies**:

`tools/airnub-devc/package.json`:
```json
{
  "scripts": {
    "docs": "typedoc",
    "docs:watch": "typedoc --watch",
    "docs:json": "typedoc --json ../../docs-site/api/airnub-devc.json"
  },
  "devDependencies": {
    "typedoc": "^0.26.0",
    "typedoc-plugin-markdown": "^4.2.0"
  }
}
```

`packages/sdk-codespaces-adapter/package.json`:
```json
{
  "scripts": {
    "docs": "typedoc",
    "docs:watch": "typedoc --watch",
    "docs:json": "typedoc --json ../../docs-site/api/sdk-codespaces.json"
  },
  "devDependencies": {
    "typedoc": "^0.26.0",
    "typedoc-plugin-markdown": "^4.2.0"
  }
}
```

---

### Task 2.2: Create Documentation Site Structure

**File**: `docs-site/index.html` (create)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevContainers Catalog - API Documentation</title>
  <link rel="stylesheet" href="./styles.css">
  <link rel="icon" type="image/svg+xml" href="./favicon.svg">
</head>
<body>
  <header class="hero">
    <div class="container">
      <h1>🎓 DevContainers Catalog</h1>
      <p class="tagline">API Documentation for classroom-ready development environments</p>
      <nav class="nav">
        <a href="https://github.com/airnub-labs/devcontainers-catalog" target="_blank">GitHub</a>
        <a href="./api/airnub-devc/index.html">CLI API</a>
        <a href="./api/sdk-codespaces-adapter/index.html">Codespaces SDK</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <section class="intro">
      <h2>Welcome to the API Documentation</h2>
      <p>
        This documentation provides comprehensive API references for the DevContainers Catalog packages.
        Choose a package below to explore its API.
      </p>
    </section>

    <section class="packages">
      <div class="package-card">
        <h3>📦 Airnub DevContainers CLI</h3>
        <p>
          Programmatic interface for generating dev container stacks with templates, features, and browser sidecars.
        </p>
        <div class="package-meta">
          <span class="badge">TypeScript</span>
          <span class="badge">Node.js</span>
          <span class="badge">CLI</span>
        </div>
        <a href="./api/airnub-devc/index.html" class="btn-primary">View API Docs</a>
      </div>

      <div class="package-card">
        <h3>🚀 Codespaces Adapter SDK</h3>
        <p>
          High-level client for managing GitHub Codespaces with authentication, secret management, and lifecycle control.
        </p>
        <div class="package-meta">
          <span class="badge">TypeScript</span>
          <span class="badge">GitHub API</span>
          <span class="badge">SDK</span>
        </div>
        <a href="./api/sdk-codespaces-adapter/index.html" class="btn-primary">View API Docs</a>
      </div>
    </section>

    <section class="resources">
      <h2>Additional Resources</h2>
      <ul>
        <li><a href="https://github.com/airnub-labs/devcontainers-catalog#readme">Getting Started</a></li>
        <li><a href="https://github.com/airnub-labs/devcontainers-catalog/blob/main/docs/cli-devc.md">CLI Usage Guide</a></li>
        <li><a href="https://github.com/airnub-labs/devcontainers-catalog/blob/main/docs/adr/README.md">Architecture Decisions</a></li>
        <li><a href="https://github.com/airnub-labs/devcontainers-catalog/blob/main/DEVELOPMENT.md">Development Guide</a></li>
      </ul>
    </section>
  </main>

  <footer>
    <div class="container">
      <p>&copy; 2025 Airnub Labs. Licensed under MIT.</p>
      <p>
        <a href="https://github.com/airnub-labs/devcontainers-catalog/issues">Report an Issue</a> ·
        <a href="https://github.com/airnub-labs/devcontainers-catalog/blob/main/CONTRIBUTING.md">Contribute</a>
      </p>
    </div>
  </footer>
</body>
</html>
```

**File**: `docs-site/styles.css` (create)

```css
:root {
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --bg-main: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --shadow: rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-main);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rem 0 3rem;
  text-align: center;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.tagline {
  font-size: 1.25rem;
  opacity: 0.95;
  margin-bottom: 2rem;
}

.nav {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 2rem;
}

.nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.nav a:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: white;
}

main {
  padding: 4rem 0;
}

.intro {
  text-align: center;
  margin-bottom: 4rem;
}

.intro h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.intro p {
  font-size: 1.125rem;
  color: var(--text-secondary);
  max-width: 700px;
  margin: 0 auto;
}

.packages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.package-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 2rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.package-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px var(--shadow);
}

.package-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--primary);
}

.package-card p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.package-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--primary);
  color: white;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.resources {
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid var(--border);
}

.resources h2 {
  margin-bottom: 1rem;
}

.resources ul {
  list-style: none;
}

.resources li {
  margin-bottom: 0.75rem;
}

.resources a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.resources a:hover {
  text-decoration: underline;
}

footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 2rem 0;
  text-align: center;
  color: var(--text-secondary);
}

footer a {
  color: var(--primary);
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }

  .packages {
    grid-template-columns: 1fr;
  }

  .nav {
    flex-direction: column;
    align-items: center;
  }
}
```

**File**: `docs-site/favicon.svg` (create)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#667eea"/>
  <text x="50" y="70" font-size="60" text-anchor="middle" fill="white" font-family="Arial, sans-serif">🎓</text>
</svg>
```

---

### Task 2.3: GitHub Pages Deployment Workflow

**File**: `.github/workflows/cd-deploy-docs.yml` (create)

```yaml
name: Deploy API Documentation

on:
  push:
    branches:
      - main
    paths:
      - 'tools/airnub-devc/src/**'
      - 'packages/sdk-codespaces-adapter/src/**'
      - 'tools/airnub-devc/typedoc.json'
      - 'packages/sdk-codespaces-adapter/typedoc.json'
      - 'docs-site/**'
      - '.github/workflows/cd-deploy-docs.yml'
  workflow_dispatch: # Allow manual triggers

permissions:
  contents: read
  pages: write
  id-token: write

# Allow one concurrent deployment
concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-docs:
    name: Build TypeDoc Documentation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies (airnub-devc)
        working-directory: tools/airnub-devc
        run: npm ci

      - name: Install dependencies (sdk-codespaces)
        working-directory: packages/sdk-codespaces-adapter
        run: npm ci

      - name: Generate TypeDoc (airnub-devc)
        working-directory: tools/airnub-devc
        run: npm run docs

      - name: Generate TypeDoc (sdk-codespaces)
        working-directory: packages/sdk-codespaces-adapter
        run: npm run docs

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './docs-site'

  deploy:
    name: Deploy to GitHub Pages
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build-docs
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Enable GitHub Pages**:
1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. Custom domain (optional): `docs.airnub.dev` or similar

---

### Task 2.4: Update Documentation Links

**File**: `README.md` (update)

Add API documentation section:

```markdown
## 📚 Documentation

### User Documentation
- [Getting Started](./docs/README.md)
- [CLI Usage Guide](./docs/cli-devc.md)
- [Development Guide](./DEVELOPMENT.md)

### API Documentation
- [📦 Airnub DevContainers CLI API](https://airnub-labs.github.io/devcontainers-catalog/api/airnub-devc/)
- [🚀 Codespaces Adapter SDK API](https://airnub-labs.github.io/devcontainers-catalog/api/sdk-codespaces-adapter/)

### Architecture
- [Architecture Decision Records](./docs/adr/README.md)
- [Catalog Architecture](./docs/CATALOG-ARCHITECTURE.md)
- [Platform Architecture](./docs/platform-architecture.md)
```

**File**: `tools/airnub-devc/README.md` (update)

```markdown
# Airnub DevContainers CLI

...

## 📖 Documentation

- [Full API Documentation](https://airnub-labs.github.io/devcontainers-catalog/api/airnub-devc/)
- [CLI Usage Guide](../../docs/cli-devc.md)
- [Examples](../../docs/cli-devc.md#examples)

...
```

**File**: `packages/sdk-codespaces-adapter/README.md` (update)

```markdown
# Codespaces Adapter SDK

...

## 📖 API Documentation

Full API documentation is available at:
👉 [https://airnub-labs.github.io/devcontainers-catalog/api/sdk-codespaces-adapter/](https://airnub-labs.github.io/devcontainers-catalog/api/sdk-codespaces-adapter/)

...
```

---

## PILLAR 3: Security Scanning Automation 🔒

### Context

Current security posture:
- ✅ Trivy scanning for Docker images (in `cd-build-images.yml`)
- ✅ Dependabot for Docker dependencies
- ❌ No npm dependency scanning
- ❌ No SBOM generation
- ❌ No Snyk integration
- ❌ No security scanning in PRs

**Goal**: Comprehensive, automated security scanning across all artifacts.

---

### Task 3.1: Expand Trivy Scanning

**File**: `.github/workflows/ci-security-scan.yml` (create)

```yaml
name: Security Scanning

on:
  pull_request:
    paths:
      - '**/package.json'
      - '**/package-lock.json'
      - 'images/**'
      - 'features/**/Dockerfile'
      - '.github/workflows/ci-security-scan.yml'
  push:
    branches:
      - main
  schedule:
    # Run weekly security scans on Mondays at 9 AM UTC
    - cron: '0 9 * * 1'

permissions:
  contents: read
  security-events: write
  pull-requests: write

jobs:
  trivy-npm-scan:
    name: Trivy - NPM Dependencies
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package:
          - path: tools/airnub-devc
            name: airnub-devc
          - path: packages/sdk-codespaces-adapter
            name: sdk-codespaces-adapter
          - path: tools/catalog-generator
            name: catalog-generator
          - path: packages/sidecar-agent
            name: sidecar-agent
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner (npm)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '${{ matrix.package.path }}'
          format: 'sarif'
          output: 'trivy-${{ matrix.package.name }}-results.sarif'
          severity: 'CRITICAL,HIGH,MEDIUM'
          vuln-type: 'library'
          ignore-unfixed: true
          exit-code: '0' # Don't fail CI, just report

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-${{ matrix.package.name }}-results.sarif'
          category: 'trivy-npm-${{ matrix.package.name }}'

      - name: Generate human-readable report
        if: github.event_name == 'pull_request'
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '${{ matrix.package.path }}'
          format: 'table'
          output: 'trivy-${{ matrix.package.name }}-report.txt'
          severity: 'CRITICAL,HIGH'
          ignore-unfixed: true

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('trivy-${{ matrix.package.name }}-report.txt', 'utf8');

            const body = `## 🔒 Trivy Security Scan: \`${{ matrix.package.name }}\`

            \`\`\`
            ${report}
            \`\`\`

            <details>
            <summary>ℹ️ About this scan</summary>

            This scan checks for known vulnerabilities in npm dependencies.
            - **Severity**: CRITICAL, HIGH, MEDIUM
            - **Unfixed vulnerabilities**: Ignored (not actionable)
            - **Full report**: Available in Security tab

            </details>
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });

  trivy-docker-scan:
    name: Trivy - Docker Images
    runs-on: ubuntu-latest
    strategy:
      matrix:
        image:
          - context: images/dev-base
            name: dev-base
          - context: images/dev-web
            name: dev-web
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Build Docker image for scanning
        working-directory: ${{ matrix.image.context }}
        run: docker build -t ${{ matrix.image.name }}:scan .

      - name: Run Trivy vulnerability scanner (Docker)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: '${{ matrix.image.name }}:scan'
          format: 'sarif'
          output: 'trivy-docker-${{ matrix.image.name }}-results.sarif'
          severity: 'CRITICAL,HIGH'
          vuln-type: 'os,library'
          ignore-unfixed: true
          exit-code: '0'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-docker-${{ matrix.image.name }}-results.sarif'
          category: 'trivy-docker-${{ matrix.image.name }}'

      - name: Generate SBOM (CycloneDX)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: '${{ matrix.image.name }}:scan'
          format: 'cyclonedx'
          output: 'sbom-${{ matrix.image.name }}.json'

      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v4
        with:
          name: sbom-docker-${{ matrix.image.name }}
          path: sbom-${{ matrix.image.name }}.json
          retention-days: 90

  trivy-config-scan:
    name: Trivy - Misconfigurations
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run Trivy misconfiguration scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'config'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-config-results.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '0'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-config-results.sarif'
          category: 'trivy-config'
```

---

### Task 3.2: Add Snyk Integration

**File**: `.github/workflows/ci-snyk-scan.yml` (create)

```yaml
name: Snyk Security Scan

on:
  pull_request:
    paths:
      - '**/package.json'
      - '**/package-lock.json'
      - '.github/workflows/ci-snyk-scan.yml'
  push:
    branches:
      - main
  schedule:
    # Daily Snyk scans at 2 AM UTC
    - cron: '0 2 * * *'

permissions:
  contents: read
  security-events: write
  pull-requests: write

jobs:
  snyk-npm:
    name: Snyk - NPM Dependencies
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package:
          - path: tools/airnub-devc
            name: airnub-devc
          - path: packages/sdk-codespaces-adapter
            name: sdk-codespaces-adapter
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: ${{ matrix.package.path }}/package-lock.json

      - name: Install dependencies
        working-directory: ${{ matrix.package.path }}
        run: npm ci

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high --all-projects
          command: test
        continue-on-error: true # Don't fail CI

      - name: Upload Snyk results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: snyk.sarif
          category: 'snyk-${{ matrix.package.name }}'

      - name: Snyk Monitor (track dependencies)
        if: github.ref == 'refs/heads/main'
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          command: monitor
          args: --all-projects --org=${{ secrets.SNYK_ORG_ID }}

  snyk-docker:
    name: Snyk - Docker Images
    runs-on: ubuntu-latest
    strategy:
      matrix:
        image:
          - context: images/dev-base
            name: dev-base
          - context: images/dev-web
            name: dev-web
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Build Docker image for scanning
        working-directory: ${{ matrix.image.context }}
        run: docker build -t ${{ matrix.image.name }}:scan .

      - name: Run Snyk to check Docker image for vulnerabilities
        uses: snyk/actions/docker@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          image: ${{ matrix.image.name }}:scan
          args: --severity-threshold=high --file=${{ matrix.image.context }}/Dockerfile
        continue-on-error: true

      - name: Upload Snyk results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: snyk.sarif
          category: 'snyk-docker-${{ matrix.image.name }}'
```

**Setup Requirements**:
1. Create Snyk account at https://snyk.io
2. Generate Snyk API token
3. Add secrets to GitHub repository:
   - `SNYK_TOKEN`: Your Snyk API token
   - `SNYK_ORG_ID`: Your Snyk organization ID

---

### Task 3.3: Generate SBOM for NPM Packages

**File**: `.github/workflows/cd-publish-sbom.yml` (create)

```yaml
name: Publish SBOM

on:
  push:
    branches:
      - main
    paths:
      - '**/package.json'
      - '**/package-lock.json'
  release:
    types: [published]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate-sbom:
    name: Generate Software Bill of Materials
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package:
          - path: tools/airnub-devc
            name: airnub-devc
          - path: packages/sdk-codespaces-adapter
            name: sdk-codespaces-adapter
          - path: tools/catalog-generator
            name: catalog-generator
          - path: packages/sidecar-agent
            name: sidecar-agent
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        working-directory: ${{ matrix.package.path }}
        run: npm ci

      - name: Generate SBOM (CycloneDX)
        working-directory: ${{ matrix.package.path }}
        run: |
          npx @cyclonedx/cyclonedx-npm \
            --output-file sbom-${{ matrix.package.name }}-cyclonedx.json \
            --output-format JSON \
            --spec-version 1.5

      - name: Generate SBOM (SPDX)
        working-directory: ${{ matrix.package.path }}
        run: |
          npx @cyclonedx/cyclonedx-npm \
            --output-file sbom-${{ matrix.package.name }}-spdx.json \
            --output-format SPDX \
            --spec-version 2.3

      - name: Upload SBOM artifacts
        uses: actions/upload-artifact@v4
        with:
          name: sbom-${{ matrix.package.name }}
          path: |
            ${{ matrix.package.path }}/sbom-*.json
          retention-days: 90

      - name: Attach SBOM to release
        if: github.event_name == 'release'
        uses: softprops/action-gh-release@v2
        with:
          files: |
            ${{ matrix.package.path }}/sbom-*.json
          tag_name: ${{ github.event.release.tag_name }}
```

**Install SBOM Dependencies**:

Add to each package's `package.json`:
```json
{
  "devDependencies": {
    "@cyclonedx/cyclonedx-npm": "^1.19.0"
  }
}
```

---

### Task 3.4: Security Policy Documentation

**File**: `.github/SECURITY.md` (update)

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | ✅ Active development |
| < 1.0   | ❌ Not yet released |

## Security Scanning

This repository employs multiple automated security scanning tools:

### 🔍 Vulnerability Scanning

- **Trivy**: Scans Docker images and npm dependencies for CVEs
  - Runs on: PRs, pushes to main, weekly schedule
  - Severity: CRITICAL, HIGH, MEDIUM
  - Reports: GitHub Security tab

- **Snyk**: Advanced dependency vulnerability analysis
  - Runs on: PRs, pushes to main, daily schedule
  - Severity threshold: HIGH
  - Dashboard: [Snyk App](https://app.snyk.io)

- **Dependabot**: Automated dependency updates
  - Scans: Docker images, npm packages
  - Frequency: Weekly
  - Auto-creates PRs for updates

### 📦 Software Bill of Materials (SBOM)

SBOMs are automatically generated for all packages:
- **Format**: CycloneDX 1.5, SPDX 2.3
- **Trigger**: Pushes to main, releases
- **Access**: Artifacts in GitHub Actions, attached to releases

### 🛡️ Reporting a Vulnerability

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
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

View our security posture:
- [Security Advisories](https://github.com/airnub-labs/devcontainers-catalog/security/advisories)
- [Dependency Graph](https://github.com/airnub-labs/devcontainers-catalog/network/dependencies)
- [Security Scanning Results](https://github.com/airnub-labs/devcontainers-catalog/security)
```

---

## PILLAR 4: CI/CD Enhancements 🚀

### Context

Current CI/CD state:
- 14 workflows (9 CI, 5 CD)
- Good path-based filtering
- Concurrency controls
- **Missing**:
  - Semantic versioning automation
  - Release automation
  - Changelog generation
  - Coverage diff (added in Pillar 1)

**Goal**: Automate releases, versioning, and changelogs.

---

### Task 4.1: Conventional Commits Validation

**File**: `.github/workflows/ci-commit-lint.yml` (create)

```yaml
name: Commit Lint

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  commitlint:
    name: Validate Commit Messages
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for commit range

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install commitlint
        run: |
          npm install --global @commitlint/cli @commitlint/config-conventional

      - name: Validate commit messages
        run: |
          # Get commit range
          BASE_SHA=${{ github.event.pull_request.base.sha }}
          HEAD_SHA=${{ github.event.pull_request.head.sha }}

          # Lint all commits in PR
          git log --format=%H $BASE_SHA..$HEAD_SHA | while read commit; do
            echo "Linting commit: $commit"
            git log --format=%B -n 1 $commit | npx commitlint
          done

      - name: Comment on PR if invalid commits found
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const body = `## ❌ Invalid Commit Messages

            This PR contains commits that don't follow the Conventional Commits specification.

            ### Valid Format

            \`\`\`
            <type>[optional scope]: <description>

            [optional body]

            [optional footer(s)]
            \`\`\`

            ### Types

            - \`feat\`: New feature
            - \`fix\`: Bug fix
            - \`docs\`: Documentation changes
            - \`style\`: Code style changes (formatting, etc)
            - \`refactor\`: Code refactoring
            - \`perf\`: Performance improvements
            - \`test\`: Adding or updating tests
            - \`build\`: Build system changes
            - \`ci\`: CI/CD changes
            - \`chore\`: Other changes (dependencies, etc)

            ### Examples

            \`\`\`
            feat(cli): add browser sidecar support
            fix(catalog): resolve caching race condition
            docs: update API documentation
            test(stacks): add YAML merge tests
            \`\`\`

            Please fix your commit messages and force push.
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

**File**: `.commitlintrc.json` (create in repo root)

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert"
      ]
    ],
    "subject-case": [2, "never", ["upper-case"]],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
    "body-leading-blank": [1, "always"],
    "footer-leading-blank": [1, "always"]
  }
}
```

---

### Task 4.2: Semantic Release Automation

**File**: `.github/workflows/cd-release.yml` (create)

```yaml
name: Release

on:
  push:
    branches:
      - main
  workflow_dispatch:
    inputs:
      release-type:
        description: 'Release type'
        required: true
        type: choice
        options:
          - auto
          - patch
          - minor
          - major

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  release:
    name: Semantic Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for changelog
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install semantic-release
        run: |
          npm install --global \
            semantic-release@^24.0.0 \
            @semantic-release/changelog@^6.0.3 \
            @semantic-release/git@^10.0.1 \
            @semantic-release/github@^11.0.0 \
            @semantic-release/exec@^6.0.3 \
            conventional-changelog-conventionalcommits@^8.0.0

      - name: Run semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx semantic-release

  publish-packages:
    name: Publish Packages
    runs-on: ubuntu-latest
    needs: release
    if: needs.release.outputs.new-release-published == 'true'
    strategy:
      matrix:
        package:
          - path: tools/airnub-devc
            name: '@airnub/devc'
          - path: packages/sdk-codespaces-adapter
            name: '@airnub/sdk-codespaces-adapter'
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        working-directory: ${{ matrix.package.path }}
        run: npm ci

      - name: Build package
        working-directory: ${{ matrix.package.path }}
        run: npm run build

      - name: Publish to npm
        working-directory: ${{ matrix.package.path }}
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**File**: `.releaserc.json` (create in repo root)

```json
{
  "branches": ["main"],
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits",
        "releaseRules": [
          { "type": "feat", "release": "minor" },
          { "type": "fix", "release": "patch" },
          { "type": "perf", "release": "patch" },
          { "type": "revert", "release": "patch" },
          { "type": "docs", "scope": "README", "release": "patch" },
          { "type": "refactor", "release": "patch" },
          { "type": "style", "release": false },
          { "type": "chore", "release": false },
          { "type": "test", "release": false },
          { "breaking": true, "release": "major" }
        ]
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        "preset": "conventionalcommits",
        "presetConfig": {
          "types": [
            { "type": "feat", "section": "✨ Features" },
            { "type": "fix", "section": "🐛 Bug Fixes" },
            { "type": "perf", "section": "⚡ Performance" },
            { "type": "revert", "section": "⏪ Reverts" },
            { "type": "docs", "section": "📚 Documentation" },
            { "type": "style", "section": "💄 Styles", "hidden": true },
            { "type": "refactor", "section": "♻️ Code Refactoring" },
            { "type": "test", "section": "✅ Tests", "hidden": true },
            { "type": "build", "section": "🔧 Build System", "hidden": true },
            { "type": "ci", "section": "👷 CI/CD", "hidden": true },
            { "type": "chore", "section": "🔨 Chores", "hidden": true }
          ]
        }
      }
    ],
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md",
        "changelogTitle": "# Changelog\n\nAll notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines."
      }
    ],
    [
      "@semantic-release/npm",
      {
        "npmPublish": false
      }
    ],
    [
      "@semantic-release/exec",
      {
        "prepareCmd": "echo 'VERSION=${nextRelease.version}' >> $GITHUB_ENV"
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json", "package-lock.json"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    [
      "@semantic-release/github",
      {
        "assets": [
          {
            "path": "docs-site/**",
            "label": "Documentation Site"
          }
        ]
      }
    ]
  ]
}
```

**Setup Requirements**:
1. Create npm account and generate token
2. Add `NPM_TOKEN` to GitHub secrets
3. Configure npm package names in `package.json` files

---

### Task 4.3: PR Title Validation

**File**: `.github/workflows/ci-pr-title.yml` (create)

```yaml
name: PR Title Validation

on:
  pull_request:
    types: [opened, edited, synchronize]

permissions:
  pull-requests: write

jobs:
  validate-title:
    name: Validate PR Title
    runs-on: ubuntu-latest
    steps:
      - name: Check PR title format
        uses: amannn/action-semantic-pull-request@v5
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            build
            ci
            chore
            revert
          requireScope: false
          subjectPattern: ^[a-z].*$
          subjectPatternError: |
            The subject "{subject}" found in the pull request title "{title}"
            didn't match the configured pattern. Please ensure that the subject
            starts with a lowercase letter.
          wip: true # Allow work-in-progress PRs
          validateSingleCommit: true # Also validate single-commit PRs
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

### Task 4.4: Optimize Workflow Performance

**File**: `.github/workflows/ci-optimized.yml` (create - example of optimizations)

```yaml
name: Optimized CI

on:
  pull_request:
    paths:
      - 'tools/**'
      - 'packages/**'

permissions:
  contents: read

jobs:
  setup:
    name: Setup Dependencies
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js with caching
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Cache node_modules
        id: cache-node-modules
        uses: actions/cache@v4
        with:
          path: |
            tools/*/node_modules
            packages/*/node_modules
          key: ${{ runner.os }}-node-modules-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-modules-

      - name: Install dependencies
        if: steps.cache-node-modules.outputs.cache-hit != 'true'
        run: |
          cd tools/airnub-devc && npm ci
          cd ../../packages/sdk-codespaces-adapter && npm ci

  test-parallel:
    name: Test (${{ matrix.package }})
    runs-on: ubuntu-latest
    needs: setup
    strategy:
      matrix:
        package:
          - tools/airnub-devc
          - packages/sdk-codespaces-adapter
      fail-fast: false # Don't cancel other jobs if one fails
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Restore cached dependencies
        uses: actions/cache/restore@v4
        with:
          path: |
            tools/*/node_modules
            packages/*/node_modules
          key: ${{ runner.os }}-node-modules-${{ hashFiles('**/package-lock.json') }}

      - name: Run tests
        working-directory: ${{ matrix.package }}
        run: npm test
```

**Key Optimizations Applied**:
1. ✅ Aggressive caching of `node_modules`
2. ✅ Parallel test execution via matrix strategy
3. ✅ `fail-fast: false` to see all test results
4. ✅ Dependency restoration from cache
5. ✅ Path-based filtering to skip unnecessary runs

---

## Validation & Testing

### Validation Checklist

#### ✅ Coverage Reporting
- [ ] `vitest.config.ts` files created for both packages
- [ ] Coverage thresholds configured (80%+ for airnub-devc, 75%+ for sdk-codespaces)
- [ ] `ci-coverage-report.yml` workflow runs on PRs
- [ ] Coverage summary appears as PR comment
- [ ] Coverage badge in README (gist created and ID configured)
- [ ] `ci-coverage-diff.yml` shows coverage trends
- [ ] Artifacts uploaded with 30-day retention

#### ✅ TypeDoc Documentation
- [ ] `typedoc.json` files created for both packages
- [ ] TypeDoc dependencies installed in package.json
- [ ] `npm run docs` generates HTML in `docs-site/api/`
- [ ] Landing page (`docs-site/index.html`) created
- [ ] Styling (`docs-site/styles.css`) looks professional
- [ ] `cd-deploy-docs.yml` deploys to GitHub Pages
- [ ] Documentation accessible at `https://airnub-labs.github.io/devcontainers-catalog/`
- [ ] README links updated to point to API docs

#### ✅ Security Scanning
- [ ] `ci-security-scan.yml` runs Trivy for npm + Docker + config
- [ ] `ci-snyk-scan.yml` configured with SNYK_TOKEN secret
- [ ] SARIF files uploaded to GitHub Security tab
- [ ] Security comments appear on PRs
- [ ] `cd-publish-sbom.yml` generates CycloneDX and SPDX SBOMs
- [ ] SBOMs attached to releases
- [ ] `.github/SECURITY.md` updated with scanning details
- [ ] Weekly and daily scheduled scans configured

#### ✅ CI/CD Enhancements
- [ ] `ci-commit-lint.yml` validates conventional commits
- [ ] `.commitlintrc.json` configuration file created
- [ ] `cd-release.yml` runs semantic-release on main
- [ ] `.releaserc.json` configured with changelog generation
- [ ] `ci-pr-title.yml` validates PR titles
- [ ] CHANGELOG.md auto-generated on release
- [ ] GitHub releases created automatically
- [ ] NPM_TOKEN secret configured for publishing
- [ ] Workflow caching optimizations applied

---

### Testing Procedures

#### 1. Test Coverage Workflow
```bash
# Local testing
cd tools/airnub-devc
npm install
npm run test:coverage

# Verify coverage files generated
ls -la coverage/
# Should see: coverage-summary.json, lcov.info, index.html

# Check thresholds
cat coverage/coverage-summary.json | jq '.total.lines.pct'
# Should be >= 80
```

#### 2. Test TypeDoc Generation
```bash
# Local testing
cd tools/airnub-devc
npm install
npm run docs

# Verify output
ls -la ../../docs-site/api/airnub-devc/
# Should see: index.html, modules/, classes/, etc.

# Open in browser
open ../../docs-site/index.html
```

#### 3. Test Trivy Locally
```bash
# Install Trivy
brew install aquasecurity/trivy/trivy

# Scan npm dependencies
trivy fs --severity HIGH,CRITICAL tools/airnub-devc

# Scan Docker image
cd images/dev-base
docker build -t dev-base:test .
trivy image --severity HIGH,CRITICAL dev-base:test
```

#### 4. Test Semantic Release (Dry Run)
```bash
# Install dependencies
npm install --global semantic-release @semantic-release/changelog @semantic-release/git

# Dry run (no actual release)
semantic-release --dry-run

# Check what version would be released
# Check CHANGELOG.md preview
```

#### 5. Validate Commit Messages
```bash
# Install commitlint
npm install --global @commitlint/cli @commitlint/config-conventional

# Test a commit message
echo "feat(cli): add new feature" | npx commitlint

# Should pass

echo "Added new feature" | npx commitlint

# Should fail with error
```

---

### Manual Verification Steps

1. **Create Test PR**:
   ```bash
   git checkout -b test/ci-improvements
   git add .
   git commit -m "ci: add coverage and security workflows"
   git push origin test/ci-improvements
   # Open PR on GitHub
   ```

2. **Verify PR Checks**:
   - ✅ Coverage report comment appears
   - ✅ Coverage diff comment appears
   - ✅ Trivy security scan comment appears
   - ✅ Commit lint passes
   - ✅ PR title validation passes
   - ✅ All status checks green

3. **Merge to Main**:
   ```bash
   # After PR approval
   git checkout main
   git pull origin main
   ```

4. **Verify Release Workflow**:
   - ✅ `cd-release.yml` runs automatically
   - ✅ CHANGELOG.md updated
   - ✅ Git tag created
   - ✅ GitHub release published
   - ✅ Coverage badge updated

5. **Verify Documentation Deployment**:
   - ✅ `cd-deploy-docs.yml` runs
   - ✅ GitHub Pages site updated
   - ✅ TypeDoc accessible at URL
   - ✅ Navigation works correctly

6. **Verify Security Scans**:
   - Navigate to: `Repository → Security → Code scanning`
   - ✅ Trivy alerts visible
   - ✅ Snyk alerts visible (if vulnerabilities found)
   - ✅ SARIF files processed

7. **Verify SBOM Generation**:
   - Navigate to: `Actions → Publish SBOM → Latest run`
   - ✅ Download artifacts
   - ✅ Verify CycloneDX JSON format
   - ✅ Verify SPDX JSON format

---

## Edge Cases & Considerations

### Coverage Edge Cases

**Issue**: Coverage drops below threshold
- **Solution**: Configure `thresholds.autoUpdate: false` to prevent auto-lowering
- **Action**: Fix tests or adjust thresholds with justification

**Issue**: Coverage report too large for PR comment
- **Solution**: Use collapsible details, link to full report in artifacts

**Issue**: Flaky tests affecting coverage
- **Solution**: Use `vitest --retry` for flaky tests, fix root cause

---

### TypeDoc Edge Cases

**Issue**: TypeDoc fails on missing type definitions
- **Solution**: Ensure all JSDoc has proper types, use `@internal` for private APIs

**Issue**: Circular dependencies break TypeDoc
- **Solution**: Refactor imports, use `type` imports for circular refs

**Issue**: Large documentation site (>100MB)
- **Solution**: Use `excludePrivate: true`, split packages into separate docs

---

### Security Scanning Edge Cases

**Issue**: Too many false positives from Trivy
- **Solution**: Use `.trivyignore` file to suppress specific CVEs:
  ```
  # .trivyignore
  CVE-2024-XXXXX # Not applicable - dev dependency only
  ```

**Issue**: Snyk rate limiting
- **Solution**: Use scheduled scans (daily) instead of per-commit

**Issue**: SBOM generation fails for private packages
- **Solution**: Ensure npm authentication in workflow, use `--no-private` flag

---

### Semantic Release Edge Cases

**Issue**: Multiple commits trigger multiple releases
- **Solution**: Use squash merge strategy for PRs

**Issue**: Breaking change not detected
- **Solution**: Enforce `BREAKING CHANGE:` footer in commit body

**Issue**: Release fails due to merge conflict
- **Solution**: Use `--no-verify` on release commits, configure branch protection

---

## Quality Standards

### Code Quality
- ✅ All TypeScript strict mode enabled
- ✅ No `any` types in vitest.config.ts
- ✅ ESLint passes on all new workflow files
- ✅ All bash scripts use `set -e` for error handling

### Documentation Quality
- ✅ TypeDoc generates without warnings
- ✅ All public APIs have JSDoc comments
- ✅ README badges are clickable and accurate
- ✅ Security policy is comprehensive

### Workflow Quality
- ✅ All workflows have descriptive names
- ✅ Concurrency groups prevent duplicate runs
- ✅ Paths filtering avoids unnecessary runs
- ✅ Workflow names follow naming convention: `ci-*`, `cd-*`
- ✅ All jobs have timeouts configured
- ✅ Secrets are never exposed in logs

### Security Quality
- ✅ SARIF files uploaded to correct categories
- ✅ Security scans don't fail CI (use `exit-code: 0`)
- ✅ Severity thresholds appropriate (HIGH for PRs, MEDIUM for scheduled)
- ✅ SBOM includes all transitive dependencies

---

## Performance Benchmarks

**Expected Performance**:

| Workflow | Duration | Triggers |
|----------|----------|----------|
| `ci-coverage-report.yml` | 2-3 minutes | PR, push to main |
| `ci-coverage-diff.yml` | 4-5 minutes | PR only |
| `cd-deploy-docs.yml` | 3-4 minutes | Push to main |
| `ci-security-scan.yml` | 5-7 minutes | PR, push, weekly |
| `ci-snyk-scan.yml` | 3-5 minutes | PR, push, daily |
| `cd-publish-sbom.yml` | 2-3 minutes | Push, release |
| `cd-release.yml` | 1-2 minutes | Push to main |

**Optimization Tips**:
- Use `cache: 'npm'` in setup-node action
- Cache `node_modules` with actions/cache
- Run independent jobs in parallel
- Use `fail-fast: false` to see all errors
- Limit artifact retention (30-90 days)

---

## Success Criteria

### Functional Requirements
- [x] Coverage reporting works in CI
- [x] Coverage badge displays in README
- [x] TypeDoc generates and deploys
- [x] Security scans run on schedule
- [x] SBOM generated for releases
- [x] Semantic releases work automatically
- [x] Commit lint enforces conventions

### Quality Requirements
- [x] All workflows pass on first run
- [x] No false positives in security scans
- [x] Documentation site loads in <2 seconds
- [x] Coverage thresholds are realistic
- [x] Release notes are readable

### Usability Requirements
- [x] Developers can understand PR comments
- [x] Security alerts are actionable
- [x] Documentation is searchable
- [x] Badges are clickable
- [x] SBOM is downloadable

---

## Final Deliverables

### Files Created (Total: ~18 files)

**Coverage Reporting**:
1. `tools/airnub-devc/vitest.config.ts`
2. `packages/sdk-codespaces-adapter/vitest.config.ts`
3. `.github/workflows/ci-coverage-report.yml`
4. `.github/workflows/ci-coverage-diff.yml`

**TypeDoc Documentation**:
5. `tools/airnub-devc/typedoc.json`
6. `packages/sdk-codespaces-adapter/typedoc.json`
7. `docs-site/index.html`
8. `docs-site/styles.css`
9. `docs-site/favicon.svg`
10. `.github/workflows/cd-deploy-docs.yml`

**Security Scanning**:
11. `.github/workflows/ci-security-scan.yml`
12. `.github/workflows/ci-snyk-scan.yml`
13. `.github/workflows/cd-publish-sbom.yml`
14. `.github/SECURITY.md` (update)

**CI/CD Enhancements**:
15. `.github/workflows/ci-commit-lint.yml`
16. `.github/workflows/cd-release.yml`
17. `.github/workflows/ci-pr-title.yml`
18. `.commitlintrc.json`
19. `.releaserc.json`

**Files Updated**:
- `README.md` (badges, documentation links)
- `tools/airnub-devc/README.md` (API docs link)
- `packages/sdk-codespaces-adapter/README.md` (API docs link)
- `tools/airnub-devc/package.json` (scripts, dependencies)
- `packages/sdk-codespaces-adapter/package.json` (scripts, dependencies)

---

## Scoring Impact Projection

### Pre-Implementation Score: 9.3/10

**Category Breakdown**:
1. Architecture & Design: 9.5 ✅
2. Code Quality: 9.5 ✅
3. Documentation: 9.5 ✅
4. Testing: 9.0 ✅
5. **Security: 8.5** ⚠️ (Needs improvement)
6. **CI/CD: 8.5** ⚠️ (Needs improvement)
7. Maintainability: 9.5 ✅
8. Vision & Innovation: 10.0 ✅
9. Community & Activity: 9.0 ✅

### Post-Implementation Score: 10.0/10 🎯

**Improvements**:
- **Security**: 8.5 → 10.0 (+1.5)
  - Multi-tool scanning (Trivy, Snyk)
  - SBOM generation
  - Scheduled security scans
  - Comprehensive security policy

- **CI/CD**: 8.5 → 10.0 (+1.5)
  - Semantic versioning
  - Automated releases
  - Coverage reporting
  - Commit message enforcement

- **Documentation**: 9.5 → 10.0 (+0.5)
  - Generated API docs
  - Hosted on GitHub Pages
  - Searchable, navigable

- **Testing**: 9.0 → 10.0 (+1.0)
  - Coverage badges
  - Coverage diffs in PRs
  - Enforced thresholds

**Overall Impact**: +0.7 points → **10.0/10** 🏆

---

## Appendix: Tool Versions

**Required Tool Versions**:
- Node.js: 20.x
- npm: 10.x
- TypeScript: 5.x
- Vitest: 1.6+ (airnub-devc), 2.1+ (sdk-codespaces)
- TypeDoc: 0.26+
- Trivy: Latest (via aquasecurity/trivy-action)
- Snyk: Latest (via snyk/actions)
- semantic-release: 24.x

**GitHub Actions Versions**:
- actions/checkout: v4
- actions/setup-node: v4
- actions/upload-artifact: v4
- actions/cache: v4
- github/codeql-action: v3
- aquasecurity/trivy-action: master
- snyk/actions: master

---

## Support & Resources

**Documentation**:
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [TypeDoc](https://typedoc.org/)
- [Trivy](https://aquasecurity.github.io/trivy/)
- [Snyk](https://docs.snyk.io/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)

**Community**:
- GitHub Discussions: https://github.com/airnub-labs/devcontainers-catalog/discussions
- Issues: https://github.com/airnub-labs/devcontainers-catalog/issues

---

## END OF PROMPT

**Total Length**: ~2,150 lines
**Estimated Implementation Time**: 12-16 hours
**Complexity**: Advanced
**Impact**: +0.7 score → 10.0/10 🎯
