"""
exceptions.py — Enterprise Exception Hierarchy
==============================================

Defines domain and operational exceptions mapped to standard HTTP statuses
and structured error codes for the FloodGuard AI platform.
"""

from __future__ import annotations

from typing import Any, Dict, Optional


class ApplicationError(Exception):
    """Base exception for all controlled application errors."""

    def __init__(
        self,
        message: str = "An unexpected error occurred",
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class ValidationError(ApplicationError):
    """Raised when request payload or data invariants are violated."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class AuthenticationError(ApplicationError):
    """Raised when authentication credentials are missing or invalid."""

    def __init__(self, message: str = "Authentication required or invalid credentials") -> None:
        super().__init__(
            message=message,
            code="AUTHENTICATION_FAILED",
            status_code=401,
        )


class AuthorizationError(ApplicationError):
    """Raised when user lacks permission to access a requested resource."""

    def __init__(self, message: str = "Insufficient permissions") -> None:
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403,
        )


class NotFoundError(ApplicationError):
    """Raised when an entity is not found in database or storage."""

    def __init__(self, resource: str, identifier: Any) -> None:
        super().__init__(
            message=f"{resource} with identifier '{identifier}' was not found.",
            code="RESOURCE_NOT_FOUND",
            status_code=404,
            details={"resource": resource, "identifier": str(identifier)},
        )


class PipelineError(ApplicationError):
    """Raised when a disaster analysis pipeline execution encounters a fault."""

    def __init__(self, message: str, stage: str = "GENERAL", details: Optional[Dict[str, Any]] = None) -> None:
        d = details or {}
        d["pipeline_stage"] = stage
        super().__init__(
            message=message,
            code="PIPELINE_EXECUTION_ERROR",
            status_code=500,
            details=d,
        )


class DatabaseError(ApplicationError):
    """Raised when a database query or connection fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="DATABASE_ERROR",
            status_code=500,
            details=details,
        )


class FileStorageError(ApplicationError):
    """Raised when reading, writing, or deleting files in storage fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="STORAGE_ERROR",
            status_code=500,
            details=details,
        )
