"""
artifacts.py — Deliverable Artifacts API Router
===============================================

Exposes endpoints for retrieving generated deliverable metadata and downloading
geospatial vector layers (GeoJSON), raster GeoTIFFs, cartographic PNG maps,
and audit logs.
"""

from __future__ import annotations

import os
from pathlib import Path
from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse

from app.dependencies.services import get_artifact_service
from app.schemas.artifacts import ArtifactResponse
from app.schemas.common import ApiResponse, make_response
from app.services.artifact import ArtifactService

router = APIRouter(prefix="/artifacts", tags=["Artifacts"])


@router.get(
    "/{artifact_id}",
    response_model=ApiResponse[ArtifactResponse],
    summary="Get artifact metadata",
    description="Retrieve database metadata, deliverable type, file size, checksum, and download URL.",
)
async def get_artifact_metadata(
    artifact_id: str,
    req: Request,
    artifact_service: ArtifactService = Depends(get_artifact_service),
) -> ApiResponse[ArtifactResponse]:
    """
    Return artifact metadata.
    """
    metadata = await artifact_service.get_artifact_metadata(artifact_id)
    return make_response(
        data=metadata,
        message="Artifact metadata retrieved successfully.",
        request=req,
    )


@router.get(
    "/{artifact_id}/download",
    summary="Download artifact deliverable",
    description="Download or stream the generated deliverable directly from disk.",
)
async def download_artifact(
    artifact_id: str,
    artifact_service: ArtifactService = Depends(get_artifact_service),
):
    """
    Download artifact deliverable.
    """
    file_path = await artifact_service.get_artifact_file_path(artifact_id)
    filename = Path(file_path).name
    media_type = "application/octet-stream"
    if filename.endswith(".geojson") or filename.endswith(".json"):
        media_type = "application/geo+json"
    elif filename.endswith(".png"):
        media_type = "image/png"
    elif filename.endswith(".tif") or filename.endswith(".tiff"):
        media_type = "image/tiff"
    elif filename.endswith(".csv"):
        media_type = "text/csv"

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type,
    )
