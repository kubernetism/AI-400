# FastAPI Project Structure

## Table of Contents
- [Standard Layout](#standard-layout)
- [Module Organization](#module-organization)
- [Configuration Management](#configuration-management)

## Standard Layout

```
project_name/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entry point
│   ├── config.py            # Configuration settings
│   ├── dependencies.py      # Shared dependencies
│   ├── exceptions.py        # Custom exceptions
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          # API-specific dependencies
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py    # Version router aggregator
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── users.py
│   │           ├── items.py
│   │           └── auth.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py      # Auth utilities
│   │   └── database.py      # DB connection
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py          # SQLAlchemy base
│   │   ├── user.py
│   │   └── item.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py          # Pydantic models
│   │   └── item.py
│   ├── crud/
│   │   ├── __init__.py
│   │   ├── base.py          # Generic CRUD class
│   │   ├── user.py
│   │   └── item.py
│   └── services/
│       ├── __init__.py
│       └── email.py         # Business logic services
├── alembic/
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── api/
│   └── crud/
├── alembic.ini
├── pyproject.toml
├── requirements.txt
└── .env.example
```

## Module Organization

### Separation of Concerns

| Directory | Purpose |
|-----------|---------|
| `api/` | HTTP layer: routes, request/response handling |
| `models/` | SQLAlchemy ORM models (database schema) |
| `schemas/` | Pydantic models (validation, serialization) |
| `crud/` | Database operations (Create, Read, Update, Delete) |
| `services/` | Business logic, external integrations |
| `core/` | Cross-cutting concerns (security, DB setup) |

### Import Order Convention

```python
# Standard library
from datetime import datetime
from typing import Optional

# Third-party
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Local application
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.crud.user import user_crud
```

## Configuration Management

### Using pydantic-settings

```python
# app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    app_name: str = "FastAPI App"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str
    db_pool_size: int = 5
    db_max_overflow: int = 10

    # Security
    api_key_header: str = "X-API-Key"
    api_keys: list[str] = []  # Comma-separated in .env

    # External Services
    redis_url: str | None = None

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### Environment File Example

```bash
# .env.example
APP_NAME=MyAPI
DEBUG=false
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
API_KEYS=key1,key2,key3
REDIS_URL=redis://localhost:6379/0
```
