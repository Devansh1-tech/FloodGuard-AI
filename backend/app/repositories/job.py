"""
job.py — AnalysisJob Entity Data Access Repository
==================================================

Provides asynchronous database persistence and query operations for AnalysisJob
entities, lifecycle transitions, and progress monitoring.
"""

from __future__ import annotations

import datetime
import uuid
from typing import Any, List, Optional, Tuple
from sqlalchemy import asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import JobPriority, JobStatus
from app.models.job import AnalysisJob
from app.repositories.base import BaseRepository


class JobRepository(BaseRepository[AnalysisJob, Any, Any]):
    """Database persistence repository for AnalysisJob entities."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(model=AnalysisJob, session=session)

    async def get_with_runs(self, job_id: uuid.UUID) -> Optional[AnalysisJob]:
        """Fetch job including eagerly-loaded pipeline runs."""
        stmt = (
            select(AnalysisJob)
            .where(AnalysisJob.id == job_id)
            .options(selectinload(AnalysisJob.pipeline_runs))
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_status(
        self,
        status: JobStatus,
        skip: int = 0,
        limit: int = 50,
    ) -> List[AnalysisJob]:
        """Query jobs by lifecycle state sorted by priority and creation time."""
        stmt = (
            select(AnalysisJob)
            .where(AnalysisJob.status == status)
            .order_by(desc(AnalysisJob.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_progress(
        self,
        job_id: uuid.UUID,
        progress: int,
        current_stage: Optional[str] = None,
    ) -> Optional[AnalysisJob]:
        """Update job completion percentage and current milestone stage."""
        job = await self.get(job_id)
        if job:
            job.progress = max(0, min(100, progress))
            if current_stage:
                job.current_stage = current_stage
            self.session.add(job)
            await self.session.commit()
            await self.session.refresh(job)
        return job

    async def mark_started(self, job_id: uuid.UUID) -> Optional[AnalysisJob]:
        """Transition status to RUNNING and record start timestamp."""
        job = await self.get(job_id)
        if job:
            job.status = JobStatus.RUNNING
            job.started_at = datetime.datetime.now(datetime.timezone.utc)
            self.session.add(job)
            await self.session.commit()
            await self.session.refresh(job)
        return job

    async def mark_completed(
        self,
        job_id: uuid.UUID,
        duration: Optional[float] = None,
    ) -> Optional[AnalysisJob]:
        """Transition status to COMPLETED, record completion time and duration."""
        job = await self.get(job_id)
        if job:
            now = datetime.datetime.now(datetime.timezone.utc)
            job.status = JobStatus.COMPLETED
            job.completed_at = now
            job.progress = 100
            if duration is not None:
                job.duration = duration
            elif job.started_at:
                job.duration = (now - job.started_at).total_seconds()
            self.session.add(job)
            await self.session.commit()
            await self.session.refresh(job)
        return job

    async def mark_failed(self, job_id: uuid.UUID, error_message: str) -> Optional[AnalysisJob]:
        """Transition status to FAILED and record error trace."""
        job = await self.get(job_id)
        if job:
            job.status = JobStatus.FAILED
            job.completed_at = datetime.datetime.now(datetime.timezone.utc)
            job.error_message = error_message
            self.session.add(job)
            await self.session.commit()
            await self.session.refresh(job)
        return job

    async def cancel(self, job_id: uuid.UUID) -> Optional[AnalysisJob]:
        """Cancel an active or queued job."""
        job = await self.get(job_id)
        if job and job.status in [JobStatus.PENDING, JobStatus.RUNNING]:
            job.status = JobStatus.CANCELLED
            job.completed_at = datetime.datetime.now(datetime.timezone.utc)
            self.session.add(job)
            await self.session.commit()
            await self.session.refresh(job)
        return job

    async def filter_jobs(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[JobStatus] = None,
        priority: Optional[JobPriority] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        order: str = "desc",
    ) -> Tuple[List[AnalysisJob], int]:
        """
        Query jobs with filtering, text search on job_name, sorting, and pagination.
        """
        stmt = select(AnalysisJob)
        count_stmt = select(func.count()).select_from(AnalysisJob)

        if status:
            stmt = stmt.where(AnalysisJob.status == status)
            count_stmt = count_stmt.where(AnalysisJob.status == status)
        if priority:
            stmt = stmt.where(AnalysisJob.priority == priority)
            count_stmt = count_stmt.where(AnalysisJob.priority == priority)
        if search:
            search_pattern = f"%{search.strip().lower()}%"
            stmt = stmt.where(func.lower(AnalysisJob.job_name).like(search_pattern))
            count_stmt = count_stmt.where(func.lower(AnalysisJob.job_name).like(search_pattern))

        # Order column
        sort_col = getattr(AnalysisJob, sort_by, AnalysisJob.created_at)
        if order.lower() == "asc":
            stmt = stmt.order_by(asc(sort_col))
        else:
            stmt = stmt.order_by(desc(sort_col))

        stmt = stmt.offset(skip).limit(limit)

        total_res = await self.session.execute(count_stmt)
        total_count = int(total_res.scalar_one() or 0)

        items_res = await self.session.execute(stmt)
        items = list(items_res.scalars().all())

        return items, total_count

    async def find_active_duplicate(
        self,
        aoi: str,
        before_dates: Tuple[str, str],
        after_dates: Tuple[str, str],
    ) -> Optional[AnalysisJob]:
        """Find an active job with identical parameters to prevent duplicate processing."""
        stmt = select(AnalysisJob).where(
            AnalysisJob.status.in_([JobStatus.PENDING, JobStatus.RUNNING])
        )
        result = await self.session.execute(stmt)
        for job in result.scalars().all():
            params = job.parameters or {}
            if (
                params.get("aoi") == aoi
                and params.get("before_start") == before_dates[0]
                and params.get("before_end") == before_dates[1]
                and params.get("after_start") == after_dates[0]
                and params.get("after_end") == after_dates[1]
            ):
                return job
        return None

    async def count_active_ahead(self, created_at: datetime.datetime) -> int:
        """Count jobs currently pending or running created before or at this job."""
        stmt = (
            select(func.count())
            .select_from(AnalysisJob)
            .where(
                AnalysisJob.status.in_([JobStatus.PENDING, JobStatus.RUNNING]),
                AnalysisJob.created_at <= created_at,
            )
        )
        result = await self.session.execute(stmt)
        return int(result.scalar_one() or 1)
