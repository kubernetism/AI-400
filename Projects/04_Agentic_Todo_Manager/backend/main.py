import os
import uuid
from contextlib import asynccontextmanager

import httpx
import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env")

NOTIFICATION_URL = os.getenv("NOTIFICATION_URL", "http://localhost:8002")


# ── Database helpers ──


def get_conn():
    return psycopg.connect(DATABASE_URL)


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                completed BOOLEAN DEFAULT FALSE
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS subtasks (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                llm_response TEXT,
                agent_id TEXT,
                position INTEGER DEFAULT 0
            )
        """)
        # Migration: add agent_id if it doesn't exist yet
        conn.execute("""
            ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS agent_id TEXT
        """)
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Task Manager API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── DB query helpers ──


def _task_row_to_dict(task_row, subtask_rows) -> dict:
    return {
        "id": task_row[0],
        "title": task_row[1],
        "description": task_row[2] or "",
        "completed": task_row[3],
        "subtasks": [
            {
                "id": s[0],
                "title": s[1],
                "completed": s[2],
                "llm_response": s[3],
                "agent_id": s[4],
            }
            for s in subtask_rows
        ],
    }


def _get_task_with_subtasks(conn, task_id: str) -> dict | None:
    row = conn.execute(
        "SELECT id, title, description, completed FROM tasks WHERE id = %s",
        (task_id,),
    ).fetchone()
    if not row:
        return None
    subtasks = conn.execute(
        "SELECT id, title, completed, llm_response, agent_id FROM subtasks WHERE task_id = %s ORDER BY position",
        (task_id,),
    ).fetchall()
    return _task_row_to_dict(row, subtasks)


# ── Models ──


class SubtaskCreate(BaseModel):
    id: Optional[str] = None
    title: str
    completed: bool = False
    llm_response: Optional[str] = None
    llm_loading: Optional[bool] = None
    agent_id: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    completed: bool = False
    subtasks: list[SubtaskCreate] = []


class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    llm_response: Optional[str] = None
    llm_loading: Optional[bool] = None
    agent_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    subtasks: Optional[list[SubtaskCreate]] = None


# ── Notification helper ──


async def send_notification(type: str, title: str, message: str, task_id: str | None = None):
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                f"{NOTIFICATION_URL}/notifications",
                json={"type": type, "title": title, "message": message, "task_id": task_id},
            )
    except Exception:
        pass  # Non-blocking — don't fail task ops if notifications are down


# ── Routes ──


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/tasks")
def list_tasks():
    with get_conn() as conn:
        task_rows = conn.execute(
            "SELECT id, title, description, completed FROM tasks ORDER BY id"
        ).fetchall()
        result = []
        for t in task_rows:
            subtasks = conn.execute(
                "SELECT id, title, completed, llm_response, agent_id FROM subtasks WHERE task_id = %s ORDER BY position",
                (t[0],),
            ).fetchall()
            result.append(_task_row_to_dict(t, subtasks))
        return result


@app.get("/tasks/{task_id}")
def get_task(task_id: str):
    with get_conn() as conn:
        task = _get_task_with_subtasks(conn, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task


@app.post("/tasks", status_code=201)
async def create_task(task: TaskCreate):
    task_id = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO tasks (id, title, description, completed) VALUES (%s, %s, %s, %s)",
            (task_id, task.title, task.description or "", task.completed),
        )
        for i, st in enumerate(task.subtasks):
            st_id = st.id or str(uuid.uuid4())
            conn.execute(
                "INSERT INTO subtasks (id, task_id, title, completed, llm_response, agent_id, position) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (st_id, task_id, st.title, st.completed, st.llm_response, st.agent_id, i),
            )
        conn.commit()
        task_data = _get_task_with_subtasks(conn, task_id)

    await send_notification("task_created", "Task Created", f'"{task.title}" has been added', task_id)
    return task_data


@app.patch("/tasks/{task_id}")
async def update_task(task_id: str, task: TaskUpdate):
    with get_conn() as conn:
        existing = _get_task_with_subtasks(conn, task_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Task not found")

        update_data = task.model_dump(exclude_unset=True)
        was_completed = existing["completed"]

        # Update task fields
        if "title" in update_data and update_data["title"] is not None:
            conn.execute("UPDATE tasks SET title = %s WHERE id = %s", (update_data["title"], task_id))
        if "description" in update_data and update_data["description"] is not None:
            conn.execute("UPDATE tasks SET description = %s WHERE id = %s", (update_data["description"], task_id))
        if "completed" in update_data and update_data["completed"] is not None:
            conn.execute("UPDATE tasks SET completed = %s WHERE id = %s", (update_data["completed"], task_id))

        # Handle subtasks — replace the whole list if provided
        if "subtasks" in update_data and update_data["subtasks"] is not None:
            conn.execute("DELETE FROM subtasks WHERE task_id = %s", (task_id,))
            for i, st in enumerate(update_data["subtasks"]):
                st_id = st.get("id") or str(uuid.uuid4())
                conn.execute(
                    "INSERT INTO subtasks (id, task_id, title, completed, llm_response, agent_id, position) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (st_id, task_id, st["title"], st.get("completed", False), st.get("llm_response"), st.get("agent_id"), i),
                )

        conn.commit()
        result = _get_task_with_subtasks(conn, task_id)

    title = result["title"]
    if "completed" in update_data and update_data["completed"] and not was_completed:
        await send_notification("task_completed", "Task Completed", f'"{title}" marked as done', task_id)
    elif update_data.get("title") is not None:
        await send_notification("task_updated", "Task Updated", f'"{title}" has been updated', task_id)

    return result


@app.patch("/tasks/{task_id}/subtasks/{subtask_id}")
def update_subtask(task_id: str, subtask_id: str, update: SubtaskUpdate):
    with get_conn() as conn:
        existing = _get_task_with_subtasks(conn, task_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Task not found")

        # Check subtask exists
        row = conn.execute(
            "SELECT id FROM subtasks WHERE id = %s AND task_id = %s",
            (subtask_id, task_id),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Subtask not found")

        update_data = update.model_dump(exclude_unset=True)
        if "title" in update_data and update_data["title"] is not None:
            conn.execute("UPDATE subtasks SET title = %s WHERE id = %s", (update_data["title"], subtask_id))
        if "completed" in update_data and update_data["completed"] is not None:
            conn.execute("UPDATE subtasks SET completed = %s WHERE id = %s", (update_data["completed"], subtask_id))
        if "llm_response" in update_data:
            conn.execute("UPDATE subtasks SET llm_response = %s WHERE id = %s", (update_data["llm_response"], subtask_id))
        if "agent_id" in update_data:
            conn.execute("UPDATE subtasks SET agent_id = %s WHERE id = %s", (update_data["agent_id"], subtask_id))

        conn.commit()
        return _get_task_with_subtasks(conn, task_id)


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    with get_conn() as conn:
        task = _get_task_with_subtasks(conn, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        conn.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        conn.commit()

    await send_notification("task_deleted", "Task Deleted", f'"{task["title"]}" has been removed', task_id)
    return {"message": "Task deleted", "task": task}


@app.get("/tasks/{task_id}/response")
def download_response(task_id: str):
    with get_conn() as conn:
        task = _get_task_with_subtasks(conn, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

    # Build RESPONSE.md
    lines = [f"# {task['title']}\n"]
    if task.get("description"):
        lines.append(f"{task['description']}\n")
    lines.append(f"**Status**: {'Completed' if task['completed'] else 'In Progress'}\n")
    lines.append("---\n")

    for i, st in enumerate(task["subtasks"], 1):
        lines.append(f"## {i}. {st['title']}\n")
        if st.get("agent_id"):
            lines.append(f"**Agent**: {st['agent_id']}\n")
        lines.append(f"**Status**: {'Done' if st['completed'] else 'Pending'}\n")
        if st.get("llm_response"):
            lines.append(f"\n{st['llm_response']}\n")
        else:
            lines.append("\n*No solution yet.*\n")
        lines.append("\n---\n")

    content = "\n".join(lines)
    filename = task["title"].replace(" ", "_")[:50] + "_RESPONSE.md"

    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
