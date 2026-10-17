"""
analysis.py — Flood Disaster Analysis API Router
=================================================

Exposes endpoints for dispatching end-to-end flood detection and
settlement impact assessment pipeline runs.
"""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, status

from app.dependencies.services import get_configuration_service, get_job_service
from app.schemas.analysis import AnalysisTriggerRequest
from app.schemas.common import ApiResponse
from app.schemas.jobs import JobResponse
from app.services.configuration import ConfigurationService
from app.services.job import JobService

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post(
    "/trigger",
    response_model=ApiResponse[JobResponse],
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_analysis(
    request: AnalysisTriggerRequest,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[JobResponse]:
    """
    Submit a disaster analysis pipeline execution job.
    """
    job = await job_service.submit_analysis_job(request)
    return ApiResponse(
        data=job,
        message="Analysis job successfully scheduled for background execution.",
    )


@router.get("/presets", response_model=ApiResponse[Dict[str, Any]])
async def get_analysis_presets(
    config_service: ConfigurationService = Depends(get_configuration_service),
) -> ApiResponse[Dict[str, Any]]:
    """
    Retrieve supported study area presets, bounding geometries, and default date ranges.
    """
    presets = config_service.get_analysis_presets()
    return ApiResponse(
        data=presets,
        message="Analysis presets retrieved successfully.",
    )
