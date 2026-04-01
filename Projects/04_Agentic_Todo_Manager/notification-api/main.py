import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env")


# ── Database helpers ──


def get_conn():
    return psycopg.connect(DATABASE_URL)


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                task_id TEXT,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Notification API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ──


class NotificationCreate(BaseModel):
    type: str  # "task_created", "task_completed", "task_deleted", "task_updated", "subtask_solved"
    title: str
    message: str
    task_id: Optional[str] = None


class NotificationOut(BaseModel):
    id: str
    type: str
    title: str
    message: str
    task_id: Optional[str] = None
    read: bool
    created_at: str


# ── Helpers ──


def _row_to_dict(row) -> dict:
    return {
        "id": row[0],
        "type": row[1],
        "title": row[2],
        "message": row[3],
        "task_id": row[4],
        "read": row[5],
        "created_at": row[6].isoformat() if row[6] else "",
    }


# ── Routes ──


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/notifications", status_code=201, response_model=NotificationOut)
def create_notification(payload: NotificationCreate):
    notif_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO notifications (id, type, title, message, task_id, read, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (notif_id, payload.type, payload.title, payload.message, payload.task_id, False, now),
        )
        # Keep only last 100 notifications
        conn.execute("""
            DELETE FROM notifications WHERE id NOT IN (
                SELECT id FROM notifications ORDER BY created_at DESC LIMIT 100
            )
        """)
        conn.commit()
    return {
        "id": notif_id,
        "type": payload.type,
        "title": payload.title,
        "message": payload.message,
        "task_id": payload.task_id,
        "read": False,
        "created_at": now.isoformat(),
    }


@app.get("/notifications", response_model=list[NotificationOut])
def list_notifications(unread_only: bool = False):
    with get_conn() as conn:
        if unread_only:
            rows = conn.execute(
                "SELECT id, type, title, message, task_id, read, created_at FROM notifications WHERE read = FALSE ORDER BY created_at DESC"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, type, title, message, task_id, read, created_at FROM notifications ORDER BY created_at DESC"
            ).fetchall()
        return [_row_to_dict(r) for r in rows]


@app.patch("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_as_read(notification_id: str):
    with get_conn() as conn:
        conn.execute(
            "UPDATE notifications SET read = TRUE WHERE id = %s", (notification_id,)
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, type, title, message, task_id, read, created_at FROM notifications WHERE id = %s",
            (notification_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Notification not found")
        return _row_to_dict(row)


@app.post("/notifications/read-all")
def mark_all_as_read():
    with get_conn() as conn:
        conn.execute("UPDATE notifications SET read = TRUE")
        conn.commit()
    return {"message": "All notifications marked as read"}


@app.get("/notifications/unread-count")
def unread_count():
    with get_conn() as conn:
        row = conn.execute("SELECT COUNT(*) FROM notifications WHERE read = FALSE").fetchone()
        return {"count": row[0]}
