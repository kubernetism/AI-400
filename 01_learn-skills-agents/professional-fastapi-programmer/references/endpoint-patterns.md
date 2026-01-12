# API Endpoint Patterns

## Table of Contents
- [Router Organization](#router-organization)
- [Request/Response Schemas](#requestresponse-schemas)
- [Standard CRUD Endpoints](#standard-crud-endpoints)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Async Patterns](#async-patterns)

## Router Organization

### Version Router

```python
# app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1.endpoints import users, items, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
```

### Main Application

```python
# app/main.py
from fastapi import FastAPI
from app.api.v1.router import api_router
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    docs_url=f"{settings.api_v1_prefix}/docs",
    redoc_url=f"{settings.api_v1_prefix}/redoc",
)

app.include_router(api_router, prefix=settings.api_v1_prefix)
```

## Request/Response Schemas

### Schema Naming Convention

```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime

# Base - shared fields
class UserBase(BaseModel):
    email: EmailStr
    username: str

# Create - input for creation
class UserCreate(UserBase):
    password: str

# Update - all fields optional
class UserUpdate(BaseModel):
    email: EmailStr | None = None
    username: str | None = None
    password: str | None = None

# Response - output from API
class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Internal - includes sensitive data (never return)
class UserInternal(UserResponse):
    hashed_password: str
```

### Response Wrappers

```python
# app/schemas/common.py
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class DataResponse(BaseModel, Generic[T]):
    data: T
    message: str = "Success"

class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    total: int
    page: int
    page_size: int
    pages: int
```

## Standard CRUD Endpoints

### Complete Resource Router

```python
# app/api/v1/endpoints/items.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, verify_api_key
from app.crud.item import item_crud
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(dependencies=[Depends(verify_api_key)])

@router.get("", response_model=PaginatedResponse[ItemResponse])
def list_items(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List all items with pagination."""
    skip = (page - 1) * page_size
    items = item_crud.get_multi(db, skip=skip, limit=page_size)
    total = item_crud.count(db)
    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )

@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get item by ID."""
    item = item_crud.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item_in: ItemCreate, db: Session = Depends(get_db)):
    """Create new item."""
    return item_crud.create(db, obj_in=item_in)

@router.patch("/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item_in: ItemUpdate, db: Session = Depends(get_db)):
    """Update existing item (partial)."""
    item = item_crud.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item_crud.update(db, db_obj=item, obj_in=item_in)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    """Delete item."""
    item = item_crud.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item_crud.delete(db, id=item_id)
    return None
```

## Error Handling

### Custom Exception Classes

```python
# app/exceptions.py
from fastapi import HTTPException, status

class NotFoundError(HTTPException):
    def __init__(self, resource: str, identifier: str | int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with id '{identifier}' not found",
        )

class ConflictError(HTTPException):
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=message,
        )

class ValidationError(HTTPException):
    def __init__(self, errors: list[dict]):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"errors": errors},
        )
```

### Global Exception Handler

```python
# app/main.py
from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Database integrity error. Resource may already exist."},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the error here
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )
```

## Pagination

### Cursor-Based Pagination (Preferred for Large Datasets)

```python
from pydantic import BaseModel
from typing import Generic, TypeVar
import base64

T = TypeVar("T")

class CursorPage(BaseModel, Generic[T]):
    data: list[T]
    next_cursor: str | None
    has_more: bool

def encode_cursor(id: int) -> str:
    return base64.b64encode(str(id).encode()).decode()

def decode_cursor(cursor: str) -> int:
    return int(base64.b64decode(cursor).decode())

@router.get("/items", response_model=CursorPage[ItemResponse])
def list_items(
    cursor: str | None = None,
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    query = select(Item).order_by(Item.id)
    if cursor:
        last_id = decode_cursor(cursor)
        query = query.where(Item.id > last_id)
    query = query.limit(limit + 1)  # Fetch one extra to check has_more

    items = list(db.scalars(query).all())
    has_more = len(items) > limit
    items = items[:limit]

    return CursorPage(
        data=items,
        next_cursor=encode_cursor(items[-1].id) if items and has_more else None,
        has_more=has_more,
    )
```

## Async Patterns

### Async Endpoints with httpx

```python
import httpx
from fastapi import APIRouter

router = APIRouter()

@router.get("/external-data")
async def fetch_external_data():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
        response.raise_for_status()
        return response.json()
```

### Background Tasks

```python
from fastapi import BackgroundTasks

def send_notification(email: str, message: str):
    # Simulate sending email
    print(f"Sending to {email}: {message}")

@router.post("/items")
async def create_item(
    item: ItemCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    db_item = item_crud.create(db, obj_in=item)
    background_tasks.add_task(send_notification, "admin@example.com", f"New item: {db_item.id}")
    return db_item
```
