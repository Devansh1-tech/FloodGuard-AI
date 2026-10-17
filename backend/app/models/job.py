"""
job.py — Analysis Job Execution Entity
======================================

Root processing entity orchestrating disaster analysis workflows, job progress,
execution states, and downstream pipeline runs.
"""

from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import DateTime, Enum as SQLEnum, Float, ForeignKey, Index, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import JobPriority, JobStatus
from app.models.types import JSONType

if TYPE_CHECKING:
    from app.models.pipeline_run import PipelineRun
    from app.models.user import User


class AnalysisJob(Base, UUIDMixin, TimestampMixin):
    """
    Root lifecycle entity for flood detection & settlement impact requests.
    """

    __tablename__ = "analysis_jobs"

    job_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus, native_enum=False),
        default=JobStatus.PENDING,
        index=True,
        nullable=False,
    )
    priority: Mapped[JobPriority] = mapped_column(
        SQLEnum(JobPriority, native_enum=False),
        default=JobPriority.NORMAL,
        index=True,
        nullable=False,
    )
    started_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    duration: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Duration in seconds
    created_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Optional reference to registered user
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    pipeline_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    current_stage: Mapped[str] = mapped_column(String(50), default="QUEUED", nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Input execution parameters (AOI, temporal date bounds, thresholds)
    parameters: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)

    # Relationships
    user: Mapped[Optional[User]] = relationship("User", back_populates="analysis_jobs")
    pipeline_runs: Mapped[List[PipelineRun]] = relationship(
        "PipelineRun",
        back_populates="job",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_analysis_jobs_status_priority", "status", "priority"),
        Index("ix_analysis_jobs_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<AnalysisJob id={self.id} name='{self.job_name}' status={self.status}>"
