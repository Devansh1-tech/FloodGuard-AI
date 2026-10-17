"""
jobs.py — Background Jobs Management API Router
===============================================

Exposes endpoints for listing, monitoring, inspecting, and cancelling
asynchronous processing tasks.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.dependencies.services import get_job_service
from app.jobs.base import JobStatus
from app.schemas.common import ApiResponse
from app.schemas.jobs import JobCreateRequest, JobResponse, JobStatusResponse
from app.services.job import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=ApiResponse[List[JobResponse]])
async def list_jobs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    job_status: Optional[JobStatus] = Query(default=None, alias="status"),
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[List[JobResponse]]:
    """
    List background jobs with optional status filter and pagination.
    """
    jobs = await job_service.list_jobs(skip=skip, limit=limit, status=job_status)
    return ApiResponse(
        data=jobs,
        message=f"Retrieved {len(jobs)} jobs.",
    )


@router.post("", response_model=ApiResponse[JobResponse], status_code=status.HTTP_202_ACCEPTED)
async def create_job(
    request: JobCreateRequest,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[JobResponse]:
    """
    Enqueue a background processing job.
    """
    job = await job_service.create_job(request)
    return ApiResponse(
        data=job,
        message="Job queued successfully.",
    )


@router.get("/{job_id}", response_model=ApiResponse[JobResponse])
async def get_job_details(
    job_id: str,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[JobResponse]:
    """
    Retrieve full execution details and results of a specific background job.
    """
    job = await job_service.get_job(job_id)
    return ApiResponse(
        data=job,
        message="Job details retrieved.",
    )


@router.get("/{job_id}/status", response_model=ApiResponse[JobStatusResponse])
async def get_job_status(
    job_id: str,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[JobStatusResponse]:
    """
    Lightweight polling endpoint returning progress percent and current status.
    """
    status_info = await job_service.get_job_status(job_id)
    return ApiResponse(
        data=status_info,
        message=f"Job status: {status_info.status.value}",
    )


@router.post("/{job_id}/cancel", response_model=ApiResponse[JobResponse])
async def cancel_job(
    job_id: str,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[JobResponse]:
    """
    Cancel an in-flight or queued background job.
    """
    job = await job_service.cancel_job(job_id)
    return ApiResponse(
        data=job,
        message="Job cancellation requested.",
    )
