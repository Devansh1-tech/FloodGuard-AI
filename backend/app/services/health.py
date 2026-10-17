"""
health.py — Comprehensive System Health Check Service
=====================================================

Probes all operational subsystems: database connection, pipeline engine availability,
Earth Engine project configuration, and storage backend status.
"""

from __future__ import annotations

import os
from typing import Dict

from app.services.base import BaseService
from app.schemas.health import ComponentHealth, HealthCheckResponse
from app.database.session import check_database_connection
from app.storage.local import LocalStorageEngine


class HealthService(BaseService):
    """
    Subsystem diagnostics and health aggregation service.
    """

    def __init__(self) -> None:
        super().__init__()
        self.storage = LocalStorageEngine()

    async def check_system_health(self) -> HealthCheckResponse:
        """
        Execute probes against all active platform subsystems.
        """
        components: Dict[str, ComponentHealth] = {}
        all_healthy = True

        # 1. Database Connection Probe
        db_ok, db_msg = await check_database_connection()
        components["database"] = ComponentHealth(
            status="healthy" if db_ok else "degraded",
            message=db_msg,
            details={"url_type": "sqlite" if self.settings.USE_SQLITE else "postgresql"},
        )
        if not db_ok and not self.settings.USE_SQLITE:
            all_healthy = False

        # 2. Pipeline Orchestrator Availability Probe
        pipeline_available = False
        try:
            import pipeline  # noqa: F401
            pipeline_available = True
        except ImportError:
            pass

        components["pipeline_engine"] = ComponentHealth(
            status="healthy" if pipeline_available else "unhealthy",
            message="Unified Pipeline Orchestrator available" if pipeline_available else "Pipeline package missing",
            details={"version": getattr(pipeline, "__version__", "unknown") if pipeline_available else None},
        )
        if not pipeline_available:
            all_healthy = False

        # 3. Google Earth Engine Configuration Probe
        ee_project = self.settings.EE_PROJECT_ID
        components["earth_engine"] = ComponentHealth(
            status="healthy" if ee_project else "degraded",
            message=f"Project configured: {ee_project}" if ee_project else "EE_PROJECT_ID not set",
            details={"project_id": ee_project},
        )

        # 4. Storage Subsystem Probe
        storage_ok, storage_msg = await self.storage.check_health()
        components["storage"] = ComponentHealth(
            status="healthy" if storage_ok else "unhealthy",
            message=storage_msg,
            details={"backend": self.settings.STORAGE_BACKEND, "root": self.settings.STORAGE_LOCAL_ROOT},
        )
        if not storage_ok:
            all_healthy = False

        overall_status = "healthy" if all_healthy else "degraded"

        return HealthCheckResponse(
            status=overall_status,
            application=self.settings.APP_NAME,
            version=self.settings.APP_VERSION,
            environment=self.settings.ENVIRONMENT,
            components=components,
        )
