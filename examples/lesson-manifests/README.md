# Lesson Manifest Examples

This directory contains example lesson manifests that demonstrate common use cases for the devcontainers-catalog. Each manifest can be used as a starting point for your own lessons.

## Available Examples

### 1. **minimal-nodejs.yaml** - Minimal Node.js Setup
- **Use case:** Simple JavaScript/TypeScript projects, frontend basics
- **Preset:** `node-pnpm`
- **Services:** None
- **Startup time:** ~30-45 seconds
- **Best for:** Week 1-3 of web development courses, simple exercises

### 2. **web-fullstack-nextjs.yaml** - Full-Stack Next.js
- **Use case:** Modern full-stack applications with database and caching
- **Preset:** `node-pnpm`
- **Services:** Supabase (PostgreSQL + Auth + Storage), Redis
- **Startup time:** ~2-3 minutes
- **Best for:** Advanced web development, production-like environments

### 3. **data-science-python.yaml** - Data Science with Python
- **Use case:** Data analysis, machine learning, scientific computing
- **Preset:** `python`
- **Services:** None
- **Startup time:** ~30-45 seconds
- **Best for:** Data science courses, Jupyter notebooks, pandas/numpy work

### 4. **workflow-orchestration-prefect.yaml** - Data Engineering with Prefect
- **Use case:** ETL pipelines, workflow orchestration, data engineering
- **Preset:** `python-prefect`
- **Services:** Prefect, Redis
- **Startup time:** ~90 seconds
- **Best for:** Data engineering courses, workflow automation

### 5. **backend-api-nodejs.yaml** - Backend API Development
- **Use case:** REST APIs, microservices, backend development
- **Preset:** `node-pnpm`
- **Services:** Supabase (PostgreSQL), Redis
- **Startup time:** ~2 minutes
- **Best for:** Backend development courses, API design, database integration

### 6. **intro-ai-week02.yaml** - Multi-Orchestrator Example
- **Use case:** Advanced orchestration comparison (Demo/Research)
- **Preset:** `python-prefect`
- **Services:** Prefect, Airflow, Dagster, Temporal
- **Startup time:** ~3-4 minutes
- **Note:** This example runs multiple orchestrators simultaneously for comparison purposes. In production, you'd typically choose only one.

## Quick Start

### Using the Interactive Builder (Recommended)

The easiest way to create a new manifest is to use the interactive builder:

```bash
devc create
```

This will guide you through selecting a preset, services, and configuration options.

### Starting from a Template

You can also copy and customize an existing template:

```bash
# Copy a template
cp examples/lesson-manifests/minimal-nodejs.yaml my-lesson.yaml

# Edit the metadata
vim my-lesson.yaml

# Validate the manifest
devc validate my-lesson.yaml

# Generate the development environment
devc generate my-lesson.yaml
```

### Generating from a Manifest

Once you have a manifest, generate the development environment:

```bash
# Generate preset build context and scaffold
devc generate my-lesson.yaml

# Generate just the scaffold (for students)
devc scaffold my-lesson.yaml --out ./student-workspace

# Build the image (for prebuilt environments)
devc build --ctx images/presets/generated/<slug> --tag <your-tag>
```

## Choosing the Right Template

### For Beginners (Week 1-3)
Start with **minimal-nodejs.yaml** or **data-science-python.yaml**
- Fast startup times
- No services to configure
- Focus on learning basics

### For Intermediate (Week 4-8)
Use **backend-api-nodejs.yaml** or similar with one service
- Introduces database or caching
- Real-world architecture patterns
- Manageable complexity

### For Advanced (Week 9+)
Try **web-fullstack-nextjs.yaml** or **workflow-orchestration-prefect.yaml**
- Multiple services
- Production-like setup
- Complex architectures

## Customization Tips

### Adding VS Code Extensions
```yaml
spec:
  vscode_extensions:
    - dbaeumer.vscode-eslint
    - esbenp.prettier-vscode
    - your-extension-id
```

### Adding Environment Variables
```yaml
spec:
  env:
    NODE_ENV: "development"
    PORT: "3000"
  secrets_placeholders:
    - DATABASE_URL
    - API_KEY
```

### Adding Services
```yaml
spec:
  services:
    - name: "supabase"
    - name: "redis"
  emit_aggregate_compose: true
```

See available services:
```bash
devc services ls
```

## Cost and Resource Estimates

| Template | Startup Time | Est. Monthly Cost | CPU | Memory |
|----------|--------------|-------------------|-----|--------|
| minimal-nodejs | 30-45s | ~$5/student | 2 cores | 4GB |
| data-science-python | 30-45s | ~$4/student | 2 cores | 4GB |
| backend-api-nodejs | ~2min | ~$9/student | 2 cores | 8GB |
| web-fullstack-nextjs | ~2-3min | ~$9/student | 2 cores | 8GB |
| workflow-orchestration-prefect | ~90s | ~$10/student | 2 cores | 8GB |

*Estimates based on GitHub Codespaces pricing with typical usage patterns*

## Next Steps

- Browse the [full documentation](../../docs/) for more details
- Check out [classroom-quick-start.md](../../docs/getting-started/classroom-quick-start.md) for instructor guides
- Learn about [manifest authoring](../../docs/getting-started/manifest-authoring.md)
- **Explore the [Classroom Lessons Repository](https://github.com/airnub-labs/devcontainers-classroom-lessons)** for complete multi-week courses, full curriculum examples, and pedagogical guides

## Contributing

Have a useful template to share? Submit a PR! Please include:
- Clear use case description
- Commented YAML with explanations
- Estimated startup time and costs
- Best practices for that stack
