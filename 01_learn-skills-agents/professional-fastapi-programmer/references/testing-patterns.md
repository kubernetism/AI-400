# Testing Patterns

## Table of Contents
- [Test Setup](#test-setup)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Test Fixtures](#test-fixtures)

## Test Setup

### conftest.py

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.config import settings

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    """Create fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    """Test client with database override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def api_key_header():
    """Valid API key header for authenticated requests."""
    return {"X-API-Key": settings.api_keys[0] if settings.api_keys else "test-key"}
```

## Unit Tests

### Testing CRUD Operations

```python
# tests/crud/test_user.py
import pytest
from app.crud.user import user_crud
from app.schemas.user import UserCreate

def test_create_user(db):
    user_in = UserCreate(email="test@example.com", password="SecurePass123")
    user = user_crud.create(db, obj_in=user_in)

    assert user.email == "test@example.com"
    assert user.id is not None
    assert user.hashed_password != "SecurePass123"  # Should be hashed

def test_get_by_email(db):
    # Create user first
    user_in = UserCreate(email="find@example.com", password="SecurePass123")
    user_crud.create(db, obj_in=user_in)

    # Find by email
    found = user_crud.get_by_email(db, email="find@example.com")
    assert found is not None
    assert found.email == "find@example.com"

def test_get_by_email_not_found(db):
    found = user_crud.get_by_email(db, email="nonexistent@example.com")
    assert found is None
```

### Testing Schemas

```python
# tests/schemas/test_user.py
import pytest
from pydantic import ValidationError
from app.schemas.user import UserCreate

def test_user_create_valid():
    user = UserCreate(email="valid@example.com", password="SecurePass123")
    assert user.email == "valid@example.com"

def test_user_create_invalid_email():
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(email="not-an-email", password="SecurePass123")
    assert "email" in str(exc_info.value)

def test_user_create_weak_password():
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(email="test@example.com", password="weak")
    assert "password" in str(exc_info.value).lower()
```

## Integration Tests

### Testing API Endpoints

```python
# tests/api/test_items.py
import pytest
from fastapi import status

def test_create_item(client, api_key_header):
    response = client.post(
        "/api/v1/items",
        json={"name": "Test Item", "description": "A test item"},
        headers=api_key_header,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Test Item"
    assert "id" in data

def test_get_item(client, api_key_header, db):
    # Create item first
    create_response = client.post(
        "/api/v1/items",
        json={"name": "Get Test", "description": "To be fetched"},
        headers=api_key_header,
    )
    item_id = create_response.json()["id"]

    # Get the item
    response = client.get(f"/api/v1/items/{item_id}", headers=api_key_header)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == item_id

def test_get_item_not_found(client, api_key_header):
    response = client.get("/api/v1/items/99999", headers=api_key_header)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_list_items_pagination(client, api_key_header):
    # Create multiple items
    for i in range(25):
        client.post(
            "/api/v1/items",
            json={"name": f"Item {i}", "description": f"Description {i}"},
            headers=api_key_header,
        )

    # Test pagination
    response = client.get(
        "/api/v1/items?page=1&page_size=10",
        headers=api_key_header,
    )
    data = response.json()
    assert len(data["data"]) == 10
    assert data["total"] == 25
    assert data["pages"] == 3

def test_unauthorized_without_api_key(client):
    response = client.get("/api/v1/items")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_forbidden_with_invalid_api_key(client):
    response = client.get(
        "/api/v1/items",
        headers={"X-API-Key": "invalid-key"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
```

## Test Fixtures

### Factory Fixtures

```python
# tests/conftest.py
import pytest
from app.models.user import User
from app.models.item import Item

@pytest.fixture
def user_factory(db):
    """Factory for creating test users."""
    def create_user(email: str = "test@example.com", **kwargs):
        user = User(
            email=email,
            hashed_password="hashed_test_password",
            is_active=True,
            **kwargs,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    return create_user

@pytest.fixture
def item_factory(db, user_factory):
    """Factory for creating test items."""
    def create_item(name: str = "Test Item", owner: User = None, **kwargs):
        if owner is None:
            owner = user_factory()
        item = Item(name=name, owner_id=owner.id, **kwargs)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    return create_item

# Usage in tests
def test_user_items(db, user_factory, item_factory):
    user = user_factory(email="owner@example.com")
    item1 = item_factory(name="Item 1", owner=user)
    item2 = item_factory(name="Item 2", owner=user)

    assert len(user.items) == 2
```

### Async Test Support

```python
# tests/conftest.py
import pytest
import pytest_asyncio
from httpx import AsyncClient
from app.main import app

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

# Usage
@pytest.mark.asyncio
async def test_async_endpoint(async_client, api_key_header):
    response = await async_client.get("/api/v1/items", headers=api_key_header)
    assert response.status_code == 200
```
