---
name: docker-fastapi
description: Use when containerizing Python or FastAPI applications with Docker, from simple hello-world setups to production deployments. Triggers on Dockerfile creation, Docker Compose configuration, multi-stage builds, non-root users, health checks, secrets management, layer caching, .dockerignore, uvicorn/gunicorn production servers, and container security hardening.
---

# Docker for Python/FastAPI — Hello World to Production

## Overview

Docker packages applications into containers that run consistently across all environments. This skill covers every layer: minimal dev images → optimized production Dockerfiles → multi-service Compose stacks.

**Core principle:** Always read the official Dockerfile reference before assuming syntax. Every instruction has edge cases that matter in production.

---

## Stage 1: Hello World Container

Minimal working Dockerfile for any Python app:

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

Build and run:
```bash
docker build -t myapp .
docker run -p 8000:8000 myapp
```

---

## Stage 2: FastAPI Dockerfile (Dev-Ready)

Official Docker pattern for FastAPI from Docker's Python guide:

```dockerfile
# syntax=docker/dockerfile:1
ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim

# Prevents Python from writing .pyc files (keeps image clean)
ENV PYTHONDONTWRITEBYTECODE=1

# Prevents stdout/stderr buffering (ensures logs appear immediately)
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Create a non-privileged user — NEVER run as root in production
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Copy requirements FIRST — enables Docker layer caching
# If requirements.txt hasn't changed, pip install is skipped on rebuild
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Switch to non-root before copying app code
USER appuser

COPY . .

EXPOSE 8000

# Exec form (NOT shell form) — required for proper signal handling (SIGTERM)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Why exec form for CMD/ENTRYPOINT:**
- Shell form (`CMD uvicorn ...`) runs via `/bin/sh -c`, making the app a subprocess of the shell
- This means the app never receives `SIGTERM` — `docker stop` will force-kill after timeout
- Exec form (`CMD ["uvicorn", ...]`) makes the app PID 1 and receives signals correctly

---

## Stage 3: Production — Multi-Stage Build

Multi-stage builds produce small, secure runtime images by separating build tools from the final image:

```dockerfile
# syntax=docker/dockerfile:1

# === Stage 1: Builder — installs all deps into a venv ===
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/app/venv/bin:$PATH"

WORKDIR /app

# Create isolated virtual environment
RUN python -m venv /app/venv

COPY requirements.txt .
# --no-cache-dir reduces layer size; venv isolates from system Python
RUN pip install --no-cache-dir -r requirements.txt

# === Stage 2: Runtime — minimal image, no build tools ===
FROM python:3.12-slim AS production

ENV PYTHONUNBUFFERED=1
ENV PATH="/app/venv/bin:$PATH"

WORKDIR /app

# Non-privileged user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Copy only the venv from builder — no pip, no compilers in final image
COPY --from=builder /app/venv /app/venv
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

# Production: multiple uvicorn workers via gunicorn
CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000"]
```

Add `gunicorn` to `requirements.txt`:
```
fastapi
uvicorn[standard]
gunicorn
```

---

## Layer Caching — The Critical Rule

Docker rebuilds every layer after the first changed layer. Order matters:

```dockerfile
# WRONG — code changes force pip reinstall every time
COPY . .
RUN pip install -r requirements.txt

# CORRECT — requirements cached until requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .     # code changes only rebuild this layer
```

**Rule:** Copy dependency manifests first, install, then copy source code.

---

## .dockerignore

Always create `.dockerignore` at project root — reduces build context size and prevents secrets from entering the image:

```text
# Python artifacts
**/__pycache__
**/*.pyc
**/*.pyo
**/.venv
**/.mypy_cache
**/.pytest_cache

# Secrets and environment files
**/.env
**/secrets.dev.yaml
**/values.dev.yaml

# Version control
**/.git
**/.gitignore

# Docker files (avoid recursive inclusion)
**/Dockerfile*
**/.dockerignore
**/docker-compose*
**/compose.y*ml

# Dev/test artifacts
**/tests
**/.DS_Store
**/README.md
**/LICENSE
```

---

## Docker Compose — Dev Stack

`compose.yaml` for FastAPI + PostgreSQL development:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: "postgresql://appuser:apppass@db:5432/appdb"
    volumes:
      - ./app:/app/app   # live reload: sync code into container
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: apppass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 5s
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

```bash
docker compose up --build          # start stack
docker compose up -d               # detached
docker compose down                # stop and remove containers
docker compose down -v             # also remove volumes
docker compose logs -f api         # follow logs for api service
```

---

## Docker Compose — Production Stack

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production        # targets the named stage in multi-stage build
    restart: unless-stopped
    environment:
      DATABASE_URL: "${DATABASE_URL}"
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    security_opt:
      - no-new-privileges:true   # prevents privilege escalation
    read_only: true              # filesystem is read-only
    tmpfs:
      - /tmp                     # only /tmp is writable
    deploy:
      resources:
        limits:
          memory: "512M"
          cpus: "1.0"
        reservations:
          memory: "128M"
          cpus: "0.25"
    networks:
      - app-network
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    user: postgres
    environment:
      POSTGRES_DB: "${POSTGRES_DB}"
      POSTGRES_USER: "${POSTGRES_USER}"
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    secrets:
      - db_password
    healthcheck:
      test: ["CMD", "pg_isready"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

---

## Secrets — Do NOT Use ENV for Credentials

**Never bake secrets into ENV or ARG** — they persist in image metadata and every layer:

```dockerfile
# WRONG — password visible in `docker inspect` and image history
ENV DB_PASSWORD=supersecret
ARG API_KEY=mysecretkey
```

**Correct approaches:**

**1. Build-time secrets (not persisted in image):**
```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=pip_token \
    pip install --index-url https://$(cat /run/secrets/pip_token)@private.pypi.example.com/simple/ mypackage
```
```bash
docker build --secret id=pip_token,src=./secrets/token.txt .
```

**2. Runtime secrets via Compose:**
```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt
```
Access in container at: `/run/secrets/db_password`

**3. Runtime env vars from `.env` file (non-production):**
```bash
# .env — never commit this file
DATABASE_URL=postgresql://user:pass@localhost/db
```
```yaml
env_file:
  - .env
```

---

## Health Checks

FastAPI endpoint for health check:
```python
@app.get("/health")
async def health():
    return {"status": "ok"}
```

Dockerfile health check:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

Compose health check (overrides Dockerfile):
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s   # grace period before first check
```

Install curl in slim images if needed:
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

---

## Essential Commands Quick Reference

| Task | Command |
|------|---------|
| Build image | `docker build -t name:tag .` |
| Build specific stage | `docker build --target production -t name:tag .` |
| Run container | `docker run -p 8000:8000 name:tag` |
| Run with env file | `docker run --env-file .env -p 8000:8000 name:tag` |
| Run interactively | `docker run -it name:tag /bin/bash` |
| View image layers | `docker history name:tag` |
| Inspect image size | `docker images name:tag` |
| View running containers | `docker ps` |
| View container logs | `docker logs -f container_id` |
| Execute command in running container | `docker exec -it container_id /bin/bash` |
| Remove all stopped containers | `docker container prune` |
| Remove unused images | `docker image prune` |
| Compose build + start | `docker compose up --build` |
| Compose rebuild single service | `docker compose up --build api` |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running as root (`USER` never set) | Add `adduser` + `USER appuser` before `CMD` |
| Copying `.env` files into image | Add `**/.env` to `.dockerignore` |
| Using shell form for CMD | Use exec form: `CMD ["uvicorn", ...]` |
| Putting `COPY . .` before `pip install` | Copy `requirements.txt` first, install, then `COPY . .` |
| Storing secrets in `ENV`/`ARG` | Use `--mount=type=secret` or runtime env vars |
| Not using `--no-cache-dir` with pip | Always `pip install --no-cache-dir` — reduces layer size |
| Forgetting `start_period` in healthcheck | FastAPI needs time to start; set `start_period: 30s`+ |
| Single large stage in production | Use multi-stage builds to exclude dev tools from final image |
| Dev volume mounts in production | Remove `volumes:` sync mounts for production; only named volumes |
| Missing `restart: unless-stopped` | Set restart policy so containers recover from crashes |

---

## Security Checklist

- [ ] Non-root user created and set with `USER`
- [ ] `.dockerignore` excludes `.env`, `.git`, `__pycache__`
- [ ] No secrets in `ENV` or `ARG` instructions
- [ ] Multi-stage build: build tools not in final image
- [ ] `read_only: true` + `tmpfs: [/tmp]` in production Compose
- [ ] `security_opt: [no-new-privileges:true]` in production Compose
- [ ] Health check defined on every service
- [ ] `restart: unless-stopped` on all services
- [ ] `PYTHONDONTWRITEBYTECODE=1` and `PYTHONUNBUFFERED=1` set
- [ ] `--no-cache-dir` used with all pip install commands
