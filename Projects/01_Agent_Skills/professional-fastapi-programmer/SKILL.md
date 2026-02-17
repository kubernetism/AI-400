---
name: professional-fastapi-programmer
description: |
  This skill writes clear, robust, and readable FastAPI code following professional standards.
  Use when building REST APIs, implementing CRUD operations, setting up SQLAlchemy + PostgreSQL
  models, adding API key authentication, creating Pydantic schemas, or structuring FastAPI projects.
  Triggers on FastAPI development, API endpoints, database integration, and API testing tasks.
---

# Professional FastAPI Programmer

Write production-ready FastAPI code that is clear, robust, and maintainable.

## Before Implementation

Gather context to ensure successful implementation:

| Source | Gather |
|--------|--------|
| **Codebase** | Existing project structure, naming conventions, dependencies |
| **Conversation** | Resource names, fields, relationships, special requirements |
| **Skill References** | Patterns from `references/` for database, security, endpoints |
| **User Guidelines** | Team coding standards, existing patterns to follow |

Only ask user for THEIR specific requirements—domain expertise is embedded in this skill.

## Clarifications

Before implementing, clarify variable elements:

| Ask About | Why |
|-----------|-----|
| Resource name & fields | Determines model, schema, and endpoint structure |
| Relationships | One-to-many, many-to-many affect model design |
| Protected endpoints? | Whether to add API key authentication |
| Pagination needed? | Affects list endpoint implementation |
| New project or existing? | Use starter template vs integrate with existing |

## Core Principles

1. **Separation of Concerns** - Keep API layer, business logic, and data access separate
2. **Type Safety** - Use type hints everywhere; leverage Pydantic for validation
3. **Explicit over Implicit** - Clear naming, explicit dependencies, no magic
4. **Fail Fast** - Validate inputs early, use proper HTTP status codes
5. **Testability** - Design for dependency injection, keep functions focused

## Project Structure

Follow the standard layout for professional FastAPI projects:

```
app/
├── main.py              # Application entry, middleware
├── config.py            # Settings with pydantic-settings
├── exceptions.py        # Custom HTTP exceptions
├── api/
│   ├── deps.py          # Shared dependencies (get_db, verify_api_key)
│   └── v1/
│       ├── router.py    # Aggregate all endpoint routers
│       └── endpoints/   # One file per resource
├── core/
│   ├── database.py      # Engine, SessionLocal, get_db
│   └── security.py      # API key validation
├── models/              # SQLAlchemy ORM models
├── schemas/             # Pydantic request/response models
├── crud/                # Database operations
└── services/            # Business logic
```

Use the starter template in `assets/starter-template/` for new projects.

## Quick Reference

### Endpoint Pattern

```python
@router.get("/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_api_key),
) -> Item:
    item = item_crud.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

### Schema Pattern

```python
class ItemBase(BaseModel):
    name: str
    description: str | None = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class ItemResponse(ItemBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

### CRUD Pattern

```python
class CRUDItem(CRUDBase[Item, ItemCreate, ItemUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Item | None:
        stmt = select(Item).where(Item.name == name)
        return db.scalars(stmt).first()

item_crud = CRUDItem(Item)
```

### API Key Authentication

```python
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str | None = Security(api_key_header)) -> str:
    if not api_key or api_key not in settings.api_keys_set:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key
```

## Code Style Guidelines

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Endpoints | lowercase, hyphens | `/user-profiles` |
| Path params | snake_case | `{user_id}` |
| Query params | snake_case | `page_size` |
| Schemas | PascalCase + suffix | `UserCreate`, `UserResponse` |
| Models | PascalCase singular | `User`, `Item` |
| CRUD instances | snake_case | `user_crud` |

### HTTP Methods & Status Codes

| Operation | Method | Success Code | Response |
|-----------|--------|--------------|----------|
| List | GET | 200 | Paginated list |
| Get one | GET | 200 | Single item |
| Create | POST | 201 | Created item |
| Full update | PUT | 200 | Updated item |
| Partial update | PATCH | 200 | Updated item |
| Delete | DELETE | 204 | No content |

### Error Handling

Use custom exceptions for clarity:

```python
class NotFoundError(HTTPException):
    def __init__(self, resource: str, id: int | str):
        super().__init__(404, f"{resource} '{id}' not found")
```

Always return consistent error structure:
```json
{"detail": "Error message here"}
```

### Validation

- Use Pydantic `field_validator` for complex validation
- Use `Query()`, `Path()`, `Body()` for constraint documentation
- Validate at boundaries, trust internal code

```python
@router.get("/items")
def list_items(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
):
```

## Common Workflows

### Adding a New Resource

1. Create model in `models/resource.py`
2. Create schemas in `schemas/resource.py` (Base, Create, Update, Response)
3. Create CRUD in `crud/resource.py` extending CRUDBase
4. Create router in `api/v1/endpoints/resource.py`
5. Register router in `api/v1/router.py`
6. Generate migration: `alembic revision --autogenerate -m "Add resource"`

### Adding API Key Scopes

See `references/security-patterns.md` for tiered API key implementation.

## Reference Documentation

Consult these files for detailed patterns:

| File | Content |
|------|---------|
| `references/project-structure.md` | Full project layout, configuration |
| `references/database-patterns.md` | SQLAlchemy models, CRUD, migrations |
| `references/security-patterns.md` | API keys, rate limiting, validation |
| `references/endpoint-patterns.md` | Routers, pagination, async patterns |
| `references/testing-patterns.md` | Fixtures, unit tests, integration tests |

## Anti-Patterns to Avoid

- **Business logic in endpoints** - Move to services/
- **Raw SQL strings** - Use SQLAlchemy ORM/Core
- **Catching generic Exception** - Catch specific exceptions
- **Mutable default arguments** - Use `None` with `if param is None`
- **Hardcoded configuration** - Use pydantic-settings
- **Missing type hints** - Always annotate parameters and returns
- **Circular imports** - Use TYPE_CHECKING for forward references

## Quality Checklist

Before delivering code, verify:

- [ ] All functions have type hints (params + return)
- [ ] Pydantic schemas use `model_config = ConfigDict(from_attributes=True)` for ORM
- [ ] Endpoints use correct HTTP methods and status codes
- [ ] Database sessions properly injected via `Depends(get_db)`
- [ ] Protected endpoints include `Depends(verify_api_key)`
- [ ] Errors use `HTTPException` with appropriate status codes
- [ ] No hardcoded values—configuration via `settings`
- [ ] CRUD operations use parameterized queries (no SQL injection)
- [ ] Imports follow convention: stdlib → third-party → local
