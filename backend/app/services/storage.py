"""
storage.py — Storage Orchestration Service
==========================================

Coordinates file storage operations, artifact resolution, and download streaming.
"""

from __future__ import annotations

from pathlib import Path
from typing import BinaryIO, Dict, Optional, Tuple, Union

from app.services.base import BaseService
from app.storage.base import BaseStorageEngine
from app.storage.local import LocalStorageEngine


class StorageService(BaseService):
    """
    High-level service managing storage backends and file access.
    """

    def __init__(self, engine: Optional[BaseStorageEngine] = None) -> None:
        super().__init__()
        self.engine = engine or LocalStorageEngine()

    async def save_file(self, path: str, data: Union[bytes, str, BinaryIO]) -> str:
        """Persist a file via the configured storage engine."""
        return await self.engine.save(path, data)

    async def read_file(self, path: str) -> bytes:
        """Read a file from storage."""
        return await self.engine.read(path)

    async def file_exists(self, path: str) -> bool:
        """Check if file exists."""
        return await self.engine.exists(path)

    def get_download_url(self, path: str) -> str:
        """Resolve download URI."""
        return self.engine.get_url(path)

    async def check_health(self) -> Tuple[bool, str]:
        """Probe storage subsystem health."""
        return await self.engine.check_health()
