"""
manager.py — Asynchronous Job Dispatcher & Manager
==================================================

Orchestrates asynchronous background tasks, lifecycle transitions, progress
tracking, and future task queue (Celery/Redis) integration.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Callable, Coroutine, Dict, List, Optional

from app.core.exceptions import NotFoundError
from app.core.logging import get_logger
from app.jobs.base import Job, JobPriority, JobResult, JobStatus
from app.jobs.repository import JobRepository
from app.jobs.tracker import ExecutionTracker

logger = get_logger("JobManager")


class JobManager:
    """
    Coordinates creation, asynchronous execution, and status inspection of tasks.
    """

    def __init__(
        self,
        repository: Optional[JobRepository] = None,
        tracker: Optional[ExecutionTracker] = None,
    ) -> None:
        self.repository = repository or JobRepository()
        self.tracker = tracker or ExecutionTracker()

    async def submit_job(
        self,
        job_type: str,
        parameters: Dict[str, Any],
        priority: JobPriority = JobPriority.NORMAL,
        task_coroutine: Optional[Callable[[Job, ExecutionTracker], Coroutine[Any, Any, JobResult]]] = None,
    ) -> Job:
        """
        Create and enqueue a background job.
        """
        job = Job(
            job_type=job_type,
            parameters=parameters,
            priority=priority,
        )
        await self.repository.save(job)
        self.tracker.start_tracking(job.job_id, job.job_type)
        logger.info("Enqueued job [%s] of type '%s'", job.job_id, job_type)

        if task_coroutine:
            asyncio.create_task(self._execute_wrapper(job, task_coroutine))

        return job

    async def _execute_wrapper(
        self,
        job: Job,
        coro_fn: Callable[[Job, ExecutionTracker], Coroutine[Any, Any, JobResult]],
    ) -> None:
        """Internal asynchronous worker execution wrapper."""
        t0 = time.perf_counter()
        job.mark_started()
        await self.repository.save(job)

        try:
            result = await coro_fn(job, self.tracker)
            result.elapsed_seconds = round(time.perf_counter() - t0, 2)
            job.mark_completed(result)
            logger.info("Job [%s] completed successfully in %.2fs", job.job_id, result.elapsed_seconds)
        except asyncio.CancelledError:
            job.mark_cancelled()
            logger.warning("Job [%s] was cancelled during execution", job.job_id)
        except Exception as exc:
            logger.exception("Job [%s] failed with exception: %s", job.job_id, exc)
            job.mark_failed(str(exc))
        finally:
            self.tracker.stop_tracking(job.job_id)
            await self.repository.save(job)

    async def get_job(self, job_id: str) -> Job:
        """Retrieve job or raise NotFoundError."""
        job = await self.repository.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job", job_id)
        return job

    async def cancel_job(self, job_id: str) -> Job:
        """Mark an in-flight job as cancelled."""
        job = await self.get_job(job_id)
        if job.status in [JobStatus.PENDING, JobStatus.RUNNING]:
            job.mark_cancelled()
            self.tracker.stop_tracking(job_id)
            await self.repository.save(job)
            logger.info("Cancelled job [%s]", job_id)
        return job

    async def list_jobs(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[JobStatus] = None,
    ) -> List[Job]:
        """List jobs with pagination and status filters."""
        return await self.repository.list_jobs(skip=skip, limit=limit, status=status)
