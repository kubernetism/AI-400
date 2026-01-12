"""Common Pydantic schemas for API responses."""
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class DataResponse(BaseModel, Generic[T]):
    """Standard wrapper for single-item responses."""

    data: T
    message: str = "Success"


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard wrapper for paginated list responses."""

    data: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class ErrorDetail(BaseModel):
    """Error detail schema."""

    loc: list[str] | None = None
    msg: str
    type: str | None = None


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    detail: str | list[ErrorDetail]
