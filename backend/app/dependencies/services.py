"""
services.py — Service Layer Dependency Injection
=================================================

FastAPI dependency providers instantiating and injecting service layer
singletons or instances into route controllers.
"""

from __future__ import annotations

from functools import lru_cache

from app.jobs.manager import JobManager
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
def get_report_service() -> ReportService:
    """Dependency injecting ReportService."""
    return ReportService()


@lru_cache(maxsize=1)
def get_storage_service() -> StorageService:
    """Dependency injecting StorageService."""
    return StorageService()


def get_job_service() -> JobService:
    """Dependency injecting JobService backed by the shared JobManager."""
    return JobService(job_manager=get_shared_job_manager())


@lru_cache(maxsize=1)
def get_configuration_service() -> ConfigurationService:
    """Dependency injecting ConfigurationService."""
    return ConfigurationService()
