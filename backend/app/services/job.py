"""
job.py — Background Job Management Service
==========================================

Service layer interfacing between API endpoints and the background job
execution subsystem (JobManager, ExecutionTracker, JobRepository).
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.core.exceptions import NotFoundError
from app.jobs.base import Job, JobPriority, JobStatus
from app.jobs.manager import JobManager
from app.schemas.analysis import AnalysisTriggerRequest
from app.schemas.jobs import JobCreateRequest, JobResponse, JobStatusResponse
from app.services.base import BaseService


class JobService(BaseService):
    """
    Coordinates asynchronous task dispatching, inspection, and cancellation.
    """

    def __init__(self, job_manager: Optional[JobManager] = None) -> None:
        super().__init__()
        self.job_manager = job_manager or JobManager()

    @staticmethod
    def _to_job_response(job: Job) -> JobResponse:
        """Convert domain Job entity into JobResponse schema."""
        return JobResponse(
            job_id=job.job_id,
            job_type=job.job_type,
            status=job.status,
            priority=job.priority,
            progress_percent=job.progress_percent,
            message=job.message,
            created_at=job.created_at.isoformat(),
            started_at=job.started_at.isoformat() if job.started_at else None,
            completed_at=job.completed_at.isoformat() if job.completed_at else None,
            result=job.result.data if job.result else None,
            error=job.error,
        )

    async def create_job(self, request: JobCreateRequest) -> JobResponse:
        """Submit a generic background task."""
        job = await self.job_manager.submit_job(
            job_type=request.job_type,
            parameters=request.parameters,
            priority=request.priority,
        )
        return self._to_job_response(job)

    async def submit_analysis_job(self, request: AnalysisTriggerRequest) -> JobResponse:
        """Enqueue an end-to-end flood disaster analysis pipeline task."""
        job = await self.job_manager.submit_job(
            job_type="pipeline_analysis",
            parameters=request.model_dump(),
            priority=JobPriority.HIGH,
        )
        return self._to_job_response(job)

    async def get_job(self, job_id: str) -> JobResponse:
        """Retrieve full details of a background job."""
        job = await self.job_manager.get_job(job_id)
        return self._to_job_response(job)

    async def get_job_status(self, job_id: str) -> JobStatusResponse:
        """Retrieve lightweight progress status snapshot."""
        job = await self.job_manager.get_job(job_id)
        return JobStatusResponse(
            job_id=job.job_id,
            status=job.status,
            progress_percent=job.progress_percent,
            message=job.message,
        )

    async def cancel_job(self, job_id: str) -> JobResponse:
        """Cancel an in-flight background job."""
        job = await self.job_manager.cancel_job(job_id)
        return self._to_job_response(job)

    async def list_jobs(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[JobStatus] = None,
    ) -> List[JobResponse]:
        """List background jobs with pagination."""
        jobs = await self.job_manager.list_jobs(skip=skip, limit=limit, status=status)
        return [self._to_job_response(j) for j in jobs]
