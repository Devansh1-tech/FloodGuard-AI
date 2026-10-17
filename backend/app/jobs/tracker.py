"""
tracker.py — Thread-Safe Background Execution Tracker
=====================================================

Monitors active in-flight jobs, progress milestones, and step telemetry.
"""

from __future__ import annotations

import threading
from typing import Dict, Any, Optional, List


class ExecutionTracker:
    """
    Thread-safe in-memory state tracker for in-flight tasks.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._active_jobs: Dict[str, Dict[str, Any]] = {}

    def start_tracking(self, job_id: str, job_type: str) -> None:
        """Register a new job in the tracker."""
        with self._lock:
            self._active_jobs[job_id] = {
                "job_id": job_id,
                "job_type": job_type,
                "progress_percent": 0,
                "current_step": "INITIALIZING",
                "message": "Task queued for execution",
                "steps_completed": [],
            }

    def update_progress(
        self,
        job_id: str,
        percentage: int,
        message: str = "",
        current_step: Optional[str] = None,
    ) -> None:
        """Update percentage and message for an active job."""
        with self._lock:
            if job_id in self._active_jobs:
                record = self._active_jobs[job_id]
                record["progress_percent"] = max(0, min(100, percentage))
                if message:
                    record["message"] = message
                if current_step:
                    record["current_step"] = current_step
                    if current_step not in record["steps_completed"]:
                        record["steps_completed"].append(current_step)

    def get_progress(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve the current progress snapshot for a job."""
        with self._lock:
            if job_id in self._active_jobs:
                return dict(self._active_jobs[job_id])
            return None

    def stop_tracking(self, job_id: str) -> None:
        """Deregister a completed or failed job."""
        with self._lock:
            self._active_jobs.pop(job_id, None)

    def is_active(self, job_id: str) -> bool:
        """Check if a job is currently active."""
        with self._lock:
            return job_id in self._active_jobs

    def get_active_count(self) -> int:
        """Return the count of active in-flight jobs."""
        with self._lock:
            return len(self._active_jobs)

    def get_job_stats(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Return key execution statistics for a job."""
        info = self.get_progress(job_id)
        if not info:
            return None
        return {
            "job_id": info["job_id"],
            "progress": info["progress_percent"],
            "message": info["message"],
            "current_step": info["current_step"],
        }

    def list_active(self) -> List[Dict[str, Any]]:
        """List snapshots of all currently running tasks."""
        with self._lock:
            return [dict(v) for v in self._active_jobs.values()]
