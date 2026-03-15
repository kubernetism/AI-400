# Design: Two FastAPI Todo Services for Kubernetes Learning

## Overview

Two independent FastAPI microservices built with `uv` package management, designed as learning projects for Kubernetes networking concepts (service discovery, inter-pod communication, DNS, ingress routing).

## Project Structure

```
15_DevOps_with_general_coding_agents/
├── todo_manager/
│   ├── pyproject.toml
│   ├── main.py
│   └── Dockerfile
└── todo_progress_monitoring/
    ├── pyproject.toml
    ├── main.py
    └── Dockerfile
```

Each project is initialized with `uv init` and dependencies added via `uv add fastapi uvicorn`.

## Service 1: Todo Manager

**Port:** 8001

**Endpoints:**

| Method | Path        | Description                                      |
|--------|-------------|--------------------------------------------------|
| GET    | `/`         | Health check — `{"service": "todo_manager", "status": "ok"}` |
| GET    | `/todos`    | Returns list of all todos                        |
| POST   | `/todos`    | Add a new todo (title, description, status)      |

**Data model:** In-memory list of dicts. Each todo has:
- `id` (int, auto-incremented)
- `title` (str)
- `description` (str)
- `status` (str: "pending", "in_progress", "completed")

**Seed data:** Pre-populated with 2-3 sample todos.

## Service 2: Todo Progress Monitoring

**Port:** 8002

**Endpoints:**

| Method | Path                  | Description                                                    |
|--------|-----------------------|----------------------------------------------------------------|
| GET    | `/`                   | Health check — `{"service": "todo_progress_monitoring", "status": "ok"}` |
| GET    | `/progress`           | Progress summary (total, counts per status, completion %)      |
| GET    | `/progress/{todo_id}` | Progress detail for a specific todo                            |

**Data model:** In-memory list of dicts with matching seed data that mirrors the todo manager's seed data.

## Dockerfiles

Both services use the same pattern:

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml .

RUN pip install uv && uv sync

COPY main.py .

EXPOSE <port>

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "<port>"]
```

- todo_manager: port 8001
- todo_progress_monitoring: port 8002

## Out of Scope

- No database — in-memory only
- No service-to-service communication (comes later in K8s)
- No tests, CI/CD, or K8s manifests at this stage

## Future Use

These services will be deployed to Kubernetes to learn:
- Service discovery and DNS
- Inter-service communication
- Ingress routing
- Load balancing
- Other networking concepts
