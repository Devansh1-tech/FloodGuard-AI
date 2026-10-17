"""
job.py — AnalysisJob Entity Data Access Repository
==================================================

Provides asynchronous database persistence and query operations for AnalysisJob
entities, lifecycle transitions, and progress monitoring.
"""

from __future__ import annotations

import datetime
import uuid
from typing import Any, List, Optional
from sqlalchemy import desc, select
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
