import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine
import main


@pytest.fixture
def client():
    """Create a TestClient using an in-memory SQLite database for isolation."""
    # Use a SQLite in-memory DB for tests
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

    # Replace the app's engine and create tables
    main.engine = engine
    SQLModel.metadata.create_all(engine, checkfirst=True)

    with TestClient(main.app) as client:
        yield client

    # Teardown: drop all tables
    SQLModel.metadata.drop_all(engine)


def create_todo_helper(client, title="Test Todo", description="Test description", ending_note=None):
    payload = {"title": title, "description": description}
    if ending_note is not None:
        payload["ending_note"] = ending_note
    resp = client.post("/todos/", json=payload)
    assert resp.status_code == 201
    return resp.json()


def test_create_todo(client):
    todo = create_todo_helper(client)

    assert "id" in todo
    assert todo["title"] == "Test Todo"
    assert todo["description"] == "Test description"
    assert todo["completion_status"] is False
    assert todo["completion_time"] is None
    assert todo["ending_note"] is None


def test_get_todos_and_get_by_id(client):
    # Initially empty
    r = client.get("/todos/")
    assert r.status_code == 200
    assert r.json() == []

    # Create an item
    created = create_todo_helper(client, ending_note="note")

    # Ensure it's listed
    r = client.get("/todos/")
    assert r.status_code == 200
    todos = r.json()
    assert len(todos) == 1

    # Get by id
    r = client.get(f"/todos/{created['id']}")
    assert r.status_code == 200
    item = r.json()
    assert item["title"] == "Test Todo"
    assert item["ending_note"] == "note"

    # Non-existent returns 404
    r = client.get("/todos/9999")
    assert r.status_code == 404


def test_update_todo_and_completion_time(client):
    created = create_todo_helper(client)
    todo_id = created["id"]

    # Partial update: title/description/ending_note
    payload = {"title": "Updated", "description": "New desc", "ending_note": "end"}
    r = client.put(f"/todos/{todo_id}", json=payload)
    assert r.status_code == 200
    updated = r.json()
    assert updated["title"] == "Updated"
    assert updated["description"] == "New desc"
    assert updated["ending_note"] == "end"

    # Mark complete -> completion_time set
    r = client.put(f"/todos/{todo_id}", json={"completion_status": True})
    assert r.status_code == 200
    updated = r.json()
    assert updated["completion_status"] is True
    assert updated["completion_time"] is not None

    # Mark incomplete -> completion_time cleared
    r = client.put(f"/todos/{todo_id}", json={"completion_status": False})
    assert r.status_code == 200
    updated = r.json()
    assert updated["completion_status"] is False
    assert updated["completion_time"] is None


def test_update_nonexistent_returns_404(client):
    r = client.put("/todos/9999", json={"title": "x"})
    assert r.status_code == 404


def test_delete_todo(client):
    created = create_todo_helper(client)
    todo_id = created["id"]

    # Delete
    r = client.delete(f"/todos/{todo_id}")
    assert r.status_code == 204

    # Ensure gone
    r = client.get(f"/todos/{todo_id}")
    assert r.status_code == 404


def test_delete_nonexistent_returns_404(client):
    r = client.delete("/todos/9999")
    assert r.status_code == 404


def test_create_validation_error(client):
    # Missing title
    r = client.post("/todos/", json={"description": "only desc"})
    assert r.status_code == 422
