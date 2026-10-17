"""
Core system abstractions, exceptions, logging, and error handlers.
"""

from app.core.exceptions import (
    ApplicationError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    PipelineError,
    DatabaseError,
    FileStorageError,
)
from app.core.logging import setup_logging, get_logger
from app.core.handlers import register_exception_handlers

__all__ = [
    "ApplicationError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "NotFoundError",
    "PipelineError",
    "DatabaseError",
    "FileStorageError",
    "setup_logging",
    "get_logger",
    "register_exception_handlers",
]
