"""
base.py — Background Job Models & Status Enums
==============================================

Defines execution lifecycle states, job priority classifications, and
result payloads for asynchronous disaster analysis tasks.
"""

from __future__ import annotations

import datetime
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional


class JobStatus(str, Enum):
    """Lifecycle states for background asynchronous jobs."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class JobPriority(str, Enum):
    """Execution priority levels for task queues."""
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class JobResult:
    """Outcome payload generated upon job completion."""
    success: bool
    data: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    elapsed_seconds: float = 0.0


@dataclass
class Job:
    """
    Representation of an asynchronous analytical or background task.
    """
    job_type: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    job_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    priority: JobPriority = JobPriority.NORMAL
    status: JobStatus = JobStatus.PENDING
    progress_percent: int = 0
    message: str = "Job queued"
    created_at: datetime.datetime = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc))
    started_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None
    result: Optional[JobResult] = None
    error: Optional[str] = None

    def mark_started(self) -> None:
        """Transition job status to RUNNING."""
        self.status = JobStatus.RUNNING
        self.started_at = datetime.datetime.now(datetime.timezone.utc)
        self.message = "Job execution in progress"

    def mark_completed(self, result: JobResult) -> None:
        """Transition job status to COMPLETED."""
        self.status = JobStatus.COMPLETED
        self.completed_at = datetime.datetime.now(datetime.timezone.utc)
        self.progress_percent = 100
        self.result = result
        self.message = "Job completed successfully"

    def mark_failed(self, error: str) -> None:
        """Transition job status to FAILED."""
        self.status = JobStatus.FAILED
        self.completed_at = datetime.datetime.now(datetime.timezone.utc)
        self.error = error
        self.message = f"Job failed: {error}"

    def mark_cancelled(self) -> None:
        """Transition job status to CANCELLED."""
        self.status = JobStatus.CANCELLED
        self.completed_at = datetime.datetime.now(datetime.timezone.utc)
        self.message = "Job was cancelled by user or system"
