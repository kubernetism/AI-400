# Security Patterns - API Key Authentication

## Table of Contents
- [API Key Setup](#api-key-setup)
- [Dependency Injection](#dependency-injection)
- [Rate Limiting](#rate-limiting)
- [Security Headers](#security-headers)
- [Input Validation](#input-validation)

## API Key Setup

### Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    api_key_header: str = "X-API-Key"
    api_keys: list[str] = []  # Load from environment

    model_config = {"env_file": ".env"}

    @property
    def api_keys_set(self) -> set[str]:
        """Convert to set for O(1) lookup."""
        return set(self.api_keys)
```

### API Key Dependency

```python
# app/api/deps.py
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

from app.config import settings

api_key_header = APIKeyHeader(name=settings.api_key_header, auto_error=False)

async def verify_api_key(api_key: str | None = Security(api_key_header)) -> str:
    """Validate API key from header."""
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is missing",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    if api_key not in settings.api_keys_set:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )
    return api_key
```

### Using in Routes

```python
# app/api/v1/endpoints/items.py
from fastapi import APIRouter, Depends

from app.api.deps import verify_api_key

router = APIRouter()

# Protect single endpoint
@router.get("/items")
async def list_items(api_key: str = Depends(verify_api_key)):
    return {"items": []}

# Protect entire router
router = APIRouter(dependencies=[Depends(verify_api_key)])

@router.get("/items")
async def list_items():
    return {"items": []}
```

## Dependency Injection

### Tiered API Keys (Optional Scopes)

```python
# app/core/security.py
from enum import Enum
from dataclasses import dataclass

class APIKeyScope(str, Enum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"

@dataclass
class APIKeyInfo:
    key: str
    scopes: set[APIKeyScope]
    owner: str

# In production, store in database
API_KEY_REGISTRY: dict[str, APIKeyInfo] = {
    "key_read_abc123": APIKeyInfo(
        key="key_read_abc123",
        scopes={APIKeyScope.READ},
        owner="service-a",
    ),
    "key_admin_xyz789": APIKeyInfo(
        key="key_admin_xyz789",
        scopes={APIKeyScope.READ, APIKeyScope.WRITE, APIKeyScope.ADMIN},
        owner="admin-service",
    ),
}

def get_api_key_info(api_key: str) -> APIKeyInfo | None:
    return API_KEY_REGISTRY.get(api_key)
```

### Scope-Based Protection

```python
# app/api/deps.py
from functools import wraps
from fastapi import Depends, HTTPException, status

from app.core.security import APIKeyScope, APIKeyInfo, get_api_key_info

async def get_current_api_key(
    api_key: str = Security(api_key_header),
) -> APIKeyInfo:
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")
    key_info = get_api_key_info(api_key)
    if not key_info:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return key_info

def require_scope(scope: APIKeyScope):
    """Dependency factory for scope validation."""
    async def verify_scope(
        key_info: APIKeyInfo = Depends(get_current_api_key),
    ) -> APIKeyInfo:
        if scope not in key_info.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Scope '{scope.value}' required",
            )
        return key_info
    return verify_scope

# Usage
@router.delete("/items/{item_id}", dependencies=[Depends(require_scope(APIKeyScope.ADMIN))])
async def delete_item(item_id: int):
    ...
```

## Rate Limiting

### Using slowapi

```python
# app/core/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# app/main.py
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# In endpoints
@router.get("/items")
@limiter.limit("100/minute")
async def list_items(request: Request):
    ...
```

### API Key Based Rate Limiting

```python
def get_api_key_for_rate_limit(request: Request) -> str:
    """Use API key for rate limiting instead of IP."""
    return request.headers.get("X-API-Key", get_remote_address(request))

limiter = Limiter(key_func=get_api_key_for_rate_limit)
```

## Security Headers

### Middleware Setup

```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

## Input Validation

### Pydantic Validators

```python
from pydantic import BaseModel, field_validator, EmailStr
import re

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain a digit")
        return v

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username must be alphanumeric")
        return v
```

### SQL Injection Prevention

Always use parameterized queries through SQLAlchemy:

```python
# CORRECT - parameterized
stmt = select(User).where(User.email == email)

# NEVER DO THIS - vulnerable to SQL injection
stmt = text(f"SELECT * FROM users WHERE email = '{email}'")
```
