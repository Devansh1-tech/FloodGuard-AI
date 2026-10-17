"""
base.py — Storage Engine Abstraction
===================================

Defines the contract for object/file storage backends, decoupling the application
from local disks, AWS S3, Google Cloud Storage, or Azure Blob Storage.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, BinaryIO, Dict, Optional, Tuple, Union


class BaseStorageEngine(ABC):
    """
    Abstract interface for object and file storage.
    """

    @abstractmethod
    async def save(
        self,
        file_path: str,
        data: Union[bytes, str, BinaryIO],
        content_type: Optional[str] = None,
    ) -> str:
        """Persist data and return normalized URI or path."""
        pass

    @abstractmethod
    async def read(self, file_path: str) -> bytes:
        """Read binary contents of a file."""
        pass

    @abstractmethod
    async def exists(self, file_path: str) -> bool:
        """Check if file exists in storage."""
        pass

    @abstractmethod
    async def delete(self, file_path: str) -> bool:
        """Delete a file from storage."""
        pass

    @abstractmethod
    def get_url(self, file_path: str) -> str:
        """Retrieve accessible URI or path for download."""
        pass

    @abstractmethod
    async def get_metadata(self, file_path: str) -> Dict[str, Any]:
        """Retrieve file size, modified date, and MIME metadata."""
        pass

    @abstractmethod
    async def check_health(self) -> Tuple[bool, str]:
        """Probe storage backend health and write accessibility."""
        pass


class S3StorageEngine(BaseStorageEngine):
    """Future AWS S3 Storage Adapter interface."""

    async def save(self, file_path: str, data: Any, content_type: Optional[str] = None) -> str:
        raise NotImplementedError("S3 storage provider planned for cloud deployment stage.")

    async def read(self, file_path: str) -> bytes:
        raise NotImplementedError("S3 storage provider planned for cloud deployment stage.")

    async def exists(self, file_path: str) -> bool:
        raise NotImplementedError("S3 storage provider planned for cloud deployment stage.")

    async def delete(self, file_path: str) -> bool:
        raise NotImplementedError("S3 storage provider planned for cloud deployment stage.")

    def get_url(self, file_path: str) -> str:
        raise NotImplementedError("S3 storage provider planned for cloud deployment stage.")

    async def get_metadata(self, file_path: str) -> Dict[str, Any]:
        raise NotImplementedError("S3 storage provider planned for cloud deployment stage.")

    async def check_health(self) -> Tuple[bool, str]:
        return False, "S3 driver unconfigured"


class AzureBlobStorageEngine(BaseStorageEngine):
    """Future Azure Blob Storage Adapter interface."""

    async def save(self, file_path: str, data: Any, content_type: Optional[str] = None) -> str:
        raise NotImplementedError("Azure Blob storage provider planned for cloud deployment stage.")

    async def read(self, file_path: str) -> bytes:
        raise NotImplementedError("Azure Blob storage provider planned for cloud deployment stage.")

    async def exists(self, file_path: str) -> bool:
        raise NotImplementedError("Azure Blob storage provider planned for cloud deployment stage.")

    async def delete(self, file_path: str) -> bool:
        raise NotImplementedError("Azure Blob storage provider planned for cloud deployment stage.")

    def get_url(self, file_path: str) -> str:
        raise NotImplementedError("Azure Blob storage provider planned for cloud deployment stage.")

    async def get_metadata(self, file_path: str) -> Dict[str, Any]:
        raise NotImplementedError("Azure Blob storage provider planned for cloud deployment stage.")

    async def check_health(self) -> Tuple[bool, str]:
        return False, "Azure Blob driver unconfigured"


class GCSStorageEngine(BaseStorageEngine):
    """Future Google Cloud Storage Adapter interface."""

    async def save(self, file_path: str, data: Any, content_type: Optional[str] = None) -> str:
        raise NotImplementedError("Google Cloud Storage provider planned for cloud deployment stage.")

    async def read(self, file_path: str) -> bytes:
        raise NotImplementedError("Google Cloud Storage provider planned for cloud deployment stage.")

    async def exists(self, file_path: str) -> bool:
        raise NotImplementedError("Google Cloud Storage provider planned for cloud deployment stage.")

    async def delete(self, file_path: str) -> bool:
        raise NotImplementedError("Google Cloud Storage provider planned for cloud deployment stage.")

    def get_url(self, file_path: str) -> str:
        raise NotImplementedError("Google Cloud Storage provider planned for cloud deployment stage.")

    async def get_metadata(self, file_path: str) -> Dict[str, Any]:
        raise NotImplementedError("Google Cloud Storage provider planned for cloud deployment stage.")

    async def check_health(self) -> Tuple[bool, str]:
        return False, "GCS driver unconfigured"
