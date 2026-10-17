"""
flood_event.py — FloodEvent Geospatial Entity Repository
========================================================

Provides persistence, spatial boundary queries, administrative filtering,
and complete relationship aggregation for FloodEvent entities.
"""

from __future__ import annotations

import datetime
import uuid
from typing import Any, List, Optional
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import FloodSeverity
from app.models.flood_event import FloodEvent
from app.repositories.base import BaseRepository


class FloodEventRepository(BaseRepository[FloodEvent, Any, Any]):
    """Geospatial repository for FloodEvent persistence and spatial analytics."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(model=FloodEvent, session=session)

    async def get_with_full_details(self, event_id: uuid.UUID) -> Optional[FloodEvent]:
        """
        Fetch FloodEvent with eagerly loaded children: impact assets, demographics,
        disaster statistics, reports, and generated artifacts.
        """
        stmt = (
            select(FloodEvent)
            .where(FloodEvent.id == event_id)
            .options(
                selectinload(FloodEvent.affected_buildings),
                selectinload(FloodEvent.affected_roads),
                selectinload(FloodEvent.affected_infrastructure),
                selectinload(FloodEvent.population_statistics),
                selectinload(FloodEvent.disaster_statistics),
                selectinload(FloodEvent.reports),
                selectinload(FloodEvent.artifacts),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def find_by_district(
        self,
        district: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[FloodEvent]:
        """Filter events occurring within an administrative district."""
        stmt = (
            select(FloodEvent)
            .where(func.lower(FloodEvent.district) == district.strip().lower())
            .order_by(desc(FloodEvent.after_date))
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def find_by_severity(
        self,
        severity: FloodSeverity,
        skip: int = 0,
        limit: int = 50,
    ) -> List[FloodEvent]:
        """Filter events by disaster severity classification."""
        stmt = (
            select(FloodEvent)
            .where(FloodEvent.severity == severity)
            .order_by(desc(FloodEvent.flood_area))
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def find_recent_events(self, limit: int = 10) -> List[FloodEvent]:
        """Retrieve most recent flood events ordered by crisis window date."""
        stmt = (
            select(FloodEvent)
            .order_by(desc(FloodEvent.after_date))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def find_by_date_range(
        self,
        start_date: datetime.date,
        end_date: datetime.date,
    ) -> List[FloodEvent]:
        """Query flood events overlapping a specific temporal crisis window."""
        stmt = (
            select(FloodEvent)
            .where(
                FloodEvent.after_date >= start_date,
                FloodEvent.before_date <= end_date,
            )
            .order_by(desc(FloodEvent.after_date))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def find_by_min_area(self, min_area_km2: float) -> List[FloodEvent]:
        """Query major inundations exceeding a specified area threshold."""
        stmt = (
            select(FloodEvent)
            .where(FloodEvent.flood_area >= min_area_km2)
            .order_by(desc(FloodEvent.flood_area))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
