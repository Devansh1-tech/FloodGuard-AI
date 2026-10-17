"""
base.py — Base Service Layer Abstraction
========================================

Root service class establishing unified dependency injection conventions.
"""

from __future__ import annotations

from app.config.settings import Settings, get_settings
from app.core.logging import get_logger


class BaseService:
    """Base class for all business and domain services."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.logger = get_logger(self.__class__.__name__)
