"""
test_relationships_and_cascades.py — ORM Relationship & Cascade Integrity Tests
================================================================================
"""

import datetime
import uuid
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import ArtifactType, DamageLevel, FloodSeverity, InfrastructureType, JobStatus, ReportType, UserRole
from app.models.flood_event import FloodEvent
from app.models.impact import AffectedBuilding, AffectedInfrastructure, AffectedRoad
from app.models.job import AnalysisJob
from app.models.pipeline_run import PipelineRun
from app.models.reports import GeneratedArtifact, GeneratedReport
from app.models.statistics import DisasterStatistics, PopulationStatistics
from app.models.user import User


@pytest.mark.asyncio
async def test_full_hierarchy_traversal(test_db_session: AsyncSession):
    """
    Verify complete relational traversal:
    User -> AnalysisJob -> PipelineRun -> FloodEvent -> (Buildings, Roads, Infrastructure, Statistics, Reports, Artifacts)
    """
    # 1. Create User
    user = User(
        full_name="Disaster Analyst",
        email=f"analyst_{uuid.uuid4().hex[:6]}@ndrrma.gov.np",
        password_hash="secret_hash",
        role=UserRole.ANALYST,
    )
    test_db_session.add(user)
    await test_db_session.flush()

    # 2. Create Job attached to User
    job = AnalysisJob(
        job_name="Eastern Terai Rapid Assessment",
        user_id=user.id,
        status=JobStatus.COMPLETED,
    )
    test_db_session.add(job)
    await test_db_session.flush()

    # 3. Create PipelineRun attached to Job
    run = PipelineRun(
        job_id=job.id,
        execution_id=f"run_{uuid.uuid4().hex[:12]}",
        execution_status="SUCCESS",
        execution_time=45.2,
    )
    test_db_session.add(run)
    await test_db_session.flush()

    # 4. Create FloodEvent attached to PipelineRun
    event = FloodEvent(
        pipeline_run_id=run.id,
        name="Koshi Inundation September 2024",
        country="Nepal",
        district="Sunsari",
        before_date=datetime.date(2024, 6, 1),
        after_date=datetime.date(2024, 9, 30),
        flood_area=210.4,
        severity=FloodSeverity.CRITICAL,
    )
    test_db_session.add(event)
    await test_db_session.flush()

    # 5. Attach children to FloodEvent
    bldg = AffectedBuilding(flood_event_id=event.id, building_type="residential", damage_level=DamageLevel.SEVERE)
    road = AffectedRoad(flood_event_id=event.id, road_type="secondary", road_length=3.5, damage_level=DamageLevel.MODERATE)
    infra = AffectedInfrastructure(flood_event_id=event.id, infrastructure_type=InfrastructureType.SCHOOL, name="Primary School", school=True)
    pop_stats = PopulationStatistics(flood_event_id=event.id, population=5200, households=1050)
    disaster_stats = DisasterStatistics(flood_event_id=event.id, flood_area=210.4, disaster_severity_index=85.0)
    rep = GeneratedReport(flood_event_id=event.id, report_type=ReportType.EXECUTIVE_BRIEF, report_path="report.pdf", format="PDF")
    art = GeneratedArtifact(flood_event_id=event.id, artifact_type=ArtifactType.FLOOD_MASK_GEOTIFF, file_path="mask.tif")

    test_db_session.add_all([bldg, road, infra, pop_stats, disaster_stats, rep, art])
    await test_db_session.commit()

    # 6. Eager query from the root User
    stmt = (
        select(User)
        .where(User.id == user.id)
        .options(
            selectinload(User.analysis_jobs)
            .selectinload(AnalysisJob.pipeline_runs)
            .selectinload(PipelineRun.flood_events)
            .selectinload(FloodEvent.affected_buildings),
            selectinload(User.analysis_jobs)
            .selectinload(AnalysisJob.pipeline_runs)
            .selectinload(PipelineRun.flood_events)
            .selectinload(FloodEvent.affected_roads),
            selectinload(User.analysis_jobs)
            .selectinload(AnalysisJob.pipeline_runs)
            .selectinload(PipelineRun.flood_events)
            .selectinload(FloodEvent.affected_infrastructure),
            selectinload(User.analysis_jobs)
            .selectinload(AnalysisJob.pipeline_runs)
            .selectinload(PipelineRun.flood_events)
            .selectinload(FloodEvent.population_statistics),
            selectinload(User.analysis_jobs)
            .selectinload(AnalysisJob.pipeline_runs)
            .selectinload(PipelineRun.flood_events)
            .selectinload(FloodEvent.disaster_statistics),
            selectinload(User.analysis_jobs)
            .selectinload(AnalysisJob.pipeline_runs)
            .selectinload(PipelineRun.flood_events)
            .selectinload(FloodEvent.reports),
            selectinload(User.analysis_jobs)
            .selectinload(AnalysisJob.pipeline_runs)
            .selectinload(PipelineRun.flood_events)
            .selectinload(FloodEvent.artifacts),
        )
    )
    result = await test_db_session.execute(stmt)
    loaded_user = result.scalars().first()

    assert loaded_user is not None
    assert len(loaded_user.analysis_jobs) == 1
    loaded_job = loaded_user.analysis_jobs[0]
    assert len(loaded_job.pipeline_runs) == 1
    loaded_run = loaded_job.pipeline_runs[0]
    assert len(loaded_run.flood_events) == 1
    loaded_event = loaded_run.flood_events[0]

    assert len(loaded_event.affected_buildings) == 1
    assert len(loaded_event.affected_roads) == 1
    assert len(loaded_event.affected_infrastructure) == 1
    assert loaded_event.population_statistics.population == 5200
    assert loaded_event.disaster_statistics.disaster_severity_index == 85.0
    assert len(loaded_event.reports) == 1
    assert len(loaded_event.artifacts) == 1


@pytest.mark.asyncio
async def test_cascade_delete_job_deletes_all_downstream(test_db_session: AsyncSession):
    """
    Verify that deleting an AnalysisJob cascades and deletes:
    PipelineRun -> FloodEvent -> (Buildings, Roads, Infrastructure, Stats, Reports, Artifacts)
    """
    job = AnalysisJob(job_name="Job to be Deleted")
    test_db_session.add(job)
    await test_db_session.flush()

    run = PipelineRun(job_id=job.id, execution_id=f"run_{uuid.uuid4().hex[:12]}")
    test_db_session.add(run)
    await test_db_session.flush()

    event = FloodEvent(
        pipeline_run_id=run.id,
        name="Transient Flood Event",
        before_date=datetime.date(2024, 1, 1),
        after_date=datetime.date(2024, 1, 15),
    )
    test_db_session.add(event)
    await test_db_session.flush()

    bldg = AffectedBuilding(flood_event_id=event.id, building_type="commercial", damage_level=DamageLevel.DESTROYED)
    road = AffectedRoad(flood_event_id=event.id, road_type="residential", road_length=1.2, damage_level=DamageLevel.MINOR)
    test_db_session.add_all([bldg, road])
    await test_db_session.commit()

    event_id = event.id
    bldg_id = bldg.id
    road_id = road.id

    # Delete the parent AnalysisJob
    await test_db_session.delete(job)
    await test_db_session.commit()

    # Verify downstream objects are deleted
    assert await test_db_session.get(AnalysisJob, job.id) is None
    assert await test_db_session.get(PipelineRun, run.id) is None
    assert await test_db_session.get(FloodEvent, event_id) is None
    assert await test_db_session.get(AffectedBuilding, bldg_id) is None
    assert await test_db_session.get(AffectedRoad, road_id) is None
