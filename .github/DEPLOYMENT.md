# Desi Connect USA — Deployment Guide

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  Next.js Web │────▶│  Middleware   │────▶│  Redis   │
│  (Port 3000) │     │  (Port 3001) │     │  (6379)  │
└─────────────┘     └──────────────┘     └──────────┘
                           │
                    ┌──────┴──────┐
                    │   Twilio    │
                    │  WhatsApp   │
                    └─────────────┘
```

## Quick Start (Docker)

```bash
# Production build
docker compose up -d --build

# Development (with hot-reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## CI/CD Pipeline

### Continuous Integration (`.github/workflows/ci.yml`)

Triggered on every push/PR to `main` and `develop`:

1. **Lint & Typecheck** — ESLint + TypeScript compiler
2. **Tests** — Unit + integration across Node 18/20/22
3. **Build** — All workspace packages in dependency order
4. **Docker Build** — Validates Dockerfiles (main branch only)

### Deployment (`.github/workflows/deploy.yml`)

Triggered after CI passes on `main`, or via manual dispatch:

1. **Pre-deploy Check** — Gates on CI success
2. **Build & Push Images** — Publishes to GitHub Container Registry
3. **Deploy Services** — Configurable for your hosting provider
4. **Health Check** — Validates deployed services

## Environment Setup

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `GITHUB_TOKEN` | Auto-provided for GHCR access |

### Required GitHub Variables (per environment)

| Variable | Description |
|----------|-------------|
| `MIDDLEWARE_URL` | Deployed middleware URL |
| `WEB_URL` | Deployed web app URL |

### Hosting Provider Setup

Configure the deploy steps in `deploy.yml` for your chosen provider:

**Vercel (recommended for Next.js web):**
- Add `VERCEL_TOKEN` secret
- Uncomment Vercel deploy step

**Railway / Render / Fly.io (for middleware):**
- Add provider-specific token as secret
- Configure deploy command in workflow

## Docker Images

Images are published to GitHub Container Registry:

```
ghcr.io/<owner>/desi-connect-middleware:latest
ghcr.io/<owner>/desi-connect-web:latest
```

Tags: `latest`, `main`, `<commit-sha>`

## Health Endpoints

- **Middleware:** `GET /health`
- **Web:** `GET /api/health`
