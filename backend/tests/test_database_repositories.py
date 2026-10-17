"""
test_database_repositories.py — Repository Pattern Data Access Unit Tests
========================================================================
"""

import datetime
import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ArtifactType, DamageLevel, FloodSeverity, JobPriority, JobStatus, ReportType, UserRole, UserStatus
from app.models.flood_event import FloodEvent
from app.models.job import AnalysisJob
from app.models.pipeline_run import PipelineRun
from app.repositories.artifact import ArtifactRepository
from app.repositories.audit import AuditRepository
from app.repositories.configuration import ConfigurationRepository
from app.repositories.flood_event import FloodEventRepository
from app.repositories.job import JobRepository
from app.repositories.pipeline_run import PipelineRunRepository
from app.repositories.report import ReportRepository
from app.repositories.user import UserRepository
from app.security.passwords import hash_password


@pytest.mark.asyncio
async def test_user_repository(test_db_session: AsyncSession):
    """Verify UserRepository operations."""
    repo = UserRepository(test_db_session)

    # 1. Create
    email = f"user_{uuid.uuid4().hex[:6]}@ndrrma.gov.np"
    raw_pass = "SecurePass123!"
    hashed = hash_password(raw_pass)

    user = await repo.create(
        obj_in={
            "full_name": "Sita Dahal",
            "email": email,
            "password_hash": hashed,
            "role": UserRole.RESPONDER,
            "status": UserStatus.ACTIVE,
        }
    )
    assert user.id is not None
    assert user.email == email

    # 2. Get by email
    fetched = await repo.get_by_email(email)
    assert fetched is not None
    assert fetched.id == user.id

    # 3. Authenticate
    auth_user = await repo.authenticate(email, raw_pass)
    assert auth_user is not None
    assert auth_user.id == user.id

    # Invalid password authentication fails
    assert await repo.authenticate(email, "WrongPassword!") is None

    # 4. Update status
    updated = await repo.update_status(user.id, UserStatus.SUSPENDED)
    assert updated.status == UserStatus.SUSPENDED


@pytest.mark.asyncio
async def test_job_repository_operations(test_db_session: AsyncSession):
    """Verify JobRepository lifecycle transitions and queries."""
    repo = JobRepository(test_db_session)

    # 1. Create Job
    job = await repo.create(
        obj_in={
            "job_name": "Koshi Inundation Job",
            "status": JobStatus.PENDING,
            "priority": JobPriority.CRITICAL,
        }
    )
    assert job.id is not None
    assert job.status == JobStatus.PENDING

    # 2. Mark Started
    started_job = await repo.mark_started(job.id)
    assert started_job.status == JobStatus.RUNNING
    assert started_job.started_at is not None

    # 3. Update Progress
    progressed_job = await repo.update_progress(job.id, progress=65, current_stage="STAGE_3_IMPACT_ANALYSIS")
    assert progressed_job.progress == 65
    assert progressed_job.current_stage == "STAGE_3_IMPACT_ANALYSIS"

    # 4. Mark Completed
    completed_job = await repo.mark_completed(job.id, duration=18.5)
    assert completed_job.status == JobStatus.COMPLETED
    assert completed_job.progress == 100
    assert completed_job.duration == 18.5

    # 5. Query by status
    completed_list = await repo.get_by_status(JobStatus.COMPLETED)
    assert len(completed_list) >= 1


@pytest.mark.asyncio
async def test_pipeline_run_repository(test_db_session: AsyncSession):
    """Verify PipelineRunRepository operations."""
    job_repo = JobRepository(test_db_session)
    run_repo = PipelineRunRepository(test_db_session)

    job = await job_repo.create(obj_in={"job_name": "Pipeline Test Job"})
    exec_id = f"run_{uuid.uuid4().hex[:12]}"

    run = await run_repo.create(
        obj_in={
            "job_id": job.id,
            "execution_id": exec_id,
            "pipeline_version": "1.0.0",
            "stage2_version": "1.0.0",
            "stage3_version": "1.0.0",
            "execution_status": "SUCCESS",
            "execution_time": 25.4,
        }
    )
    assert run.id is not None

    # Get by execution_id
    by_exec = await run_repo.get_by_execution_id(exec_id)
    assert by_exec is not None
    assert by_exec.id == run.id

    # Get runs for job
    job_runs = await run_repo.get_runs_for_job(job.id)
    assert len(job_runs) == 1
    assert job_runs[0].id == run.id


@pytest.mark.asyncio
async def test_flood_event_repository_queries(test_db_session: AsyncSession):
    """Verify FloodEventRepository spatial queries and filtering."""
    job_repo = JobRepository(test_db_session)
    run_repo = PipelineRunRepository(test_db_session)
    event_repo = FloodEventRepository(test_db_session)

    job = await job_repo.create(obj_in={"job_name": "Spatial Search Job"})
    run = await run_repo.create(
        obj_in={
            "job_id": job.id,
            "execution_id": f"run_{uuid.uuid4().hex[:12]}",
            "pipeline_version": "1.0.0",
            "stage2_version": "1.0.0",
            "stage3_version": "1.0.0",
            "execution_status": "SUCCESS",
        }
    )

    # Create 2 events in different districts
    e1 = await event_repo.create(
        obj_in={
            "pipeline_run_id": run.id,
            "name": "Morang Severe Flood",
            "district": "Morang",
            "before_date": datetime.date(2024, 6, 1),
            "after_date": datetime.date(2024, 9, 20),
            "flood_area": 125.0,
            "severity": FloodSeverity.HIGH,
        }
    )
    e2 = await event_repo.create(
        obj_in={
            "pipeline_run_id": run.id,
            "name": "Jhapa Flash Flood",
            "district": "Jhapa",
            "before_date": datetime.date(2024, 7, 10),
            "after_date": datetime.date(2024, 8, 5),
            "flood_area": 45.0,
            "severity": FloodSeverity.MODERATE,
        }
    )

    # 1. Filter by district
    morang_events = await event_repo.find_by_district("Morang")
    assert len(morang_events) == 1
    assert morang_events[0].id == e1.id

    # 2. Filter by severity
    high_events = await event_repo.find_by_severity(FloodSeverity.HIGH)
    assert len(high_events) >= 1
    assert any(ev.id == e1.id for ev in high_events)

    # 3. Filter by date range
    window_events = await event_repo.find_by_date_range(
        datetime.date(2024, 7, 1),
        datetime.date(2024, 9, 30),
    )
    assert len(window_events) >= 1

    # 4. Filter by minimum area
    major_events = await event_repo.find_by_min_area(100.0)
    assert len(major_events) >= 1
    assert major_events[0].flood_area >= 100.0


@pytest.mark.asyncio
async def test_report_and_artifact_repositories(test_db_session: AsyncSession):
    """Verify ReportRepository and ArtifactRepository operations."""
    job_repo = JobRepository(test_db_session)
    run_repo = PipelineRunRepository(test_db_session)
    event_repo = FloodEventRepository(test_db_session)
    report_repo = ReportRepository(test_db_session)
    artifact_repo = ArtifactRepository(test_db_session)

    job = await job_repo.create(obj_in={"job_name": "Deliverables Job"})
    run = await run_repo.create(
        obj_in={
            "job_id": job.id,
            "execution_id": f"run_{uuid.uuid4().hex[:12]}",
            "pipeline_version": "1.0.0",
            "stage2_version": "1.0.0",
            "stage3_version": "1.0.0",
            "execution_status": "SUCCESS",
        }
    )
    event = await event_repo.create(
        obj_in={
            "pipeline_run_id": run.id,
            "name": "Koshi Basin Crisis",
            "before_date": datetime.date(2024, 6, 1),
            "after_date": datetime.date(2024, 9, 15),
        }
    )

    # 1. Report Repository
    rep1 = await report_repo.create(
        obj_in={
            "flood_event_id": event.id,
            "report_type": ReportType.SITUATION_REPORT,
            "report_path": "outputs/sitrep.json",
            "format": "JSON",
        }
    )
    rep2 = await report_repo.create(
        obj_in={
            "flood_event_id": event.id,
            "report_type": ReportType.IMPACT_ASSESSMENT,
            "report_path": "outputs/impact.pdf",
            "format": "PDF",
        }
    )

    event_reports = await report_repo.get_reports_for_event(event.id)
    assert len(event_reports) == 2

    pdf_reports = await report_repo.get_by_format(event.id, "PDF")
    assert len(pdf_reports) == 1
    assert pdf_reports[0].id == rep2.id

    # 2. Artifact Repository
    checksum = "a6c58971f11f42d71b569b936555be9a32c253d7ca96ee979bca1fe8d8d32f50"
    art = await artifact_repo.create(
        obj_in={
            "flood_event_id": event.id,
            "artifact_type": ArtifactType.FLOOD_MASK_GEOTIFF,
            "file_path": "outputs/flood_mask.tif",
            "file_size": 4194304,
            "checksum": checksum,
        }
    )
    assert art.id is not None

    by_check = await artifact_repo.get_by_checksum(checksum)
    assert by_check is not None
    assert by_check.id == art.id


@pytest.mark.asyncio
async def test_audit_and_configuration_repositories(test_db_session: AsyncSession):
    """Verify AuditRepository and ConfigurationRepository operations."""
    audit_repo = AuditRepository(test_db_session)
    config_repo = ConfigurationRepository(test_db_session)

    # 1. Audit Repository
    user_id = uuid.uuid4()
    entry = await audit_repo.log_action(
        action="TRIGGER_ANALYSIS",
        entity="AnalysisJob",
        entity_id="job-999",
        user_id=user_id,
        ip_address="192.168.1.10",
        details={"aoi": "nepal_terai_koshi"},
    )
    assert entry.id is not None

    user_trail = await audit_repo.get_user_audit_trail(user_id)
    assert len(user_trail) == 1
    assert user_trail[0].action == "TRIGGER_ANALYSIS"

    # 2. Configuration Repository
    cfg = await config_repo.set_value(
        key="detection.sar_threshold_db",
        value="-16.5",
        description="Sentinel-1 VV backscatter threshold in decibels",
    )
    assert cfg.key == "detection.sar_threshold_db"
    assert cfg.value == "-16.5"

    fetched_cfg = await config_repo.get_by_key("detection.sar_threshold_db")
    assert fetched_cfg is not None
    assert fetched_cfg.value == "-16.5"

    all_configs = await config_repo.get_all_as_dict()
    assert "detection.sar_threshold_db" in all_configs
    assert all_configs["detection.sar_threshold_db"] == "-16.5"
