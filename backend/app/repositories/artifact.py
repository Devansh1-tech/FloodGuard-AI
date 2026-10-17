"""
artifact.py — GeneratedArtifact Data Access Repository
======================================================

Handles persistence and lookup of spatial raster layers, GeoJSON polygons,
shapefiles, and cartographic deliverables.
"""

from __future__ import annotations

import uuid
from typing import Any, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ArtifactType
from app.models.reports import GeneratedArtifact
from app.repositories.base import BaseRepository


class ArtifactRepository(BaseRepository[GeneratedArtifact, Any, Any]):
    """Repository managing GeneratedArtifact records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(model=GeneratedArtifact, session=session)

    async def get_artifacts_for_event(self, event_id: uuid.UUID) -> List[GeneratedArtifact]:
        """Fetch all artifacts produced for a given FloodEvent."""
        stmt = (
            select(GeneratedArtifact)
            .where(GeneratedArtifact.flood_event_id == event_id)
            .order_by(desc(GeneratedArtifact.created_at))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_type(
        self,
        event_id: uuid.UUID,
        artifact_type: ArtifactType,
    ) -> List[GeneratedArtifact]:
        """Fetch artifacts of a specific deliverable category."""
        stmt = (
            select(GeneratedArtifact)
            .where(
                GeneratedArtifact.flood_event_id == event_id,
                GeneratedArtifact.artifact_type == artifact_type,
            )
            .order_by(desc(GeneratedArtifact.created_at))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_checksum(self, checksum: str) -> Optional[GeneratedArtifact]:
        """Lookup an artifact by its SHA-256 integrity checksum."""
        stmt = select(GeneratedArtifact).where(GeneratedArtifact.checksum == checksum)
        result = await self.session.execute(stmt)
        return result.scalars().first()
