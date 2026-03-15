# FastAPI Todo Services Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build two independent FastAPI microservices (todo_manager and todo_progress_monitoring) with Dockerfiles, using `uv` for package management.

**Architecture:** Two standalone FastAPI apps, each with in-memory data, living in separate subdirectories. Each has its own `uv`-managed project and Dockerfile.

**Tech Stack:** Python 3.13, FastAPI, uvicorn, uv (package manager), Docker

**Spec:** `docs/superpowers/specs/2026-03-15-fastapi-todo-services-design.md`

---

## Chunk 1: Todo Manager Service

### Task 1: Initialize todo_manager project with uv

**Files:**
- Create: `todo_manager/pyproject.toml` (via `uv init`)
- Create: `todo_manager/uv.lock` (via `uv add`)

- [ ] **Step 1: Create the project directory and initialize with uv**

```bash
cd /home/safdaralishah/Documents/github/AI-400/15_DevOps_with_general_coding_agents
uv init todo_manager
```

- [ ] **Step 2: Add dependencies**

```bash
cd todo_manager
uv add fastapi uvicorn
```

Expected: `pyproject.toml` updated with fastapi and uvicorn dependencies, `uv.lock` created.

- [ ] **Step 3: Remove boilerplate files**

`uv init` creates `hello.py` and `README.md` — remove them:

```bash
rm -f hello.py README.md
```

- [ ] **Step 4: Commit**

```bash
git add todo_manager/
git commit -m "feat: initialize todo_manager project with uv"
```

---

### Task 2: Create todo_manager main.py

**Files:**
- Create: `todo_manager/main.py`

- [ ] **Step 1: Write main.py**

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Todo Manager")

# In-memory storage
todos = [
    {"id": 1, "title": "Learn FastAPI", "description": "Build REST APIs with FastAPI", "status": "completed"},
    {"id": 2, "title": "Learn Docker", "description": "Containerize Python applications", "status": "in_progress"},
    {"id": 3, "title": "Learn Kubernetes", "description": "Deploy containers to K8s", "status": "pending"},
]

counter = len(todos)


class TodoCreate(BaseModel):
    title: str
    description: str
    status: str = "pending"


@app.get("/")
def health_check():
    return {"service": "todo_manager", "status": "ok"}


@app.get("/todos")
def get_todos():
    return todos


@app.post("/todos", status_code=201)
def create_todo(todo: TodoCreate):
    global counter
    counter += 1
    new_todo = {"id": counter, "title": todo.title, "description": todo.description, "status": todo.status}
    todos.append(new_todo)
    return new_todo
```

- [ ] **Step 2: Run the app to verify it works**

```bash
cd /home/safdaralishah/Documents/github/AI-400/15_DevOps_with_general_coding_agents/todo_manager
uv run uvicorn main:app --host 0.0.0.0 --port 8001
```

In another terminal, test:

```bash
curl http://localhost:8001/
# Expected: {"service":"todo_manager","status":"ok"}

curl http://localhost:8001/todos
# Expected: list of 3 seed todos

curl -X POST http://localhost:8001/todos -H "Content-Type: application/json" -d '{"title":"Test","description":"A test todo"}'
# Expected: {"id":4,"title":"Test","description":"A test todo","status":"pending"}
```

Stop the server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add todo_manager/main.py
git commit -m "feat: add todo_manager FastAPI app with endpoints"
```

---

### Task 3: Create todo_manager Dockerfile

**Files:**
- Create: `todo_manager/Dockerfile`

- [ ] **Step 1: Write Dockerfile**

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN pip install uv && uv sync

COPY main.py .

EXPOSE 8001

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

- [ ] **Step 2: Build and test the Docker image**

```bash
cd /home/safdaralishah/Documents/github/AI-400/15_DevOps_with_general_coding_agents/todo_manager
docker build -t todo_manager .
docker run -d -p 8001:8001 --name todo_manager_test todo_manager
```

Test:

```bash
curl http://localhost:8001/
# Expected: {"service":"todo_manager","status":"ok"}

curl http://localhost:8001/todos
# Expected: list of 3 seed todos
```

Cleanup:

```bash
docker stop todo_manager_test && docker rm todo_manager_test
```

- [ ] **Step 3: Commit**

```bash
git add todo_manager/Dockerfile
git commit -m "feat: add Dockerfile for todo_manager"
```

---

## Chunk 2: Todo Progress Monitoring Service

### Task 4: Initialize todo_progress_monitoring project with uv

**Files:**
- Create: `todo_progress_monitoring/pyproject.toml` (via `uv init`)
- Create: `todo_progress_monitoring/uv.lock` (via `uv add`)

- [ ] **Step 1: Create the project directory and initialize with uv**

```bash
cd /home/safdaralishah/Documents/github/AI-400/15_DevOps_with_general_coding_agents
uv init todo_progress_monitoring
```

- [ ] **Step 2: Add dependencies**

```bash
cd todo_progress_monitoring
uv add fastapi uvicorn
```

Expected: `pyproject.toml` updated with fastapi and uvicorn dependencies, `uv.lock` created.

- [ ] **Step 3: Remove boilerplate files**

```bash
rm -f hello.py README.md
```

- [ ] **Step 4: Commit**

```bash
git add todo_progress_monitoring/
git commit -m "feat: initialize todo_progress_monitoring project with uv"
```

---

### Task 5: Create todo_progress_monitoring main.py

**Files:**
- Create: `todo_progress_monitoring/main.py`

- [ ] **Step 1: Write main.py**

```python
from fastapi import FastAPI, HTTPException

app = FastAPI(title="Todo Progress Monitoring")

# In-memory storage — static snapshot matching todo_manager seed data
todos = [
    {"id": 1, "title": "Learn FastAPI", "description": "Build REST APIs with FastAPI", "status": "completed"},
    {"id": 2, "title": "Learn Docker", "description": "Containerize Python applications", "status": "in_progress"},
    {"id": 3, "title": "Learn Kubernetes", "description": "Deploy containers to K8s", "status": "pending"},
]


@app.get("/")
def health_check():
    return {"service": "todo_progress_monitoring", "status": "ok"}


@app.get("/progress")
def get_progress():
    total = len(todos)
    completed = sum(1 for t in todos if t["status"] == "completed")
    in_progress = sum(1 for t in todos if t["status"] == "in_progress")
    pending = sum(1 for t in todos if t["status"] == "pending")
    completion_percentage = round((completed / total) * 100, 2) if total > 0 else 0.0
    return {
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "pending": pending,
        "completion_percentage": completion_percentage,
    }


@app.get("/progress/{todo_id}")
def get_todo_progress(todo_id: int):
    for todo in todos:
        if todo["id"] == todo_id:
            return {"id": todo["id"], "title": todo["title"], "status": todo["status"]}
    raise HTTPException(status_code=404, detail="Todo not found")
```

- [ ] **Step 2: Run the app to verify it works**

```bash
cd /home/safdaralishah/Documents/github/AI-400/15_DevOps_with_general_coding_agents/todo_progress_monitoring
uv run uvicorn main:app --host 0.0.0.0 --port 8002
```

In another terminal, test:

```bash
curl http://localhost:8002/
# Expected: {"service":"todo_progress_monitoring","status":"ok"}

curl http://localhost:8002/progress
# Expected: {"total":3,"completed":1,"in_progress":1,"pending":1,"completion_percentage":33.33}

curl http://localhost:8002/progress/1
# Expected: {"id":1,"title":"Learn FastAPI","status":"completed"}

curl http://localhost:8002/progress/999
# Expected: 404 {"detail":"Todo not found"}
```

Stop the server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add todo_progress_monitoring/main.py
git commit -m "feat: add todo_progress_monitoring FastAPI app with endpoints"
```

---

### Task 6: Create todo_progress_monitoring Dockerfile

**Files:**
- Create: `todo_progress_monitoring/Dockerfile`

- [ ] **Step 1: Write Dockerfile**

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN pip install uv && uv sync

COPY main.py .

EXPOSE 8002

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
```

- [ ] **Step 2: Build and test the Docker image**

```bash
cd /home/safdaralishah/Documents/github/AI-400/15_DevOps_with_general_coding_agents/todo_progress_monitoring
docker build -t todo_progress_monitoring .
docker run -d -p 8002:8002 --name todo_progress_monitoring_test todo_progress_monitoring
```

Test:

```bash
curl http://localhost:8002/
# Expected: {"service":"todo_progress_monitoring","status":"ok"}

curl http://localhost:8002/progress
# Expected: {"total":3,"completed":1,"in_progress":1,"pending":1,"completion_percentage":33.33}
```

Cleanup:

```bash
docker stop todo_progress_monitoring_test && docker rm todo_progress_monitoring_test
```

- [ ] **Step 3: Commit**

```bash
git add todo_progress_monitoring/Dockerfile
git commit -m "feat: add Dockerfile for todo_progress_monitoring"
```
