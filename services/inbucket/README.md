# Inbucket Fragment

This fragment runs [Inbucket](https://www.inbucket.org/), a disposable email server with SMTP, POP3/IMAP, and a web UI. It enables lessons to capture outbound mail without relying on external providers.

## Quickstart

```bash
docker compose -f docker-compose.inbucket.yml up
```

## Ports

- `2500` → SMTP listener for accepting messages from the workspace (`smtp://localhost:2500`)
- `9000` → Web UI for browsing captured messages (`http://localhost:9000`)

## Usage Tips

- Messages are stored in memory by default. This keeps the fragment stateless but means content disappears when the container restarts.
- Point application SMTP settings at `inbucket:2500` inside the Compose network to avoid binding issues.

## Aggregate Compose

Referencing `inbucket` in `spec.services` adds this fragment to `aggregate.compose.yml`, giving students instant visibility into emails triggered by their code.
