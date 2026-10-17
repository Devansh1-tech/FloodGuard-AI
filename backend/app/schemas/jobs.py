"""
jobs.py — Background Job Request & Response Schemas
===================================================
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.enums import JobPriority, JobStatus


class JobCreateRequest(BaseModel):
    """Schema for requesting a new background job."""

    job_type: str = Field(description="Identifier of task to execute, e.g. 'pipeline_analysis'")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Task execution arguments")
    priority: JobPriority = Field(default=JobPriority.NORMAL, description="Scheduling priority")


class JobStatusDetailResponse(BaseModel):
    """Live execution telemetry snapshot for an AnalysisJob."""

    job_id: str
    job_name: str
    status: JobStatus
    priority: JobPriority
    current_stage: str
    progress: int
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    execution_time_seconds: Optional[float] = None
    warnings: List[str] = Field(default_factory=list)
    errors: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    created_at: str


class JobResponse(BaseModel):
    """Full detail of a background job."""

    job_id: str
    job_type: str
    status: JobStatus
    priority: JobPriority
    progress_percent: int
    message: str
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class JobStatusResponse(BaseModel):
    """Lightweight polling snapshot for a background job."""

    job_id: str
    status: JobStatus
    progress_percent: int
    message: str
