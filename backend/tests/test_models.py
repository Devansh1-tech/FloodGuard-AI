"""
test_models.py — SQLAlchemy 2.x Domain Model & Enum Unit Tests
=============================================================
"""

import datetime
import uuid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.enums import (
    ArtifactType,
    DamageLevel,
    FloodSeverity,
    InfrastructureType,
    JobPriority,
    JobStatus,
    ReportType,
    UserRole,
    UserStatus,
)
from app.models.flood_event import FloodEvent
from app.models.impact import AffectedBuilding, AffectedInfrastructure, AffectedRoad
from app.models.job import AnalysisJob
from app.models.pipeline_run import PipelineRun
from app.models.reports import GeneratedArtifact, GeneratedReport
from app.models.statistics import DisasterStatistics, PopulationStatistics
from app.models.system import SystemConfiguration
from app.models.user import User


@pytest.mark.asyncio
async def test_user_model_creation(test_db_session: AsyncSession):
    """Verify User entity creation, UUID generation, and default fields."""
    user = User(
        full_name="Pramod Shrestha",
        email="pramod@ndrrma.gov.np",
        password_hash="$2b$12$e8x...",
        role=UserRole.ANALYST,
        organization="Nepal NDRRMA",
        phone="+977-9800000000",
        status=UserStatus.ACTIVE,
    )
    test_db_session.add(user)
    await test_db_session.commit()
    await test_db_session.refresh(user)

    assert isinstance(user.id, uuid.UUID)
    assert user.email == "pramod@ndrrma.gov.np"
    assert user.role == UserRole.ANALYST
    assert user.status == UserStatus.ACTIVE
    assert user.created_at is not None
    assert user.updated_at is not None


@pytest.mark.asyncio
async def test_analysis_job_and_pipeline_run_creation(test_db_session: AsyncSession):
    """Verify AnalysisJob and PipelineRun entities."""
    job = AnalysisJob(
        job_name="Koshi Terai Monsoon Run",
        status=JobStatus.RUNNING,
        priority=JobPriority.HIGH,
        pipeline_version="1.0.0",
        current_stage="STAGE_2_FLOOD_DETECTION",
        progress=45,
        parameters={"aoi": "nepal_terai_koshi"},
    )
    test_db_session.add(job)
    await test_db_session.commit()
    await test_db_session.refresh(job)

    assert isinstance(job.id, uuid.UUID)
    assert job.status == JobStatus.RUNNING
    assert job.progress == 45

    run = PipelineRun(
        job_id=job.id,
        execution_id=f"run_{uuid.uuid4().hex[:12]}",
        pipeline_version="1.0.0",
        stage2_version="1.0.0",
        stage3_version="1.0.0",
        execution_status="RUNNING",
        metadata_json={"aoi_preset": "nepal_terai_koshi"},
    )
    test_db_session.add(run)
    await test_db_session.commit()
    await test_db_session.refresh(run)

    assert isinstance(run.id, uuid.UUID)
    assert run.job_id == job.id


@pytest.mark.asyncio
async def test_flood_event_and_impact_models(test_db_session: AsyncSession):
    """Verify FloodEvent and associated impact models (Buildings, Roads, Infrastructure)."""
    # 1. Job & Run parents
    job = AnalysisJob(job_name="Impact Test Job", status=JobStatus.COMPLETED)
    test_db_session.add(job)
    await test_db_session.commit()

    run = PipelineRun(
        job_id=job.id,
        execution_id=f"run_{uuid.uuid4().hex[:12]}",
        execution_status="SUCCESS",
        execution_time=32.4,
    )
    test_db_session.add(run)
    await test_db_session.commit()

    # 2. Flood Event
    event = FloodEvent(
        pipeline_run_id=run.id,
        name="2024 Koshi Basin Inundation",
        country="Nepal",
        state="Koshi Province",
        district="Sunsari",
        municipality="Barahakshetra",
        before_date=datetime.date(2024, 6, 1),
        after_date=datetime.date(2024, 9, 28),
        flood_area=148.5,
        severity=FloodSeverity.HIGH,
        geometry="MULTIPOLYGON(((87.0 26.5, 87.2 26.5, 87.2 26.7, 87.0 26.7, 87.0 26.5)))",
    )
    test_db_session.add(event)
    await test_db_session.commit()
    await test_db_session.refresh(event)

    assert isinstance(event.id, uuid.UUID)
    assert event.flood_area == 148.5

    # 3. Affected Building
    bldg = AffectedBuilding(
        flood_event_id=event.id,
        building_type="residential",
        building_area=120.5,
        damage_level=DamageLevel.SEVERE,
        water_depth_estimated_m=1.2,
    )
    # 4. Affected Road
    road = AffectedRoad(
        flood_event_id=event.id,
        road_type="primary",
        road_name="East-West Highway (Mahendra Highway)",
        road_length=4.8,
        damage_level=DamageLevel.MODERATE,
    )
    # 5. Affected Infrastructure (Hospital)
    hospital = AffectedInfrastructure(
        flood_event_id=event.id,
        infrastructure_type=InfrastructureType.HOSPITAL,
        name="Sunsari District Hospital",
        hospital=True,
        status="INACCESSIBLE",
    )
    test_db_session.add_all([bldg, road, hospital])
    await test_db_session.commit()

    assert bldg.id is not None
    assert road.id is not None
    assert hospital.id is not None
    assert hospital.hospital is True


@pytest.mark.asyncio
async def test_statistics_and_reports_models(test_db_session: AsyncSession):
    """Verify PopulationStatistics, DisasterStatistics, Reports, and Artifacts."""
    job = AnalysisJob(job_name="Stats Test Job")
    test_db_session.add(job)
    await test_db_session.commit()

    run = PipelineRun(job_id=job.id, execution_id=f"run_{uuid.uuid4().hex[:12]}", execution_status="SUCCESS")
    test_db_session.add(run)
    await test_db_session.commit()

    event = FloodEvent(
        pipeline_run_id=run.id,
        name="West Rapti Flood Event",
        district="Banke",
        before_date=datetime.date(2024, 7, 1),
        after_date=datetime.date(2024, 8, 15),
        flood_area=88.2,
    )
    test_db_session.add(event)
    await test_db_session.commit()

    # 1. Population Statistics (1-to-1)
    pop_stats = PopulationStatistics(
        flood_event_id=event.id,
        population=14500,
        households=2900,
        children=3200,
        women=7400,
        elderly=1500,
        density=164.4,
    )
    # 2. Disaster Statistics (1-to-1)
    disaster_stats = DisasterStatistics(
        flood_event_id=event.id,
        flood_area=88.2,
        affected_buildings=1240,
        affected_roads=18.6,
        affected_population=14500,
        disaster_severity_index=72.5,
    )
    # 3. Generated Report
    report = GeneratedReport(
        flood_event_id=event.id,
        report_type=ReportType.SITUATION_REPORT,
        report_path="outputs/reports/sitrep.json",
        format="JSON",
    )
    # 4. Generated Artifact
    artifact = GeneratedArtifact(
        flood_event_id=event.id,
        artifact_type=ArtifactType.FLOOD_POLYGON_GEOJSON,
        file_path="outputs/geojson/flood_extent.geojson",
        file_size=2048560,
        checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
    test_db_session.add_all([pop_stats, disaster_stats, report, artifact])
    await test_db_session.commit()

    assert pop_stats.population == 14500
    assert disaster_stats.disaster_severity_index == 72.5
    assert report.report_type == ReportType.SITUATION_REPORT
    assert artifact.artifact_type == ArtifactType.FLOOD_POLYGON_GEOJSON


@pytest.mark.asyncio
async def test_system_config_and_audit_log(test_db_session: AsyncSession):
    """Verify SystemConfiguration and AuditLog records."""
    config = SystemConfiguration(
        key="spatial.max_aoi_sqkm",
        value="50000",
        description="Maximum permissible AOI size in square kilometers",
    )
    audit = AuditLog(
        action="UPDATE_CONFIG",
        entity="SystemConfiguration",
        entity_id="spatial.max_aoi_sqkm",
        ip_address="127.0.0.1",
        user_agent="Mozilla/5.0",
        details={"previous": "25000", "new": "50000"},
    )
    test_db_session.add_all([config, audit])
    await test_db_session.commit()

    assert config.id is not None
    assert config.key == "spatial.max_aoi_sqkm"
    assert audit.id is not None
    assert audit.action == "UPDATE_CONFIG"
