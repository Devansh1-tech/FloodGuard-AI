"""
downloads.py — File Downloads & Storage Artifact API Router
===========================================================

Exposes endpoints for resolving download URIs and accessing generated spatial
layers, GeoTIFF rasters, shapefiles, and PDF/HTML disaster reports.
"""

from __future__ import annotations

import os
from typing import Any, Dict
from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse

from app.core.exceptions import NotFoundError
from app.dependencies.services import get_storage_service
from app.schemas.common import ApiResponse
from app.services.storage import StorageService

router = APIRouter(prefix="/downloads", tags=["Downloads"])


@router.get("/url", response_model=ApiResponse[Dict[str, str]])
async def get_artifact_url(
    path: str = Query(..., description="Relative storage path of artifact"),
    storage_service: StorageService = Depends(get_storage_service),
) -> ApiResponse[Dict[str, str]]:
    """
    Resolve public download URL or local storage URI for a file.
    """
    url = storage_service.get_download_url(path)
    return ApiResponse(
        data={"path": path, "url": url},
        message="Artifact URL resolved.",
    )


@router.get("/file/{file_path:path}")
async def download_file(
    file_path: str,
    storage_service: StorageService = Depends(get_storage_service),
):
    """
    Stream or download an artifact directly from the storage subsystem.
    """
    exists = await storage_service.file_exists(file_path)
    if not exists:
        raise NotFoundError("Artifact file", file_path)

    # In local storage, resolve actual system path and serve with FileResponse
    full_path = os.path.join(storage_service.settings.STORAGE_LOCAL_ROOT, file_path)
    filename = os.path.basename(file_path)
    return FileResponse(
        path=full_path,
        filename=filename,
        media_type="application/octet-stream",
    )
