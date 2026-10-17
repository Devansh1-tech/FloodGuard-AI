"""
Storage abstraction package.
"""

from app.storage.base import BaseStorageEngine
from app.storage.local import LocalStorageEngine

__all__ = ["BaseStorageEngine", "LocalStorageEngine"]
