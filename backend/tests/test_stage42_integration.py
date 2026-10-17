"""
test_stage42_integration.py — Complete Stage 4.2 End-to-End Integration Test Suite
==================================================================================

Comprehensive validation of FloodGuard AI Stage 4.2:
- REST API Endpoints (/analysis, /jobs, /reports, /artifacts, /system)
- JWT Role-Based Access Control (ADMIN, ANALYST, VIEWER)
- Transactional Database Persistence & Cascades
- Pipeline Progress Tracking & Telemetry
- File Downloads (Reports & Artifacts)
- Job Cancellation & Deletion Lifecycle
"""

from __future__ import annotations

import datetime
import json
import os
from pathlib import Path
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import (
    ArtifactType,
    DamageLevel,
    FloodSeverity,
    InfrastructureType,
    JobPriority,
    JobStatus,
    ReportType,
)
from app.models.flood_event import FloodEvent
from app.models.impact import AffectedBuilding, AffectedInfrastructure, AffectedRoad
from app.models.job import AnalysisJob
from app.models.pipeline_run import PipelineRun
from app.models.reports import GeneratedArtifact, GeneratedReport
from app.models.statistics import DisasterStatistics, PopulationStatistics
from app.models.user import User
from app.schemas.analysis import AnalysisTriggerRequest
from app.security.jwt import create_access_token
from app.services.pipeline import PipelineService


def _get_auth_header(role: str, user_id: str = "test-user-id") -> dict:
    token = create_access_token(
        subject=user_id,
        claims={"role": role, "is_active": True},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_analysis_submission_rbac(client: AsyncClient):
    """
    Verify security requirements:
    - Only ADMIN and ANALYST can create analysis.
    - VIEWER cannot create analysis (403).
    - Unauthenticated cannot create analysis (401).
    """
    payload = {
        "aoi": "nepal_terai_koshi",
        "before_start": "2023-01-01",
        "before_end": "2023-01-30",
        "after_start": "2023-04-01",
        "after_end": "2023-04-30",
        "project_name": "RBAC Security Test",
        "priority": "HIGH",
    }

    # 1. Unauthenticated -> 401
    r_unauth = await client.post("/api/v1/analysis", json=payload)
    assert r_unauth.status_code == 401
    assert r_unauth.json()["success"] is False
    assert r_unauth.json()["error"]["code"] == "AUTHENTICATION_FAILED"

    # 2. VIEWER role -> 403 Forbidden
    viewer_header = _get_auth_header("VIEWER", "viewer-123")
    r_viewer = await client.post("/api/v1/analysis", json=payload, headers=viewer_header)
    assert r_viewer.status_code == 403
    assert r_viewer.json()["success"] is False
    assert r_viewer.json()["error"]["code"] == "FORBIDDEN"

    # 3. ANALYST role -> 202 Accepted
    analyst_header = _get_auth_header("ANALYST", "analyst-456")
    r_analyst = await client.post("/api/v1/analysis", json=payload, headers=analyst_header)
    assert r_analyst.status_code == 202
    res_data = r_analyst.json()
    assert res_data["success"] is True
    assert res_data["data"]["job_id"] is not None
    assert res_data["data"]["status"] == "PENDING"
    assert res_data["data"]["estimated_queue_position"] >= 1
    assert "request_id" in res_data
    assert "timestamp" in res_data

    # 4. ADMIN role -> 202 Accepted
    admin_header = _get_auth_header("ADMIN", "admin-789")
    payload["project_name"] = "Admin Run Unique"
    payload["after_start"] = "2024-09-16"
    payload["after_end"] = "2024-10-15"
    r_admin = await client.post("/api/v1/analysis", json=payload, headers=admin_header)
    assert r_admin.status_code == 202
    assert r_admin.json()["success"] is True


@pytest.mark.asyncio
async def test_analysis_payload_validation(client: AsyncClient):
    """Verify input validation rules for AOI and dates."""
    admin_header = _get_auth_header("ADMIN")

    # Inverted date range
    bad_dates = {
        "aoi": "nepal_terai_koshi",
        "before_start": "2024-06-30",
        "before_end": "2024-06-01",  # End is before start
        "after_start": "2024-09-15",
        "after_end": "2024-10-15",
    }
    r_bad_date = await client.post("/api/v1/analysis", json=bad_dates, headers=admin_header)
    assert r_bad_date.status_code == 422
    assert r_bad_date.json()["success"] is False

    # Invalid AOI
    bad_aoi = {
        "aoi": "invalid_unsupported_aoi_region",
        "before_start": "2024-06-01",
        "before_end": "2024-06-30",
        "after_start": "2024-09-15",
        "after_end": "2024-10-15",
    }
    r_bad_aoi = await client.post("/api/v1/analysis", json=bad_aoi, headers=admin_header)
    assert r_bad_aoi.status_code == 422
    assert r_bad_aoi.json()["success"] is False


@pytest.mark.asyncio
async def test_jobs_management_lifecycle(client: AsyncClient, test_db_session: AsyncSession):
    """
    Verify GET /jobs (filtering, sorting, searching, pagination),
    GET /jobs/{id} live status, and DELETE /jobs/{id} cancellation / deletion.
    """
    admin_header = _get_auth_header("ADMIN")

    # 1. Submit a fresh job
    payload = {
        "aoi": "nepal_terai_west_rapti",
        "before_start": "2024-05-01",
        "before_end": "2024-05-30",
        "after_start": "2024-08-10",
        "after_end": "2024-08-30",
        "project_name": "Lifecycle Tracking Project",
        "priority": "HIGH",
    }
    r_create = await client.post("/api/v1/analysis", json=payload, headers=admin_header)
    assert r_create.status_code == 202
    job_id = r_create.json()["data"]["job_id"]

    # 2. Query job status with GET /api/v1/jobs/{job_id}
    r_get = await client.get(f"/api/v1/jobs/{job_id}")
    assert r_get.status_code == 200
    job_data = r_get.json()["data"]
    assert job_data["job_id"] == job_id
    assert job_data["status"] in ["PENDING", "RUNNING"]
    assert job_data["priority"] == "HIGH"
    assert "current_stage" in job_data
    assert "progress" in job_data
    assert "warnings" in job_data

    # 3. List jobs with filtering and searching
    r_list = await client.get("/api/v1/jobs?skip=0&limit=10&priority=HIGH&search=Lifecycle")
    assert r_list.status_code == 200
    list_data = r_list.json()["data"]
    assert len(list_data) >= 1
    assert any(j["job_id"] == job_id for j in list_data)

    # 4. Insert an explicit pending job to test cancellation deterministically
    pending_id = uuid.uuid4()
    p_job = AnalysisJob(
        id=pending_id,
        job_name="Controlled Pending Job",
        status=JobStatus.PENDING,
        priority=JobPriority.NORMAL,
        current_stage="QUEUED",
        progress=0,
    )
    test_db_session.add(p_job)
    await test_db_session.commit()

    # Cancel in-flight job with DELETE /api/v1/jobs/{pending_id}
    r_cancel = await client.delete(f"/api/v1/jobs/{pending_id}")
    assert r_cancel.status_code == 200
    assert r_cancel.json()["message"] == "Running job cancelled successfully"
    assert r_cancel.json()["data"]["status"] == "CANCELLED"

    # 5. Delete cancelled job with DELETE /api/v1/jobs/{pending_id}
    r_delete = await client.delete(f"/api/v1/jobs/{pending_id}")
    assert r_delete.status_code == 200
    assert r_delete.json()["message"] == "Job record deleted successfully"

    # 6. Verify job is removed
    r_check = await client.get(f"/api/v1/jobs/{pending_id}")
    assert r_check.status_code == 404


@pytest.mark.asyncio
async def test_analysis_full_summary_and_reports(client: AsyncClient, test_db_session: AsyncSession, tmp_path):
    """
    Verify complete analysis summary returned by GET /api/v1/analysis/{analysis_id},
    including FloodEvent, Population, Infrastructure, Reports, and Artifacts.
    """
    # Create mock report and artifact files
    reports_dir = tmp_path / "reports"
    artifacts_dir = tmp_path / "artifacts"
    reports_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    report_file = reports_dir / "SituationReport.pdf"
    report_file.write_bytes(b"%PDF-1.4 Mock PDF Content")

    artifact_file = artifacts_dir / "FloodPolygon.geojson"
    artifact_file.write_text('{"type": "FeatureCollection", "features": []}', encoding="utf-8")

    job_id = uuid.uuid4()
    run_id = uuid.uuid4()
    event_id = uuid.uuid4()

    # 1. Insert complete disaster analysis graph
    job = AnalysisJob(
        id=job_id,
        job_name="Comprehensive Test Run",
        status=JobStatus.COMPLETED,
        priority=JobPriority.HIGH,
        started_at=datetime.datetime.now(datetime.timezone.utc),
        completed_at=datetime.datetime.now(datetime.timezone.utc),
        duration=42.5,
        current_stage="COMPLETED",
        progress=100,
    )
    p_run = PipelineRun(
        id=run_id,
        job_id=job_id,
        execution_id="run_comp_test_123",
        pipeline_version="1.0.0",
        stage2_version="1.0.0",
        stage3_version="1.0.0",
        execution_status="SUCCESS",
        execution_time=42.5,
    )
    event = FloodEvent(
        id=event_id,
        pipeline_run_id=run_id,
        name="Koshi Province Deluge",
        country="Nepal",
        state="Koshi Province",
        district="Sunsari",
        municipality="Barahakshetra",
        before_date=datetime.date(2024, 6, 1),
        after_date=datetime.date(2024, 10, 15),
        flood_area=245.8,
        severity=FloodSeverity.HIGH,
    )
    pop_stats = PopulationStatistics(
        flood_event_id=event_id,
        population=34500,
        households=6900,
        children=4200,
        women=17800,
        elderly=3100,
        density=315.4,
    )
    dis_stats = DisasterStatistics(
        flood_event_id=event_id,
        flood_area=245.8,
        affected_buildings=1840,
        affected_roads=58.2,
        affected_population=34500,
        disaster_severity_index=84.2,
    )
    building = AffectedBuilding(
        flood_event_id=event_id,
        building_type="residential",
        building_area=140.0,
        damage_level=DamageLevel.SEVERE,
        water_depth_estimated_m=1.3,
    )
    road = AffectedRoad(
        flood_event_id=event_id,
        road_type="secondary",
        road_name="Koshi Embankment Road",
        road_length=12.4,
        damage_level=DamageLevel.MODERATE,
    )
    infra = AffectedInfrastructure(
        flood_event_id=event_id,
        infrastructure_type=InfrastructureType.HOSPITAL,
        name="District Hospital Sunsari",
        hospital=True,
        status="SUBMERGED",
    )
    report_record = GeneratedReport(
        id=uuid.uuid4(),
        flood_event_id=event_id,
        report_type=ReportType.SITUATION_REPORT,
        report_path=str(report_file),
        format="PDF",
    )
    artifact_record = GeneratedArtifact(
        id=uuid.uuid4(),
        flood_event_id=event_id,
        artifact_type=ArtifactType.FLOOD_POLYGON_GEOJSON,
        file_path=str(artifact_file),
        file_size=128,
        checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )

    test_db_session.add_all([
        job, p_run, event, pop_stats, dis_stats,
        building, road, infra, report_record, artifact_record,
    ])
    await test_db_session.commit()

    # 2. Query GET /api/v1/analysis/{analysis_id} by Job ID
    r_summary = await client.get(f"/api/v1/analysis/{job_id}")
    assert r_summary.status_code == 200
    summary = r_summary.json()["data"]

    assert summary["job_id"] == str(job_id)
    assert summary["status"] == "COMPLETED"
    assert summary["progress"] == 100

    # Verify nested sections
    assert summary["flood_event"]["name"] == "Koshi Province Deluge"
    assert summary["flood_event"]["district"] == "Sunsari"
    assert summary["flood_event"]["flood_area_km2"] == 245.8

    assert summary["population"]["total_affected_population"] == 34500
    assert summary["population"]["estimated_displaced_households"] == 6900

    assert summary["statistics"]["affected_buildings_count"] == 1840
    assert summary["statistics"]["disaster_severity_index"] == 84.2

    assert summary["infrastructure"]["total_submerged_facilities"] == 1
    assert summary["infrastructure"]["hospitals_count"] == 1

    assert len(summary["reports"]) == 1
    assert summary["reports"][0]["report_type"] == "SITUATION_REPORT"

    assert len(summary["artifacts"]) == 1
    assert summary["artifacts"][0]["artifact_type"] == "FLOOD_POLYGON_GEOJSON"

    # 3. Test Report Metadata & Download
    r_rep_meta = await client.get(f"/api/v1/reports/{report_record.id}")
    assert r_rep_meta.status_code == 200
    assert r_rep_meta.json()["data"]["format"] == "PDF"

    r_rep_dl = await client.get(f"/api/v1/reports/{report_record.id}/download")
    assert r_rep_dl.status_code == 200
    assert b"%PDF-1.4" in r_rep_dl.content

    # 4. Test Artifact Metadata & Download
    r_art_meta = await client.get(f"/api/v1/artifacts/{artifact_record.id}")
    assert r_art_meta.status_code == 200
    assert r_art_meta.json()["data"]["artifact_type"] == "FLOOD_POLYGON_GEOJSON"

    r_art_dl = await client.get(f"/api/v1/artifacts/{artifact_record.id}/download")
    assert r_art_dl.status_code == 200
    assert "FeatureCollection" in r_art_dl.text


@pytest.mark.asyncio
async def test_system_endpoints(client: AsyncClient, test_db_session: AsyncSession):
    """
    Verify GET /api/v1/system/configuration and GET /api/v1/system/statistics.
    """
    # 1. Test configuration
    r_config = await client.get("/api/v1/system/configuration")
    assert r_config.status_code == 200
    cfg = r_config.json()["data"]
    assert "platform_version" in cfg
    assert "pipeline_version" in cfg
    assert "earth_engine_project" in cfg
    assert "storage_backend" in cfg
    assert "database" in cfg
    assert "environment" in cfg

    # 2. Test statistics
    r_stats = await client.get("/api/v1/system/statistics")
    assert r_stats.status_code == 200
    stats = r_stats.json()["data"]
    assert "users_count" in stats
    assert "jobs_count" in stats
    assert "flood_events_count" in stats
    assert "generated_reports_count" in stats
    assert "generated_artifacts_count" in stats
    assert "storage_usage_bytes" in stats
    assert "average_execution_time_seconds" in stats
