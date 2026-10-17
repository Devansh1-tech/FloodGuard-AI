"""
test_health_and_api.py — End-to-End Health Check & REST API Integration Tests
=============================================================================
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Verify welcome greeting at '/' root."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data
    assert "application" in data


@pytest.mark.asyncio
async def test_top_level_health_endpoint(client: AsyncClient):
    """
    Verify /health reports all 7 mandatory system components:
    1. Application
    2. Pipeline Package
    3. Database Connection
    4. Earth Engine Configuration
    5. Storage
    6. Version
    7. Environment
    """
    response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()

    # Core attributes
    assert "application" in body
    assert "version" in body
    assert "environment" in body
    assert "status" in body
    assert "components" in body

    # 5 Subsystem components
    components = body["components"]
    assert "database" in components
    assert "pipeline_engine" in components
    assert "earth_engine" in components
    assert "storage" in components

    # Verify component status strings
    assert components["database"]["status"] in ["healthy", "degraded"]
    assert components["storage"]["status"] == "healthy"


@pytest.mark.asyncio
async def test_middleware_headers(client: AsyncClient):
    """Verify custom middleware attaches X-Process-Time and X-Request-ID."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert "x-process-time" in response.headers
    assert "x-request-id" in response.headers


@pytest.mark.asyncio
async def test_api_v1_health_probes(client: AsyncClient):
    """Verify API v1 health, liveness, and readiness probes."""
    # Main v1 health
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["success"] is True

    # Liveness
    r_live = await client.get("/api/v1/health/live")
    assert r_live.status_code == 200
    assert r_live.json()["data"]["status"] == "alive"

    # Readiness
    r_ready = await client.get("/api/v1/health/ready")
    assert r_ready.status_code == 200
    assert r_ready.json()["data"]["ready"] is True


@pytest.mark.asyncio
async def test_api_v1_analysis_presets_and_trigger(client: AsyncClient):
    """Verify fetching spatial presets and submitting analysis job."""
    # Presets
    r_presets = await client.get("/api/v1/analysis/presets")
    assert r_presets.status_code == 200
    presets_data = r_presets.json()["data"]
    assert presets_data["default_aoi"] == "nepal_terai_koshi"

    # Trigger
    payload = {
        "aoi": "nepal_terai_koshi",
        "before_start": "2024-06-01",
        "before_end": "2024-06-30",
        "after_start": "2024-09-15",
        "after_end": "2024-10-15",
        "project_name": "Test Run Koshi",
    }
    r_trigger = await client.post("/api/v1/analysis/trigger", json=payload)
    assert r_trigger.status_code == 202
    body = r_trigger.json()
    assert body["success"] is True
    job_id = body["data"]["job_id"]
    assert job_id is not None

    # Inspect the triggered job
    r_job = await client.get(f"/api/v1/jobs/{job_id}")
    assert r_job.status_code == 200
    assert r_job.json()["data"]["job_id"] == job_id


@pytest.mark.asyncio
async def test_api_v1_system_endpoints(client: AsyncClient):
    """Verify system info and telemetry endpoints."""
    r_info = await client.get("/api/v1/system/info")
    assert r_info.status_code == 200
    assert r_info.json()["data"]["storage_backend"] == "local"

    r_telem = await client.get("/api/v1/system/telemetry")
    assert r_telem.status_code == 200
    assert "python_version" in r_telem.json()["data"]


@pytest.mark.asyncio
async def test_validation_error_envelope(client: AsyncClient):
    """Verify 422 error response matches standardized error envelope."""
    # Missing required 'job_type' field
    response = await client.post("/api/v1/jobs", json={})
    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert "error" in body
    assert body["error"]["code"] == "REQUEST_VALIDATION_ERROR"
    assert "validation_errors" in body["error"]["details"]


@pytest.mark.asyncio
async def test_not_found_error_envelope(client: AsyncClient):
    """Verify 404 response for unknown resource."""
    response = await client.get("/api/v1/jobs/non-existent-uuid-999")
    assert response.status_code == 404
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] in ["RESOURCE_NOT_FOUND", "NOT_FOUND"]
