"""
test_services.py — Service Layer Unit Tests
===========================================
"""

import tempfile
from pathlib import Path
import pytest

from app.config.settings import Settings
from app.jobs.base import JobPriority, JobStatus
from app.jobs.manager import JobManager
from app.schemas.analysis import AnalysisTriggerRequest
from app.services.configuration import ConfigurationService
from app.services.health import HealthService
from app.services.job import JobService
from app.services.pipeline import PipelineService
from app.services.report import ReportService
from app.services.storage import StorageService
from app.storage.local import LocalStorageEngine


@pytest.mark.asyncio
async def test_health_service_probes(test_settings: Settings):
    """Verify HealthService probes all 4 subsystems."""
    service = HealthService()
    health = await service.check_system_health()

    assert health.application == test_settings.APP_NAME
    assert health.version == test_settings.APP_VERSION
    assert health.status in ["healthy", "degraded"]
    assert "database" in health.components
    assert "pipeline_engine" in health.components
    assert "earth_engine" in health.components
    assert "storage" in health.components


def test_pipeline_service_wrapper():
    """Verify PipelineService engine inspection."""
    service = PipelineService()
    # Checks if pipeline module is available in environment
    is_available = service.is_engine_available()
    assert isinstance(is_available, bool)


@pytest.mark.asyncio
async def test_storage_service_operations():
    """Verify StorageService file save, read, and existence checks."""
    with tempfile.TemporaryDirectory() as tmpdir:
        engine = LocalStorageEngine(root_path=tmpdir)
        service = StorageService(engine=engine)

        # 1. Save
        rel_path = "subfolder/test_artifact.txt"
        saved_path = await service.save_file(rel_path, b"Sentinel-1 SAR Data")
        assert "subfolder" in saved_path

        # 2. Exists
        exists = await service.file_exists(rel_path)
        assert exists is True

        # 3. Read
        data = await service.read_file(rel_path)
        assert data == b"Sentinel-1 SAR Data"

        # 4. URL
        url = service.get_download_url(rel_path)
        assert "subfolder/test_artifact.txt" in url


@pytest.mark.asyncio
async def test_job_service_orchestration():
    """Verify JobService submits, queries, lists, and cancels jobs."""
    manager = JobManager()
    service = JobService(job_manager=manager)

    # 1. Submit analysis job
    req = AnalysisTriggerRequest(
        aoi="nepal_terai_koshi",
        before_start="2024-06-01",
        before_end="2024-06-30",
        after_start="2024-09-15",
        after_end="2024-10-15",
    )
    job = await service.submit_analysis_job(req)
    assert job.job_id is not None
    assert job.status == JobStatus.PENDING
    assert job.priority == JobPriority.HIGH

    # 2. Get job
    fetched = await service.get_job(job.job_id)
    assert fetched.job_id == job.job_id

    # 3. Get status
    status_info = await service.get_job_status(job.job_id)
    assert status_info.status == JobStatus.PENDING

    # 4. List jobs
    all_jobs = await service.list_jobs()
    assert len(all_jobs) >= 1

    # 5. Cancel job
    cancelled = await service.cancel_job(job.job_id)
    assert cancelled.status == JobStatus.CANCELLED


def test_configuration_service():
    """Verify ConfigurationService returns sanitized settings and presets."""
    service = ConfigurationService()

    public_settings = service.get_public_settings()
    assert "app_name" in public_settings
    assert "SECRET_KEY" not in public_settings

    presets = service.get_analysis_presets()
    assert "default_aoi" in presets
    assert presets["default_aoi"] == "nepal_terai_koshi"
    assert len(presets["supported_aois"]) >= 2

    telemetry = service.get_system_telemetry()
    assert "python_version" in telemetry
    assert "environment" in telemetry
