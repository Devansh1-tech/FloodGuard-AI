"""
pipeline_run.py — Unified Pipeline Execution Run Entity
=======================================================

Records concrete executions of the unified processing pipeline, linking
orchestration metadata and stage versioning to downstream flood events.
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import Float, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.types import JSONType

if TYPE_CHECKING:
    from app.models.flood_event import FloodEvent
    from app.models.job import AnalysisJob


class PipelineRun(Base, UUIDMixin, TimestampMixin):
    """
    Direct representation of an individual pipeline execution cycle.
    """

    __tablename__ = "pipeline_runs"

    job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("analysis_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    execution_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    pipeline_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    stage2_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    stage3_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    execution_status: Mapped[str] = mapped_column(
        String(50),
        default="PENDING",
        index=True,
        nullable=False,
    )
    execution_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Elapsed execution seconds
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)

    # Relationships
    job: Mapped[AnalysisJob] = relationship("AnalysisJob", back_populates="pipeline_runs")
    flood_events: Mapped[List[FloodEvent]] = relationship(
        "FloodEvent",
        back_populates="pipeline_run",
        cascade="all, delete-orphan",
    )



    def __repr__(self) -> str:
        return f"<PipelineRun id={self.id} execution_id='{self.execution_id}' status='{self.execution_status}'>"
