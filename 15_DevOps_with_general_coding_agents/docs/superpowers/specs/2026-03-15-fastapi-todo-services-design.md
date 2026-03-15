# Design: Two FastAPI Todo Services for Kubernetes Learning

## Overview

Two independent FastAPI microservices built with `uv` package management, designed as learning projects for Kubernetes networking concepts (service discovery, inter-pod communication, DNS, ingress routing).

## Project Structure

```
15_DevOps_with_general_coding_agents/
├── todo_manager/
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── main.py
│   └── Dockerfile
└── todo_progress_monitoring/
    ├── pyproject.toml
    ├── uv.lock
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
- `title` (str, required)
- `description` (str, required)
- `status` (str: "pending", "in_progress", "completed" — defaults to "pending" if omitted)

**Seed data:**

```python
[
    {"id": 1, "title": "Learn FastAPI", "description": "Build REST APIs with FastAPI", "status": "completed"},
    {"id": 2, "title": "Learn Docker", "description": "Containerize Python applications", "status": "in_progress"},
    {"id": 3, "title": "Learn Kubernetes", "description": "Deploy containers to K8s", "status": "pending"},
]
```

## Service 2: Todo Progress Monitoring

**Port:** 8002

**Endpoints:**

| Method | Path                  | Description                                                    |
|--------|-----------------------|----------------------------------------------------------------|
| GET    | `/`                   | Health check — `{"service": "todo_progress_monitoring", "status": "ok"}` |
| GET    | `/progress`           | Progress summary (total, counts per status, completion %)      |
| GET    | `/progress/{todo_id}` | Progress detail for a specific todo                            |

**Data model:** In-memory list of dicts using the same seed data as the todo manager (same IDs, titles, statuses). This is a static snapshot — it will not reflect new todos added via the todo manager's POST endpoint. Inter-service sync will be added later in K8s.

**`GET /progress` response shape:**
```json
{
    "total": 3,
    "completed": 1,
    "in_progress": 1,
    "pending": 1,
    "completion_percentage": 33.33
}
```

**`GET /progress/{todo_id}` response shape:**
```json
{
    "id": 1,
    "title": "Learn FastAPI",
    "status": "completed"
}
```

Returns 404 `{"detail": "Todo not found"}` if `todo_id` does not exist.

## Dockerfiles

Both services use the same pattern:

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./

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
- No PUT/PATCH/DELETE endpoints — may be added later if needed

## Future Use

These services will be deployed to Kubernetes to learn:
- Service discovery and DNS
- Inter-service communication (progress monitoring will call todo manager)
- Ingress routing
- Load balancing
- Other networking concepts
