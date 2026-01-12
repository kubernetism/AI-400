"""Custom exception classes."""
from fastapi import HTTPException, status


class NotFoundError(HTTPException):
    """Raised when a resource is not found."""

    def __init__(self, resource: str, identifier: str | int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with id '{identifier}' not found",
        )


class ConflictError(HTTPException):
    """Raised when there's a conflict with existing data."""

    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=message,
        )


class UnauthorizedError(HTTPException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message,
            headers={"WWW-Authenticate": "ApiKey"},
        )


class ForbiddenError(HTTPException):
    """Raised when access is denied."""

    def __init__(self, message: str = "Access denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message,
        )
