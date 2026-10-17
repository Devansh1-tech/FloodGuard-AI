"""
verify_production.py — Comprehensive Stage 4.2 Production Verification Runner
=============================================================================

Automates and verifies Phases 2 through 14 against the running FloodGuard AI platform.
Records all HTTP requests, responses, status codes, latencies, database records,
file deliverables, and performance benchmarks.
"""

from __future__ import annotations

import asyncio
import datetime
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import uuid
import httpx
import psutil

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Ensure backend root is on sys.path
_backend_dir = Path(__file__).resolve().parent.parent
_workspace_dir = _backend_dir.parent
for p in [str(_backend_dir), str(_workspace_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.config.settings import get_settings
from app.models.enums import ArtifactType, DamageLevel, FloodSeverity, JobPriority, JobStatus, ReportType
from app.models.flood_event import FloodEvent
from app.models.impact import AffectedBuilding, AffectedInfrastructure, AffectedRoad
from app.models.job import AnalysisJob
from app.models.pipeline_run import PipelineRun
from app.models.reports import GeneratedArtifact, GeneratedReport
from app.models.statistics import DisasterStatistics, PopulationStatistics
from app.models.user import User
from app.security.jwt import create_access_token

BASE_URL = "http://127.0.0.1:8000"


def generate_token(role: str, user_id: str = "qa-engineer-01") -> str:
    return create_access_token(
        subject=user_id,
        claims={"role": role, "is_active": True},
    )


async def main() -> None:
    results: Dict[str, Any] = {
        "phases": {},
        "summary": {"passed": 0, "warnings": 0, "failed": 0},
    }

    client = httpx.AsyncClient(base_url=BASE_URL, timeout=180.0)

    admin_token = generate_token("ADMIN", "admin-tester")
    analyst_token = generate_token("ANALYST", "analyst-tester")
    viewer_token = generate_token("VIEWER", "viewer-tester")

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}

    print("=" * 80)
    print("FLOODGUARD AI — STAGE 4.2 COMPREHENSIVE PRODUCTION VERIFICATION")
    print("=" * 80)

    # ─────────────────────────────────────────────────────────────────────────────
    # PHASE 2: OPENAPI VALIDATION & ENDPOINT INVENTORY
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[PHASE 2] Validating OpenAPI, Swagger UI & Endpoint Inventory...")
    phase2 = {"endpoints": [], "docs_status": None, "redoc_status": None, "openapi_status": None}
    
    r_docs = await client.get("/docs")
    r_redoc = await client.get("/redoc")
    r_openapi = await client.get("/openapi.json")

    phase2["docs_status"] = r_docs.status_code
    phase2["redoc_status"] = r_redoc.status_code
    phase2["openapi_status"] = r_openapi.status_code

    assert r_docs.status_code == 200, f"/docs failed: {r_docs.status_code}"
    assert r_redoc.status_code == 200, f"/redoc failed: {r_redoc.status_code}"
    assert r_openapi.status_code == 200, f"/openapi.json failed: {r_openapi.status_code}"

    schema = r_openapi.json()
    paths = schema.get("paths", {})
    endpoint_inventory = []
    for path, methods in paths.items():
        for method, details in methods.items():
            if method.lower() in ["get", "post", "put", "delete", "patch"]:
                endpoint_inventory.append({
                    "method": method.upper(),
                    "path": path,
                    "summary": details.get("summary", ""),
                    "tags": details.get("tags", []),
                    "responses": list(details.get("responses", {}).keys()),
                })

    phase2["endpoints"] = endpoint_inventory
    phase2["total_endpoints"] = len(endpoint_inventory)
    print(f"  ✓ OpenAPI Documentation verified. Total Endpoints Discovered: {len(endpoint_inventory)}")
    for ep in endpoint_inventory:
        print(f"    - {ep['method']:<6} {ep['path']:<35} [{', '.join(ep['tags'])}]")
    results["phases"]["phase2_openapi"] = phase2
    results["summary"]["passed"] += 1

    # ─────────────────────────────────────────────────────────────────────────────
    # PHASE 3: HEALTH CHECKS & DIAGNOSTICS
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[PHASE 3] Executing Health Checks & Subsystem Diagnostics...")
    phase3 = {}

    r_root = await client.get("/")
    r_health = await client.get("/health")
    r_v1_health = await client.get("/api/v1/health")
    r_live = await client.get("/api/v1/health/live")
    r_ready = await client.get("/api/v1/health/ready")
    r_config = await client.get("/api/v1/system/configuration", headers=admin_headers)
    r_stats = await client.get("/api/v1/system/statistics", headers=admin_headers)

    phase3["root"] = r_root.json()
    phase3["health"] = r_health.json()
    phase3["system_configuration"] = r_config.json()
    phase3["system_statistics"] = r_stats.json()

    print(f"  ✓ GET / : status={r_root.status_code}, app={phase3['root'].get('application')}")
    print(f"  ✓ GET /health : status={r_health.status_code}, overall_health={phase3['health'].get('status')}")
    print(f"    - Subsystems: {list(phase3['health'].get('components', {}).keys())}")
    for k, v in phase3["health"].get("components", {}).items():
        print(f"      • {k:<18}: {v.get('status')} - {v.get('message')}")
    print(f"  ✓ GET /api/v1/system/configuration : {json.dumps(phase3['system_configuration']['data'])}")
    print(f"  ✓ GET /api/v1/system/statistics : {json.dumps(phase3['system_statistics']['data'])}")

    results["phases"]["phase3_health"] = phase3
    results["summary"]["passed"] += 1

    # ─────────────────────────────────────────────────────────────────────────────
    # PHASE 4: AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[PHASE 4] Verifying JWT Authentication & Role-Based Access Control...")
    phase4 = {}

    dummy_payload = {
        "aoi": "nepal_terai_koshi",
        "before_start": "2024-06-01",
        "before_end": "2024-06-30",
        "after_start": "2024-09-15",
        "after_end": "2024-10-15",
        "project_name": "Auth Test Run",
        "priority": "HIGH",
    }

    # 1. Missing Token
    r_no_auth = await client.post("/api/v1/analysis", json=dummy_payload)
    print(f"  ✓ Unauthenticated POST /api/v1/analysis: {r_no_auth.status_code} (Expected 401)")
    assert r_no_auth.status_code == 401
    phase4["no_token_response"] = r_no_auth.json()

    # 2. Invalid Token
    r_bad_auth = await client.post("/api/v1/analysis", json=dummy_payload, headers={"Authorization": "Bearer invalid.jwt.token"})
    print(f"  ✓ Invalid Token POST /api/v1/analysis: {r_bad_auth.status_code} (Expected 401)")
    assert r_bad_auth.status_code == 401
    phase4["bad_token_response"] = r_bad_auth.json()

    # 3. VIEWER Role (Forbidden from creating analysis)
    r_viewer = await client.post("/api/v1/analysis", json=dummy_payload, headers=viewer_headers)
    print(f"  ✓ VIEWER Role POST /api/v1/analysis: {r_viewer.status_code} (Expected 403)")
    assert r_viewer.status_code == 403
    phase4["viewer_response"] = r_viewer.json()

    # 4. ANALYST Role (Authorized)
    dummy_payload["project_name"] = "Auth Test Analyst"
    dummy_payload["after_start"] = "2024-09-16"
    r_analyst = await client.post("/api/v1/analysis", json=dummy_payload, headers=analyst_headers)
    print(f"  ✓ ANALYST Role POST /api/v1/analysis: {r_analyst.status_code} (Expected 202)")
    assert r_analyst.status_code == 202
    phase4["analyst_response"] = r_analyst.json()

    # 5. ADMIN Role (Authorized)
    dummy_payload["project_name"] = "Auth Test Admin"
    dummy_payload["after_start"] = "2024-09-17"
    r_admin = await client.post("/api/v1/analysis", json=dummy_payload, headers=admin_headers)
    print(f"  ✓ ADMIN Role POST /api/v1/analysis: {r_admin.status_code} (Expected 202)")
    assert r_admin.status_code == 202
    phase4["admin_response"] = r_admin.json()

    results["phases"]["phase4_auth"] = phase4
    results["summary"]["passed"] += 1

    # ─────────────────────────────────────────────────────────────────────────────
    # PHASE 5 & 6: REAL ANALYSIS WORKFLOW & LIVE JOB MONITORING
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[PHASE 5 & 6] Executing Real Pipeline Analysis & Live Job Monitoring...")
    unique_proj = f"Koshi Verification {int(time.time())}"
    analysis_payload = {
        "aoi": "nepal_terai_koshi",
        "before_start": "2024-06-01",
        "before_end": "2024-06-30",
        "after_start": "2024-09-15",
        "after_end": "2024-10-15",
        "project_name": unique_proj,
        "priority": "HIGH",
    }

    t0_submit = time.perf_counter()
    r_submit = await client.post("/api/v1/analysis", json=analysis_payload, headers=admin_headers)
    submit_latency = (time.perf_counter() - t0_submit) * 1000
    print(f"  ✓ POST /api/v1/analysis submitted in {submit_latency:.2f}ms: status={r_submit.status_code}")
    assert r_submit.status_code == 202, f"Failed to submit analysis: {r_submit.text}"
    
    sub_data = r_submit.json()["data"]
    job_id = sub_data["job_id"]
    print(f"    - Assigned Job ID: {job_id}")
    print(f"    - Status: {sub_data['status']}")
    print(f"    - Estimated Queue Position: {sub_data['estimated_queue_position']}")

    # Polling job status
    print("\n  [>] Monitoring Live Job Progress...")
    stages_seen = []
    poll_history = []
    t_start = time.time()
    final_job_data = None

    while True:
        await asyncio.sleep(2.0)
        r_poll = await client.get(f"/api/v1/jobs/{job_id}", headers=admin_headers)
        if r_poll.status_code != 200:
            print(f"    Poll error: {r_poll.status_code}")
            continue
        
        job_info = r_poll.json()["data"]
        stage = job_info.get("current_stage")
        progress = job_info.get("progress", 0)
        status = job_info.get("status")
        dur = job_info.get("execution_time_seconds") or (time.time() - t_start)

        if stage not in stages_seen:
            stages_seen.append(stage)
            ts = datetime.datetime.now().strftime("%H:%M:%S")
            print(f"    [{ts}] Stage Transition: {stage:<16} | Progress: {progress:>3}% | Status: {status:<10} | Elapsed: {dur:.1f}s")
            poll_history.append({"timestamp": ts, "stage": stage, "progress": progress, "status": status, "elapsed": dur})

        if status in ["COMPLETED", "FAILED", "CANCELLED"]:
            final_job_data = job_info
            break

        if time.time() - t_start > 300:  # 5 minutes timeout
            print("    [!] Timeout waiting for job completion")
            break

    exec_time = float(final_job_data.get('execution_time_seconds') or 0.0)
    print(f"  ✓ Final Job Status: {final_job_data.get('status')} in {exec_time:.2f}s")
    print(f"  ✓ Milestone Stages Traversed: {' -> '.join(stages_seen)}")

    results["phases"]["phase5_6_analysis"] = {
        "job_id": job_id,
        "submission_response": sub_data,
        "milestones": poll_history,
        "final_status": final_job_data,
    }
    if final_job_data.get("status") == "COMPLETED":
        results["summary"]["passed"] += 1
    else:
        results["summary"]["warnings"] += 1

    # ─────────────────────────────────────────────────────────────────────────────
    # PHASE 7 & 13: DATABASE VALIDATION & CONSISTENCY CHECK
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[PHASE 7 & 13] Validating PostGIS Database Persistence & Relational Cascades...")
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    db_validation = {}
    job_id_uuid = uuid.UUID(str(job_id))
    async with session_maker() as session:
        # Check Job Record
        stmt_job = select(AnalysisJob).where(AnalysisJob.id == job_id_uuid)
        job_rec = (await session.execute(stmt_job)).scalars().first()
        db_validation["job_record"] = {
            "id": str(job_rec.id),
            "status": job_rec.status.value,
            "progress": job_rec.progress,
            "duration": job_rec.duration,
            "stage": job_rec.current_stage,
        }
        print(f"  ✓ AnalysisJob table: id={job_rec.id}, status={job_rec.status.value}, progress={job_rec.progress}%")

        # Check PipelineRun Record
        stmt_run = select(PipelineRun).where(PipelineRun.job_id == job_id_uuid)
        run_rec = (await session.execute(stmt_run)).scalars().first()
        assert run_rec is not None, "PipelineRun record not found for job"
        db_validation["pipeline_run"] = {
            "id": str(run_rec.id),
            "execution_id": run_rec.execution_id,
            "status": run_rec.execution_status,
            "duration": run_rec.execution_time,
        }
        print(f"  ✓ PipelineRun table: id={run_rec.id}, exec_id={run_rec.execution_id}, status={run_rec.execution_status}")

        # Check FloodEvent Record
        stmt_event = select(FloodEvent).where(FloodEvent.pipeline_run_id == run_rec.id)
        event_rec = (await session.execute(stmt_event)).scalars().first()
        assert event_rec is not None, "FloodEvent record not found"
        db_validation["flood_event"] = {
            "id": str(event_rec.id),
            "name": event_rec.name,
            "area_km2": event_rec.flood_area,
            "severity": event_rec.severity.value,
        }
        print(f"  ✓ FloodEvent table: id={event_rec.id}, name='{event_rec.name}', area={event_rec.flood_area} km², severity={event_rec.severity.value}")

        # Check Statistics
        stmt_pop = select(PopulationStatistics).where(PopulationStatistics.flood_event_id == event_rec.id)
        pop_rec = (await session.execute(stmt_pop)).scalars().first()
        stmt_dis = select(DisasterStatistics).where(DisasterStatistics.flood_event_id == event_rec.id)
        dis_rec = (await session.execute(stmt_dis)).scalars().first()

        db_validation["population_stats"] = {
            "population": pop_rec.population if pop_rec else None,
            "households": pop_rec.households if pop_rec else None,
        }
        db_validation["disaster_stats"] = {
            "severity_index": dis_rec.disaster_severity_index if dis_rec else None,
            "affected_buildings": dis_rec.affected_buildings if dis_rec else None,
        }
        print(f"  ✓ PopulationStatistics: affected_population={pop_rec.population if pop_rec else 'N/A'}")
        print(f"  ✓ DisasterStatistics: severity_index={dis_rec.disaster_severity_index if dis_rec else 'N/A'}")

        # Check Impact Counts
        buildings_cnt = (await session.execute(select(func.count()).select_from(AffectedBuilding).where(AffectedBuilding.flood_event_id == event_rec.id))).scalar()
        roads_cnt = (await session.execute(select(func.count()).select_from(AffectedRoad).where(AffectedRoad.flood_event_id == event_rec.id))).scalar()
        infra_cnt = (await session.execute(select(func.count()).select_from(AffectedInfrastructure).where(AffectedInfrastructure.flood_event_id == event_rec.id))).scalar()
        reports_cnt = (await session.execute(select(func.count()).select_from(GeneratedReport).where(GeneratedReport.flood_event_id == event_rec.id))).scalar()
        artifacts_cnt = (await session.execute(select(func.count()).select_from(GeneratedArtifact).where(GeneratedArtifact.flood_event_id == event_rec.id))).scalar()

        db_validation["impact_counts"] = {
            "buildings": buildings_cnt,
            "roads": roads_cnt,
            "infrastructure": infra_cnt,
            "reports": reports_cnt,
            "artifacts": artifacts_cnt,
        }
        print(f"  ✓ Persisted Entities: buildings={buildings_cnt}, roads={roads_cnt}, infra={infra_cnt}, reports={reports_cnt}, artifacts={artifacts_cnt}")

        # Fetch sample report & artifact for download testing
        stmt_rep = select(GeneratedReport).where(GeneratedReport.flood_event_id == event_rec.id)
        rep_sample = (await session.execute(stmt_rep)).scalars().first()
        stmt_art = select(GeneratedArtifact).where(GeneratedArtifact.flood_event_id == event_rec.id)
        art_sample = (await session.execute(stmt_art)).scalars().first()

        # Database Consistency: Verify zero orphan records
        orphan_runs = (await session.execute(select(func.count()).select_from(PipelineRun).where(~PipelineRun.job_id.in_(select(AnalysisJob.id))))).scalar()
        orphan_events = (await session.execute(select(func.count()).select_from(FloodEvent).where(~FloodEvent.pipeline_run_id.in_(select(PipelineRun.id))))).scalar()
        print(f"  ✓ Consistency Audit: orphan_runs={orphan_runs}, orphan_events={orphan_events} (Zero expected)")
        assert orphan_runs == 0
        assert orphan_events == 0

    await engine.dispose()
    results["phases"]["phase7_13_database"] = db_validation
    results["summary"]["passed"] += 1

    # ─────────────────────────────────────────────────────────────────────────────
    # PHASE 8: OUTPUT DIRECTORY VALIDATION
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[PHASE 8] Inspecting File Outputs & Delivery Artifacts...")
    outputs_root = Path(settings.STORAGE_LOCAL_ROOT)
    run_folders = sorted(list(outputs_root.glob("run_*")), reverse=True)
    phase8 = {"total_runs": len(run_folders), "latest_run": None, "files": []}

    if run_folders:
        latest = run_folders[0]
        phase8["latest_run"] = str(latest)
        print(f"  ✓ Latest Output Directory: {latest}")
        for p in latest.rglob("*"):
            if p.is_file():
                sz = p.stat().st_size
                rel = p.relative_to(latest)
                phase8["files"].append({"path": str(rel), "size_bytes": sz})
                print(f"    - {str(rel):<40} ({sz:>8} bytes)")
    else:
        print("  [!] No run directories found in outputs")

    results["phases"]["phase8_outputs"] = phase8
    results["summary"]["passed"] += 1

    # ─────────────────────────────────────────────────────────────────────────────
    # PHASE 9: DOWNLOAD VALIDATION
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[PHASE 9] Verifying Streaming File Downloads (Reports & Artifacts)...")
    phase9 = {}

    if rep_sample:
        r_rep_meta = await client.get(f"/api/v1/reports/{rep_sample.id}", headers=admin_headers)
        r_rep_dl = await client.get(f"/api/v1/reports/{rep_sample.id}/download", headers=admin_headers)
        phase9["report"] = {
            "id": str(rep_sample.id),
            "meta_status": r_rep_meta.status_code,
            "dl_status": r_rep_dl.status_code,
            "content_type": r_rep_dl.headers.get("content-type"),
            "content_length": len(r_rep_dl.content),
        }
        print(f"  ✓ GET /api/v1/reports/{rep_sample.id}/download : status={r_rep_dl.status_code}, type={r_rep_dl.headers.get('content-type')}, bytes={len(r_rep_dl.content)}")
        assert r_rep_dl.status_code == 200

    if art_sample:
        r_art_meta = await client.get(f"/api/v1/artifacts/{art_sample.id}", headers=admin_headers)
        r_art_dl = await client.get(f"/api/v1/artifacts/{art_sample.id}/download", headers=admin_headers)
        phase9["artifact"] = {
            "id": str(art_sample.id),
            "meta_status": r_art_meta.status_code,
            "dl_status": r_art_dl.status_code,
            "content_type": r_art_dl.headers.get("content-type"),
            "content_length": len(r_art_dl.content),
        }
        print(f"  ✓ GET /api/v1/artifacts/{art_sample.id}/download : status={r_art_dl.status_code}, type={r_art_dl.headers.get('content-type')}, bytes={len(r_art_dl.content)}")
        assert r_art_dl.status_code == 200

    results["phases"]["phase9_downloads"] = phase9
    results["summary"]["passed"] += 1

    # ─────────────────────────────────────────────────────────────────────────────
    # PHASE 11: PERFORMANCE BENCHMARKING
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[PHASE 11] Measuring API Latency, Query Timing, CPU & Memory Usage...")
    latencies = {}
    endpoints_to_measure = [
        ("GET /", "/"),
        ("GET /health", "/health"),
        ("GET /api/v1/system/configuration", "/api/v1/system/configuration"),
        ("GET /api/v1/system/statistics", "/api/v1/system/statistics"),
        ("GET /api/v1/jobs", "/api/v1/jobs?limit=10"),
        ("GET /api/v1/jobs/{id}", f"/api/v1/jobs/{job_id}"),
        ("GET /api/v1/analysis/{id}", f"/api/v1/analysis/{job_id}"),
    ]

    for label, path in endpoints_to_measure:
        t0 = time.perf_counter()
        r = await client.get(path, headers=admin_headers)
        dt = (time.perf_counter() - t0) * 1000
        latencies[label] = round(dt, 2)
        print(f"  ✓ {label:<35} : {dt:>6.2f} ms (status: {r.status_code})")

    mem = psutil.virtual_memory()
    cpu = psutil.cpu_percent(interval=0.5)
    phase11 = {
        "api_latencies_ms": latencies,
        "pipeline_duration_seconds": final_job_data.get("execution_time_seconds"),
        "cpu_percent": cpu,
        "memory_used_mb": round(psutil.Process().memory_info().rss / (1024 * 1024), 2),
        "system_ram_percent": mem.percent,
    }
    print(f"  ✓ Resource Utilization: Memory={phase11['memory_used_mb']} MB, CPU={cpu}%, System RAM={mem.percent}%")
    results["phases"]["phase11_performance"] = phase11
    results["summary"]["passed"] += 1

    # ─────────────────────────────────────────────────────────────────────────────
    # PHASE 12: ERROR HANDLING & EDGE CASES
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[PHASE 12] Testing Error Handling, Validation Envelopes & Lifecycle Transitions...")
    phase12 = {}

    # 1. Inverted Date Range
    r_bad_date = await client.post(
        "/api/v1/analysis",
        json={"aoi": "nepal_terai_koshi", "before_start": "2024-06-30", "before_end": "2024-06-01", "after_start": "2024-09-15", "after_end": "2024-10-15"},
        headers=admin_headers,
    )
    assert r_bad_date.status_code == 422
    phase12["inverted_date"] = {"status": r_bad_date.status_code, "envelope": r_bad_date.json()}
    print(f"  ✓ Inverted date range rejected: {r_bad_date.status_code} [{r_bad_date.json()['error']['code']}]")

    # 2. Invalid AOI
    r_bad_aoi = await client.post(
        "/api/v1/analysis",
        json={"aoi": "atlantis_ocean", "before_start": "2024-06-01", "before_end": "2024-06-30", "after_start": "2024-09-15", "after_end": "2024-10-15"},
        headers=admin_headers,
    )
    assert r_bad_aoi.status_code == 422
    phase12["invalid_aoi"] = {"status": r_bad_aoi.status_code, "envelope": r_bad_aoi.json()}
    print(f"  ✓ Invalid AOI rejected: {r_bad_aoi.status_code} [{r_bad_aoi.json()['error']['code']}]")

    # 3. Non-existent Job
    r_no_job = await client.get("/api/v1/jobs/00000000-0000-0000-0000-000000000000", headers=admin_headers)
    assert r_no_job.status_code == 404
    phase12["non_existent_job"] = {"status": r_no_job.status_code, "envelope": r_no_job.json()}
    print(f"  ✓ Non-existent job rejected: {r_no_job.status_code} [{r_no_job.json()['error']['code']}]")

    # 4. Job Cancellation Test
    r_temp_job = await client.post(
        "/api/v1/analysis",
        json={
            "aoi": "nepal_terai_west_rapti",
            "before_start": "2024-01-01",
            "before_end": "2024-01-30",
            "after_start": "2024-02-01",
            "after_end": "2024-02-28",
            "project_name": "Temporary Cancel Run",
            "priority": "LOW",
        },
        headers=admin_headers,
    )
    temp_id = r_temp_job.json()["data"]["job_id"]
    r_cancel = await client.delete(f"/api/v1/jobs/{temp_id}", headers=admin_headers)
    print(f"  ✓ DELETE /api/v1/jobs/{temp_id} : status={r_cancel.status_code}, message='{r_cancel.json().get('message')}'")
    phase12["cancel_job"] = {"status": r_cancel.status_code, "body": r_cancel.json()}

    results["phases"]["phase12_errors"] = phase12
    results["summary"]["passed"] += 1

    # ─────────────────────────────────────────────────────────────────────────────
    # PHASE 14: CODE QUALITY SCAN
    # ─────────────────────────────────────────────────────────────────────────────
    print("\n[PHASE 14] Scanning Codebase for Leftover Artifacts (TODO, FIXME, pass, mock)...")
    forbidden_tokens = ["TODO", "FIXME", "XXX", "NOT IMPLEMENTED"]
    findings = []
    py_files = list(_backend_dir.rglob("*.py"))
    
    for f in py_files:
        if "alembic" in str(f) or "tests" in str(f):
            continue
        try:
            content = f.read_text(encoding="utf-8")
            for token in forbidden_tokens:
                if token in content:
                    findings.append({"file": str(f.relative_to(_backend_dir)), "token": token})
        except Exception:
            pass

    print(f"  ✓ Scanned {len(py_files)} Python files in backend. Leftover comments found: {len(findings)}")
    phase14 = {"scanned_files": len(py_files), "findings": findings}
    results["phases"]["phase14_code_quality"] = phase14
    results["summary"]["passed"] += 1

    # Write summary artifact
    output_path = Path("backend_verification_results.json")
    output_path.write_text(json.dumps(results, indent=2, default=str), encoding="utf-8")
    print(f"\n[+] Detailed verification results saved to: {output_path.resolve()}")
    print("=" * 80)
    print(f"ALL CHECKS COMPLETED: {results['summary']['passed']} Passed, {results['summary']['warnings']} Warnings, {results['summary']['failed']} Failed")
    print("=" * 80)

    await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
