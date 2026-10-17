"""
services.py — Service Layer Dependency Injection
=================================================

FastAPI dependency providers instantiating and injecting service layer
components with scoped database sessions and singletons into route controllers.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Optional

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.jobs.manager import JobManager
from app.services.artifact import ArtifactService
from app.services.configuration import ConfigurationService
from app.services.health import HealthService
from app.services.job import JobService
from app.services.pipeline import PipelineService
from app.services.report import ReportService
from app.services.storage import StorageService

# Shared in-memory JobManager instance for local runtime / task tracking
_job_manager: JobManager | None = None


def get_shared_job_manager() -> JobManager:
    """Retrieve or initialize the global shared JobManager."""
    global _job_manager
    if _job_manager is None:
        _job_manager = JobManager()
    return _job_manager


@lru_cache(maxsize=1)
def get_health_service() -> HealthService:
    """Dependency injecting HealthService."""
    return HealthService()


@lru_cache(maxsize=1)
def get_pipeline_service() -> PipelineService:
    """Dependency injecting PipelineService."""
    return PipelineService()


@lru_cache(maxsize=1)
def get_storage_service() -> StorageService:
    """Dependency injecting StorageService."""
    return StorageService()


def get_report_service(db: AsyncSession = Depends(get_db)) -> ReportService:
    """Dependency injecting ReportService with scoped database session."""
    return ReportService(session=db)


def get_artifact_service(db: AsyncSession = Depends(get_db)) -> ArtifactService:
    """Dependency injecting ArtifactService with scoped database session."""
    return ArtifactService(session=db)


def get_job_service(db: AsyncSession = Depends(get_db)) -> JobService:
    """Dependency injecting JobService backed by the shared JobManager and session."""
    return JobService(
        session=db,
        job_manager=get_shared_job_manager(),
        pipeline_service=get_pipeline_service(),
    )


def get_configuration_service(db: AsyncSession = Depends(get_db)) -> ConfigurationService:
    """Dependency injecting ConfigurationService with scoped database session."""
    return ConfigurationService(session=db)
