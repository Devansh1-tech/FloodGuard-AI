"""
configuration.py — Centralized Configuration & System Metadata Service
======================================================================

Provides access to application configuration, geospatial analysis presets,
environment parameters, platform configuration, and system database statistics.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
import os
from pathlib import Path
import sys
from typing import Any, AsyncGenerator, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_async_session_maker
from app.models.flood_event import FloodEvent
from app.models.job import AnalysisJob
from app.models.reports import GeneratedArtifact, GeneratedReport
from app.models.user import User
from app.repositories.artifact import ArtifactRepository
from app.repositories.flood_event import FloodEventRepository
from app.repositories.job import JobRepository
from app.repositories.report import ReportRepository
from app.repositories.user import UserRepository
from app.schemas.system import SystemConfigurationResponse, SystemStatisticsResponse
from app.services.base import BaseService


class ConfigurationService(BaseService):
    """
    Coordinates access to system settings, feature flags, spatial presets,
    and platform statistics.
    """

    def __init__(self, session: Optional[AsyncSession] = None) -> None:
        super().__init__()
        self.session = session
        self.session_maker = get_async_session_maker()

    @asynccontextmanager
    async def _get_session(self) -> AsyncGenerator[AsyncSession, None]:
        if self.session is not None:
            yield self.session
        else:
            async with self.session_maker() as s:
                yield s

    def get_public_settings(self) -> Dict[str, Any]:
        """
        Return public, non-sensitive application settings.
        """
        storage_b = (
            self.settings.STORAGE_BACKEND.value
            if hasattr(self.settings.STORAGE_BACKEND, "value")
            else str(self.settings.STORAGE_BACKEND)
        )
        return {
            "app_name": self.settings.APP_NAME,
            "version": self.settings.APP_VERSION,
            "environment": self.settings.ENVIRONMENT,
            "debug": self.settings.DEBUG,
            "storage_backend": storage_b,
            "cors_origins": self.settings.cors_origins_list,
            "earth_engine_configured": bool(self.settings.EE_PROJECT_ID),
        }

    def get_platform_configuration(self) -> SystemConfigurationResponse:
        """
        Return formal platform architecture and subsystem configuration.
        """
        storage_b = (
            self.settings.STORAGE_BACKEND.value
            if hasattr(self.settings.STORAGE_BACKEND, "value")
            else str(self.settings.STORAGE_BACKEND)
        )
        db_url = getattr(self.settings, "database_url", "")
        db_type = "PostgreSQL" if "postgres" in db_url.lower() else "SQLite"

        return SystemConfigurationResponse(
            platform_version=self.settings.APP_VERSION,
            pipeline_version="1.0.0",
            earth_engine_project=self.settings.EE_PROJECT_ID or "flood-guard-ai",
            storage_backend=storage_b,
            database={
                "type": db_type,
                "status": "ONLINE",
                "pool_size": getattr(self.settings, "DATABASE_POOL_SIZE", 10),
            },
            environment=self.settings.ENVIRONMENT,
        )

    async def get_system_statistics(self) -> SystemStatisticsResponse:
        """
        Aggregate high-level platform usage, database records, storage footprint,
        and average execution metrics.
        """
        async with self._get_session() as session:
            user_repo = UserRepository(session)
            job_repo = JobRepository(session)
            flood_repo = FloodEventRepository(session)
            report_repo = ReportRepository(session)
            artifact_repo = ArtifactRepository(session)

            users_cnt = await user_repo.count()
            jobs_cnt = await job_repo.count()
            flood_cnt = await flood_repo.count()
            reports_cnt = await report_repo.count()
            artifacts_cnt = await artifact_repo.count()

            # Average execution duration for completed jobs
            stmt_avg = select(func.avg(AnalysisJob.duration)).where(AnalysisJob.duration.isnot(None))
            res_avg = await session.execute(stmt_avg)
            avg_duration = res_avg.scalar_one_or_none()
            avg_duration_float = round(float(avg_duration), 2) if avg_duration is not None else 0.0

            # Calculate storage footprint in bytes
            total_storage_bytes = 0
            storage_dir = Path(self.settings.STORAGE_LOCAL_ROOT)
            if storage_dir.exists():
                for root, _, files in os.walk(storage_dir):
                    for f in files:
                        try:
                            fp = os.path.join(root, f)
                            total_storage_bytes += os.path.getsize(fp)
                        except OSError:
                            pass

            return SystemStatisticsResponse(
                users_count=users_cnt,
                jobs_count=jobs_cnt,
                flood_events_count=flood_cnt,
                generated_reports_count=reports_cnt,
                generated_artifacts_count=artifacts_cnt,
                storage_usage_bytes=total_storage_bytes,
                average_execution_time_seconds=avg_duration_float,
            )

    def get_analysis_presets(self) -> Dict[str, Any]:
        """
        Return default AOI boundaries, supported regions, and default temporal windows.
        """
        return {
            "default_aoi": "nepal_terai_koshi",
            "supported_aois": [
                {
                    "id": "nepal_terai_koshi",
                    "name": "Koshi River Basin (Eastern Terai, Nepal)",
                    "type": "preset",
                    "description": "High-risk transboundary flood corridor along Koshi River",
                },
                {
                    "id": "nepal_terai_west_rapti",
                    "name": "West Rapti Basin (Mid-Western Terai, Nepal)",
                    "type": "preset",
                    "description": "Recurrent flash-flood and inundation plain",
                },
                {
                    "id": "custom_polygon",
                    "name": "Custom Polygon (GeoJSON)",
                    "type": "custom",
                    "description": "User-uploaded or interactive polygon geometry",
                },
            ],
            "default_date_ranges": {
                "monsoon_2024": {
                    "label": "2024 Nepal Monsoon Crisis",
                    "before": ["2024-06-01", "2024-06-30"],
                    "after": ["2024-09-15", "2024-10-15"],
                },
            },
            "sensor": {
                "name": "Sentinel-1 SAR C-band",
                "orbit_pass": "DESCENDING",
                "polarization": "VV, VH",
            },
        }

    def get_system_telemetry(self) -> Dict[str, Any]:
        """
        Return platform telemetry and runtime environment diagnostics.
        """
        return {
            "python_version": sys.version,
            "platform": sys.platform,
            "environment": self.settings.ENVIRONMENT,
            "max_job_workers": 4,
            "storage_root": self.settings.STORAGE_LOCAL_ROOT,
        }
