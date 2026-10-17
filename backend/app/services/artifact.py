"""
artifact.py — Deliverable Artifacts Management Service
======================================================

Coordinates access to generated spatial raster layers, GeoJSON vectors,
cartographic maps, CSV summaries, and audit metadata deliverables.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
import os
from typing import AsyncGenerator, Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.database.session import get_async_session_maker
from app.models.reports import GeneratedArtifact
from app.repositories.artifact import ArtifactRepository
from app.schemas.artifacts import ArtifactResponse
from app.services.base import BaseService


class ArtifactService(BaseService):
    """
    Service managing lookup and download access for analytical deliverables.
    """

    def __init__(
        self,
        artifact_repository: Optional[ArtifactRepository] = None,
        session: Optional[AsyncSession] = None,
    ) -> None:
        super().__init__()
        self.session = session
        self.artifact_repository = artifact_repository
        self.session_maker = get_async_session_maker()

    @asynccontextmanager
    async def _get_session(self) -> AsyncGenerator[AsyncSession, None]:
        if self.session is not None:
            yield self.session
        else:
            async with self.session_maker() as s:
                yield s

    async def get_artifact_metadata(self, artifact_id: str) -> ArtifactResponse:
        """
        Retrieve database metadata for a deliverable artifact.
        """
        try:
            target_uuid = uuid.UUID(artifact_id)
        except (ValueError, TypeError):
            raise NotFoundError("Artifact", artifact_id)

        async with self._get_session() as session:
            repo = self.artifact_repository or ArtifactRepository(session)
            artifact = await repo.get(target_uuid)
            if not artifact:
                raise NotFoundError("Artifact", artifact_id)

            return ArtifactResponse(
                id=str(artifact.id),
                flood_event_id=str(artifact.flood_event_id),
                artifact_type=artifact.artifact_type.value,
                file_path=artifact.file_path,
                file_size_bytes=artifact.file_size,
                checksum=artifact.checksum,
                download_url=f"/api/v1/artifacts/{artifact.id}/download",
                created_at=artifact.created_at.isoformat(),
            )

    async def get_artifact_file_path(self, artifact_id: str) -> str:
        """
        Resolve absolute file path and verify existence on disk.
        """
        try:
            target_uuid = uuid.UUID(artifact_id)
        except (ValueError, TypeError):
            raise NotFoundError("Artifact", artifact_id)

        async with self._get_session() as session:
            repo = self.artifact_repository or ArtifactRepository(session)
            artifact = await repo.get(target_uuid)
            if not artifact:
                raise NotFoundError("Artifact", artifact_id)

            path = artifact.file_path
            if not os.path.exists(path):
                raise NotFoundError("Artifact file on disk", path)

            return path
