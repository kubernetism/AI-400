"""API v1 router aggregator."""
from fastapi import APIRouter

# Import endpoint routers here
# from app.api.v1.endpoints import users, items

api_router = APIRouter()

# Include routers
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(items.router, prefix="/items", tags=["items"])
