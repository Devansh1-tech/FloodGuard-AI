"""
common.py — Generic API Response Envelopes
==========================================

Defines standardized generic envelopes for success, error, and paginated responses.
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standard success API response container."""
    success: bool = True
    data: T
    message: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated collection response envelope."""
    items: List[T]
    total: int
    skip: int
    limit: int
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
