"""
report.py — Disaster Reporting & Analytics Service
==================================================

Coordinates access to generated disaster reports, metadata inspection,
file downloads, and analytical summaries produced by pipeline runs.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
import json
import os
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.database.session import get_async_session_maker
from app.models.reports import GeneratedReport
from app.repositories.report import ReportRepository
from app.schemas.reports import ReportResponse
from app.services.base import BaseService


class ReportService(BaseService):
    """
    Service managing retrieval and formatting of disaster reports.
    """

    def __init__(
        self,
        report_repository: Optional[ReportRepository] = None,
        session: Optional[AsyncSession] = None,
    ) -> None:
        super().__init__()
        self.session = session
        self.report_repository = report_repository
        self.session_maker = get_async_session_maker()

    @asynccontextmanager
    async def _get_session(self) -> AsyncGenerator[AsyncSession, None]:
        if self.session is not None:
            yield self.session
        else:
            async with self.session_maker() as s:
                yield s

    async def get_report_metadata(self, report_id: str) -> ReportResponse:
        """
        Retrieve database metadata for a specific disaster report by ID.
        """
        try:
            target_uuid = uuid.UUID(report_id)
        except (ValueError, TypeError):
            raise NotFoundError("Report", report_id)

        async with self._get_session() as session:
            repo = self.report_repository or ReportRepository(session)
            report = await repo.get(target_uuid)
            if not report:
                raise NotFoundError("Report", report_id)

            return ReportResponse(
                id=str(report.id),
                flood_event_id=str(report.flood_event_id),
                report_type=report.report_type.value,
                format=report.format,
                report_path=report.report_path,
                download_url=f"/api/v1/reports/{report.id}/download",
                created_at=report.created_at.isoformat(),
            )

    async def get_report_file_path(self, report_id: str) -> str:
        """
        Resolve absolute local filesystem path for a generated report deliverable.
        """
        try:
            target_uuid = uuid.UUID(report_id)
        except (ValueError, TypeError):
            raise NotFoundError("Report", report_id)

        async with self._get_session() as session:
            repo = self.report_repository or ReportRepository(session)
            report = await repo.get(target_uuid)
            if not report:
                raise NotFoundError("Report", report_id)

            path = report.report_path
            if not os.path.exists(path):
                raise NotFoundError("Report file on disk", path)

            return path

    async def get_report_by_run_id(self, run_id: str, report_type: str = "ImpactReport") -> Dict[str, Any]:
        """
        Fetch a parsed JSON report from an execution directory (backward-compatibility).
        """
        root = Path(self.settings.STORAGE_LOCAL_ROOT)
        report_file = root / run_id / "reports" / f"{report_type}.json"

        if not report_file.exists():
            raise NotFoundError("Report", f"{run_id}/{report_type}")

        with open(report_file, "r", encoding="utf-8") as f:
            return json.load(f)

    async def list_available_reports(self, run_id: str) -> List[str]:
        """List all report names available in an execution directory."""
        root = Path(self.settings.STORAGE_LOCAL_ROOT)
        reports_dir = root / run_id / "reports"

        if not reports_dir.exists():
            return []

        return [f.name for f in reports_dir.glob("*.json")]
