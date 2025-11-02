> ⚠️ **ARCHIVED DOCUMENT**
>
> **Archived Date:** 2025-11-02
> **Reason:** Completed improvement plan
> **Status:** ✅ Implementation complete (Oct 31, 2024)
>
> This was a workflow optimization plan created to improve GitHub Actions efficiency.
> After implementation, it was archived to preserve the decision-making process and
> approach. The document is preserved here for historical reference.

---

# GitHub Workflows Improvement Plan

## Executive Summary

Current state: **13 workflows** with significant duplication, inefficient triggers, and excessive credit consumption during development.

**Critical Issues:**
- `smoke-tests.yml` runs on **EVERY PR** with no path filtering (biggest credit drain!)
- 7+ workflows triggered on every PR regardless of relevance
- Significant code duplication across workflows
- No concurrency controls (outdated PR runs continue consuming credits)

**Estimated Credit Savings: 60-80%** by implementing path filters, concurrency controls, and better trigger conditions.

---

## Current Workflow Inventory

### CI/Testing Workflows (Run on PRs)
| Workflow | Trigger | Issue | Credit Impact |
|----------|---------|-------|---------------|
| `smoke-tests.yml` | ALL PRs | ⚠️ **NO PATH FILTER** | 🔥 VERY HIGH |
| `lint-namespaces.yml` | PR: md/templates/features/images | OK | LOW |
| `validate-devcontainers.yml` | PR: features/templates | OK | MEDIUM |
| `test-templates.yml` | PR: templates/** | OK | HIGH |
| `test-features.yml` | PR: features/** | ✅ Has smart change detection | MEDIUM |
| `airnub-devc.yml` | PR: tools/schemas/examples/docs | Too broad | MEDIUM |
| `pr-check.yml` | PR: Very broad paths | Too broad | LOW |
| `cli-e2e.yml` | PR: tools/schemas/services/examples | OK but could optimize | HIGH |

### Publishing Workflows (Run on main push)
| Workflow | Trigger | Notes |
|----------|---------|-------|
| `publish-features.yml` | Push main: features/** | OK |
| `publish-templates.yml` | Push main: templates/** | OK |
| `build-presets.yml` | Push main: images/presets/** | OK |
| `build-images.yml` | Push main: images/** | OK |
| `publish-lesson-images.yml` | Push main: multiple paths | OK |

---

## Identified Problems

### 1. 🔥 CRITICAL: Smoke Tests Running on Every PR

**Current:** `smoke-tests.yml` runs on ALL pull requests
```yaml
on:
  pull_request:  # NO PATH FILTER!
  workflow_dispatch:
```

**Impact:**
- Builds 7 preset images (node-pnpm, python, full, prefect, airflow, dagster, temporal)
- Tests 5 service fragments (redis, prefect, airflow, dagster, temporal)
- Runs even when only docs/README changed
- **Estimated waste: 50-70% of PR workflow credits**

### 2. Excessive Concurrency

**Current:** No concurrency controls
```yaml
# When 5 commits pushed to PR, all 5 workflow runs continue
# Wasting credits on outdated runs
```

**Impact:**
- Old PR runs continue after new commits pushed
- Multiple concurrent runs of expensive workflows

### 3. Code Duplication

**Repeated across 8+ workflows:**

#### A. DevContainer CLI Installation
```yaml
# Different versions used:
- npm install -g @devcontainers/cli@0.80.1  # validate, publish
- npm install -g @devcontainers/cli@latest   # test-templates
- npm i -g @devcontainers/cli@latest         # smoke-tests
- npx --yes @devcontainers/cli@latest        # test-features
```

#### B. Docker Setup Pattern
```yaml
# Repeated in 6 workflows:
- uses: docker/setup-qemu-action@v3
- uses: docker/setup-buildx-action@v3
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

#### C. Node/CLI Setup for airnub-devc
```yaml
# Repeated in 4 workflows:
- uses: actions/setup-node@v4
  with:
    node-version: '24'
- working-directory: tools/airnub-devc
  run: npm install
- working-directory: tools/airnub-devc
  run: npm run build
```

### 4. Inefficient Path Triggers

#### A. airnub-devc.yml
```yaml
paths:
  - 'tools/airnub-devc/**'
  - 'schemas/**'          # Should schemas changes trigger full CLI tests?
  - 'examples/**'         # Do all example changes need testing?
  - 'docs/**'             # Documentation changes trigger tests!
```

#### B. pr-check.yml
```yaml
paths:
  - "schemas/**"
  - "tools/generate-lesson/**"
  - "examples/lesson-manifests/**"
  - "services/**"
  - "images/presets/**"
  - "docs/**"              # Documentation changes trigger checks!
  - "Makefile"
  - "AGENTS.md"            # README changes trigger checks!
  - ".github/workflows/**" # Any workflow change triggers all checks
```

---

## Proposed Solution

### Phase 1: Quick Wins (Immediate 40-60% Credit Reduction)

#### 1.1 Fix Smoke Tests Trigger
```yaml
# smoke-tests.yml
on:
  pull_request:
    paths:
      - 'images/presets/**'
      - 'services/**'
      - '.github/workflows/smoke-tests.yml'
      - 'tools/airnub-devc/**'  # If CLI generates presets
  workflow_dispatch:
```

#### 1.2 Add Concurrency Controls (ALL PR workflows)
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

#### 1.3 Tighten Path Filters
```yaml
# airnub-devc.yml - Remove docs/**
# pr-check.yml - Remove docs/**, AGENTS.md
```

### Phase 2: Structural Improvements

#### 2.1 Create Reusable Workflows

**`.github/workflows/_setup-devcontainer-cli.yml`**
```yaml
name: Setup DevContainer CLI (Reusable)
on:
  workflow_call:
    inputs:
      version:
        type: string
        default: '0.80.1'
jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - run: npm install -g @devcontainers/cli@${{ inputs.version }}
```

**`.github/workflows/_setup-docker-build.yml`**
```yaml
name: Setup Docker Build Environment (Reusable)
on:
  workflow_call:
    inputs:
      needs-ghcr-login:
        type: boolean
        default: true
jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3
      - if: inputs.needs-ghcr-login
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
```

**`.github/workflows/_setup-airnub-cli.yml`**
```yaml
name: Setup Airnub CLI (Reusable)
on:
  workflow_call:
jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
          cache-dependency-path: tools/airnub-devc/package-lock.json
      - working-directory: tools/airnub-devc
        run: npm ci
      - working-directory: tools/airnub-devc
        run: npm run build
```

#### 2.2 Reorganize Workflow Directory Structure

```
.github/workflows/
├── README.md                           # Workflow documentation
├── ci/                                 # Development checks
│   ├── lint-namespaces.yml
│   ├── validate-devcontainers.yml
│   ├── test-features.yml
│   ├── test-templates.yml
│   ├── smoke-tests.yml
│   ├── pr-check.yml
│   ├── cli-test.yml                    # Renamed from airnub-devc.yml
│   └── cli-e2e.yml
├── cd/                                 # Publishing/deployment
│   ├── publish-features.yml
│   ├── publish-templates.yml
│   ├── publish-lesson-images.yml
│   ├── build-presets.yml
│   └── build-images.yml
└── _reusable/                          # Shared workflows
    ├── setup-devcontainer-cli.yml
    ├── setup-docker-build.yml
    └── setup-airnub-cli.yml
```

**Note:** GitHub Actions requires workflows in `.github/workflows/` root. We'll use naming convention instead:
- `ci-*.yml` for development checks
- `cd-*.yml` for publishing
- `_*.yml` for reusable workflows

#### 2.3 Implement Smart Conditional Jobs

Example for `smoke-tests.yml`:
```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      presets: ${{ steps.filter.outputs.presets }}
      services: ${{ steps.filter.outputs.services }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            presets:
              - 'images/presets/**'
            services:
              - 'services/**'

  preset-smoke:
    needs: detect-changes
    if: needs.detect-changes.outputs.presets == 'true'
    # ... existing preset tests

  service-smoke:
    needs: detect-changes
    if: needs.detect-changes.outputs.services == 'true'
    # ... existing service tests
```

### Phase 3: Advanced Optimizations

#### 3.1 Merge Related Workflows

**Create `ci-devcontainers.yml`** (merge validate + test)
```yaml
name: CI - DevContainers
on:
  pull_request:
    paths:
      - 'features/**'
      - 'templates/**'
jobs:
  validate:
    # ... from validate-devcontainers.yml
  test-features:
    # ... from test-features.yml
  test-templates:
    # ... from test-templates.yml
```

#### 3.2 Use Docker Layer Caching

```yaml
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

#### 3.3 Matrix Strategy Optimization

Use `fail-fast: false` only where needed:
```yaml
strategy:
  fail-fast: true  # Change to true for faster feedback
  matrix:
    preset: [...]
```

#### 3.4 Conditional Publishing

Only publish changed items:
```yaml
# publish-features.yml
- name: Detect changed features
  id: changes
  run: |
    # Only publish features that actually changed
    git diff --name-only ${{ github.event.before }} ${{ github.sha }} \
      | grep '^features/' | cut -d'/' -f2 | sort -u
```

---

## Implementation Plan

### Step 1: Emergency Fix (5 min)
- [ ] Add path filters to `smoke-tests.yml`
- [ ] Add concurrency controls to all PR workflows
- [ ] Remove `docs/**` from `airnub-devc.yml` and `pr-check.yml`

**Expected savings: 40-50%**

### Step 2: Rename and Organize (10 min)
- [ ] Rename workflows with prefixes (`ci-*`, `cd-*`, `_*`)
- [ ] Update workflow names for clarity
- [ ] Add workflow documentation

### Step 3: Create Reusable Workflows (30 min)
- [ ] Create `_setup-devcontainer-cli.yml`
- [ ] Create `_setup-docker-build.yml`
- [ ] Create `_setup-airnub-cli.yml`
- [ ] Update consuming workflows to use reusables

**Expected savings: Additional 10-15% (less duplication = faster runs)**

### Step 4: Smart Path Detection (20 min)
- [ ] Add `dorny/paths-filter` to workflows
- [ ] Implement conditional job execution
- [ ] Test with various PR scenarios

**Expected savings: Additional 10-20%**

### Step 5: Advanced Optimizations (optional, 1-2 hrs)
- [ ] Implement Docker layer caching
- [ ] Merge related workflows
- [ ] Add selective publishing
- [ ] Optimize matrix strategies

**Expected savings: Additional 5-10%**

---

## Migration Strategy

### Approach: Gradual Migration (Low Risk)

1. **Week 1:** Deploy emergency fixes (Step 1)
   - Monitor credit usage
   - Verify PR checks still work

2. **Week 2:** Rename workflows (Step 2)
   - Update documentation
   - Train team on new structure

3. **Week 3:** Create reusable workflows (Step 3)
   - Migrate one workflow at a time
   - Test each migration

4. **Week 4:** Smart detection (Step 4)
   - Deploy to non-critical workflows first
   - Roll out to all workflows

5. **Optional:** Advanced optimizations as needed

---

## Testing Plan

### For Each Change:

1. **Dry Run Testing:**
   ```bash
   # Use act to test workflows locally
   act pull_request --workflows .github/workflows/smoke-tests.yml
   ```

2. **Branch Protection:**
   - Keep one old workflow version temporarily
   - Test new workflow alongside old one
   - Remove old version after validation

3. **Monitoring:**
   - Track Actions usage before/after
   - Monitor PR feedback times
   - Watch for false negatives

### Test Scenarios:

- [ ] PR changing only documentation
- [ ] PR changing only features
- [ ] PR changing only templates
- [ ] PR changing presets
- [ ] PR changing CLI code
- [ ] PR with multiple commits
- [ ] Push to main (publish workflows)

---

## Expected Results

### Before Optimization:
```
Average PR: 8-12 workflows triggered
Total run time: 45-60 minutes
Credits per PR: ~1000-1500
Monthly credits: ~30,000-50,000 (assuming 30 PRs/month)
```

### After Optimization:
```
Average PR: 2-5 workflows triggered (only relevant ones)
Total run time: 15-25 minutes (concurrent + cached)
Credits per PR: ~300-500
Monthly credits: ~9,000-15,000
Savings: ~60-70%
```

### Additional Benefits:
- ✅ Faster PR feedback (15-25 min vs 45-60 min)
- ✅ Less noise in PR checks
- ✅ Easier to maintain workflows
- ✅ Better developer experience
- ✅ More predictable credit consumption

---

## Rollback Plan

If issues arise:

1. **Immediate Rollback:**
   ```bash
   git revert <commit-sha>
   git push origin main
   ```

2. **Partial Rollback:**
   - Keep path filters and concurrency controls (low risk)
   - Revert reusable workflows if causing issues

3. **Monitoring Triggers:**
   - PRs not getting proper checks
   - False positives/negatives in path detection
   - Increased failure rates

---

## Questions for Review

1. **Branch Protection:** Do we have required status checks that will break if we rename workflows?
2. **Dependencies:** Are any external tools/scripts depending on workflow names?
3. **Notifications:** Are any Slack/Discord integrations tied to specific workflows?
4. **Main Branch:** Should we protect main from running expensive builds on every push?
5. **Testing Cadence:** Should smoke tests run nightly instead of on every PR?

---

## Recommended First Action

Start with **Step 1 (Emergency Fix)** - this gives immediate 40-50% savings with minimal risk:

```yaml
# Apply to smoke-tests.yml, airnub-devc.yml, pr-check.yml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

# Add to smoke-tests.yml
on:
  pull_request:
    paths:
      - 'images/presets/**'
      - 'services/**'
      - '.github/workflows/smoke-tests.yml'
```

This change alone will dramatically reduce credit consumption during active development.
