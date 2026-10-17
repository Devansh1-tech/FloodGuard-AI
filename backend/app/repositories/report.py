"""
report.py — GeneratedReport Data Access Repository
==================================================

Handles queries and persistence for situation reports, impact assessments,
and analytical briefs generated per FloodEvent.
"""

from __future__ import annotations

import uuid
from typing import Any, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ReportType
from app.models.reports import GeneratedReport
from app.repositories.base import BaseRepository


class ReportRepository(BaseRepository[GeneratedReport, Any, Any]):
    """Repository handling GeneratedReport database persistence."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(model=GeneratedReport, session=session)

    async def get_reports_for_event(self, event_id: uuid.UUID) -> List[GeneratedReport]:
        """Fetch all reports generated for a given FloodEvent."""
        stmt = (
            select(GeneratedReport)
            .where(GeneratedReport.flood_event_id == event_id)
            .order_by(desc(GeneratedReport.created_at))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_type(
        self,
        event_id: uuid.UUID,
        report_type: ReportType,
    ) -> List[GeneratedReport]:
        """Fetch reports of a specific classification (e.g. SITUATION_REPORT)."""
        stmt = (
            select(GeneratedReport)
            .where(
                GeneratedReport.flood_event_id == event_id,
                GeneratedReport.report_type == report_type,
            )
            .order_by(desc(GeneratedReport.created_at))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_format(
        self,
        event_id: uuid.UUID,
        format_str: str,
    ) -> List[GeneratedReport]:
        """Fetch reports matching an export format (e.g. PDF, HTML, JSON)."""
        stmt = (
            select(GeneratedReport)
            .where(
                GeneratedReport.flood_event_id == event_id,
                GeneratedReport.format == format_str.upper(),
            )
            .order_by(desc(GeneratedReport.created_at))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
