"""
jobs.py — Background Jobs Management API Router
===============================================

Exposes endpoints for listing, monitoring, inspecting, and cancelling/deleting
asynchronous processing tasks across the platform.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status

from app.dependencies.services import get_job_service
from app.models.enums import JobPriority, JobStatus
from app.schemas.common import ApiResponse, PaginatedResponse, make_response
from app.schemas.jobs import JobCreateRequest, JobResponse, JobStatusDetailResponse, JobStatusResponse
from app.services.job import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get(
    "",
    response_model=ApiResponse[List[JobStatusDetailResponse]],
    summary="List all jobs",
    description=(
        "List background processing jobs with pagination, sorting by creation date or "
        "priority, status filtering, priority filtering, and text search."
    ),
)
async def list_jobs(
    req: Request,
    skip: int = Query(default=0, ge=0, description="Offset record index"),
    limit: int = Query(default=50, ge=1, le=100, description="Page limit"),
    job_status: Optional[JobStatus] = Query(default=None, alias="status", description="Filter by status"),
    job_priority: Optional[JobPriority] = Query(default=None, alias="priority", description="Filter by priority"),
    search: Optional[str] = Query(default=None, description="Search term matching job name"),
    sort_by: str = Query(default="created_at", description="Field to sort by (created_at, priority, status)"),
    order: str = Query(default="desc", description="Sort order (asc or desc)"),
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[List[JobStatusDetailResponse]]:
    """
    List all jobs with pagination, sorting, filtering, and search.
    """
    jobs, total = await job_service.list_jobs_operational(
        skip=skip,
        limit=limit,
        status=job_status,
        priority=job_priority,
        search=search,
        sort_by=sort_by,
        order=order,
    )
    return make_response(
        data=jobs,
        message=f"Retrieved {len(jobs)} jobs (total: {total}).",
        request=req,
    )


@router.get(
    "/{job_id}",
    response_model=ApiResponse[JobStatusDetailResponse],
    summary="Get live job status and telemetry",
    description=(
        "Return live job status, current milestone stage (CONFIG, VALIDATION, "
        "EARTH ENGINE, STAGE 2, STAGE 3, REPORTS, COMPLETED), execution progress %, "
        "elapsed time, collected warnings, and errors."
    ),
)
async def get_job_details(
    job_id: str,
    req: Request,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[JobStatusDetailResponse]:
    """
    Retrieve live job status, progress percentage, current stage, warnings, and errors.
    """
    job_detail = await job_service.get_job_detail(job_id)
    return make_response(
        data=job_detail,
        message=f"Job {job_id} status: {job_detail.status.value}",
        request=req,
    )


@router.delete(
    "/{job_id}",
    response_model=ApiResponse[Optional[JobStatusDetailResponse]],
    summary="Cancel running job or delete completed job",
    description=(
        "If the job is PENDING or RUNNING, requests cancellation and updates state. "
        "If the job is COMPLETED, FAILED, or CANCELLED, removes the record from the database."
    ),
)
async def cancel_or_delete_job(
    job_id: str,
    req: Request,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[Optional[JobStatusDetailResponse]]:
    """
    Cancel running job or delete completed job depending on lifecycle status.
    """
    is_cancelled, message, result_obj = await job_service.cancel_or_delete_job(job_id)
    return make_response(
        data=result_obj,
        message=message,
        request=req,
    )


@router.post(
    "",
    response_model=ApiResponse[JobResponse],
    status_code=status.HTTP_202_ACCEPTED,
    summary="Enqueue a generic background job (backward compatibility)",
)
async def create_job(
    request_data: JobCreateRequest,
    req: Request,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[JobResponse]:
    """
    Enqueue a background processing job.
    """
    job = await job_service.create_job(request_data)
    return make_response(
        data=job,
        message="Job queued successfully.",
        request=req,
    )


@router.get(
    "/{job_id}/status",
    response_model=ApiResponse[JobStatusResponse],
    summary="Lightweight polling endpoint",
)
async def get_job_status(
    job_id: str,
    req: Request,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[JobStatusResponse]:
    """
    Lightweight polling endpoint returning progress percent and current status.
    """
    status_info = await job_service.get_job_status(job_id)
    return make_response(
        data=status_info,
        message=f"Job status: {status_info.status.value}",
        request=req,
    )


@router.post(
    "/{job_id}/cancel",
    response_model=ApiResponse[JobResponse],
    summary="Cancel in-flight job (legacy endpoint)",
)
async def cancel_job_legacy(
    job_id: str,
    req: Request,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[JobResponse]:
    """
    Legacy cancel endpoint.
    """
    job = await job_service.cancel_job(job_id)
    return make_response(
        data=job,
        message="Job cancellation requested.",
        request=req,
    )
