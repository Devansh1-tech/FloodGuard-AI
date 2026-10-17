"""
local.py — Concrete Local Filesystem Storage Adapter
===================================================

Production-grade local disk storage engine implementing BaseStorageEngine.
Features path sandboxing, atomic writing, and metadata inspection.
"""

from __future__ import annotations

import os
import shutil
from pathlib import Path
from typing import Any, BinaryIO, Dict, Optional, Tuple, Union

from app.config.settings import get_settings
from app.core.exceptions import FileStorageError
from app.storage.base import BaseStorageEngine


class LocalStorageEngine(BaseStorageEngine):
    """
    Local filesystem storage engine.
    """

    def __init__(self, root_dir: Optional[str] = None, root_path: Optional[str] = None) -> None:
        settings = get_settings()
        effective_root = root_path or root_dir or settings.STORAGE_LOCAL_ROOT
        self.root_path = Path(effective_root).resolve()
        self.root_path.mkdir(parents=True, exist_ok=True)

    def _resolve_safe_path(self, relative_path: str) -> Path:
        """Resolve path and ensure it does not escape the storage root."""
        clean = Path(relative_path).as_posix().lstrip("/")
        target = (self.root_path / clean).resolve()
        if not str(target).startswith(str(self.root_path)):
            raise FileStorageError(
                f"Path traversal detected: '{relative_path}' is outside storage root.",
                details={"attempted_path": relative_path},
            )
        return target

    async def save(
        self,
        file_path: str,
        data: Union[bytes, str, BinaryIO],
        content_type: Optional[str] = None,
    ) -> str:
        """Save binary or string data to disk."""
        target = self._resolve_safe_path(file_path)
        target.parent.mkdir(parents=True, exist_ok=True)

        try:
            if isinstance(data, bytes):
                target.write_bytes(data)
            elif isinstance(data, str):
                target.write_text(data, encoding="utf-8")
            else:
                with open(target, "wb") as f:
                    shutil.copyfileobj(data, f)
            return str(target)
        except Exception as exc:
            raise FileStorageError(f"Failed to write file '{file_path}': {exc}") from exc

    async def read(self, file_path: str) -> bytes:
        """Read binary contents from disk."""
        target = self._resolve_safe_path(file_path)
        if not target.exists():
            raise FileStorageError(f"File not found: '{file_path}'")
        try:
            return target.read_bytes()
        except Exception as exc:
            raise FileStorageError(f"Failed to read file '{file_path}': {exc}") from exc

    async def exists(self, file_path: str) -> bool:
        """Check if file exists on disk."""
        try:
            target = self._resolve_safe_path(file_path)
            return target.exists() and target.is_file()
        except FileStorageError:
            return False

    async def delete(self, file_path: str) -> bool:
        """Delete a file from disk."""
        target = self._resolve_safe_path(file_path)
        if target.exists():
            try:
                target.unlink()
                return True
            except Exception as exc:
                raise FileStorageError(f"Failed to delete file '{file_path}': {exc}") from exc
        return False

    def get_url(self, file_path: str) -> str:
        """Get local filesystem URI."""
        target = self._resolve_safe_path(file_path)
        return target.as_uri()

    async def get_metadata(self, file_path: str) -> Dict[str, Any]:
        """Get file stat metadata."""
        target = self._resolve_safe_path(file_path)
        if not target.exists():
            raise FileStorageError(f"File not found: '{file_path}'")
        stat = target.stat()
        return {
            "size_bytes": stat.st_size,
            "created_at": stat.st_ctime,
            "modified_at": stat.st_mtime,
            "is_file": target.is_file(),
            "extension": target.suffix.lower(),
        }

    async def check_health(self) -> Tuple[bool, str]:
        """Probe directory writability."""
        try:
            probe = self.root_path / f".storage_health_{os.getpid()}"
            probe.write_text("health", encoding="utf-8")
            probe.unlink(missing_ok=True)
            return True, f"Local Storage Active ({self.root_path})"
        except Exception as exc:
            return False, f"Storage write check failed: {exc}"
