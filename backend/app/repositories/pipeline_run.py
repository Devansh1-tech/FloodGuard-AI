"""
pipeline_run.py — PipelineRun Entity Data Access Repository
===========================================================

Provides queries and persistence for PipelineRun execution cycles, stage telemetry,
and associated disaster flood events.
"""

from __future__ import annotations

import uuid
from typing import Any, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.pipeline_run import PipelineRun
from app.repositories.base import BaseRepository


class PipelineRunRepository(BaseRepository[PipelineRun, Any, Any]):
    """Repository handling PipelineRun database operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(model=PipelineRun, session=session)

    async def get_by_execution_id(self, execution_id: str) -> Optional[PipelineRun]:
        """Fetch pipeline run by unique orchestrator execution ID."""
        stmt = select(PipelineRun).where(PipelineRun.execution_id == execution_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_runs_for_job(self, job_id: uuid.UUID) -> List[PipelineRun]:
        """Fetch all pipeline runs associated with a parent AnalysisJob."""
        stmt = (
            select(PipelineRun)
            .where(PipelineRun.job_id == job_id)
            .order_by(desc(PipelineRun.created_at))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_with_flood_events(self, run_id: uuid.UUID) -> Optional[PipelineRun]:
        """Fetch pipeline run with eagerly loaded child FloodEvents."""
        stmt = (
            select(PipelineRun)
            .where(PipelineRun.id == run_id)
            .options(selectinload(PipelineRun.flood_events))
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()
