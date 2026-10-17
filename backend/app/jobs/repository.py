"""
repository.py — Job Persistence & State Store Interface
=======================================================

Provides decoupled persistence operations for background jobs.
Supports in-memory state caching with seamless future database persistence.
"""

from __future__ import annotations

import threading
from typing import Dict, List, Optional
from app.jobs.base import Job, JobStatus


class JobRepository:
    """
    Thread-safe repository managing background job records.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._jobs: Dict[str, Job] = {}

    async def save(self, job: Job) -> Job:
        """Create or update a job in the store."""
        with self._lock:
            self._jobs[job.job_id] = job
        return job

    async def get_by_id(self, job_id: str) -> Optional[Job]:
        """Retrieve a job by its unique ID."""
        with self._lock:
            return self._jobs.get(job_id)

    async def list_jobs(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[JobStatus] = None,
    ) -> List[Job]:
        """Retrieve a paginated list of jobs, optionally filtered by status."""
        with self._lock:
            jobs = list(self._jobs.values())

        if status:
            jobs = [j for j in jobs if j.status == status]

        # Sort descending by creation date
        jobs.sort(key=lambda x: x.created_at, reverse=True)
        return jobs[skip : skip + limit]

    async def delete(self, job_id: str) -> bool:
        """Remove a job record from the store."""
        with self._lock:
            return self._jobs.pop(job_id, None) is not None

    async def count(self, status: Optional[JobStatus] = None) -> int:
        """Count total jobs matching optional status filter."""
        with self._lock:
            if status:
                return sum(1 for j in self._jobs.values() if j.status == status)
            return len(self._jobs)
