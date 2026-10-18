"""
test_stage55_intelligence.py — Stage 5.5 AI Demographic & Healthcare Intelligence Integration Tests
===================================================================================================
Tests:
1. GET /api/v1/intelligence/status
2. POST /api/v1/intelligence/settlement-dossier (Gaur, Rautahat)
3. POST /api/v1/intelligence/settlement-dossier (Birgunj, Parsa)
4. Fallback empirical model accuracy (WHO standard relief calculation: 3L/person/day)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_intelligence_status_endpoint(client: AsyncClient):
    """Verify Stage 5.5 intelligence service status reporting."""
    response = await client.get("/api/v1/intelligence/status")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert "Gemini" in data["service"]
    assert "offline_empirical_engine" in data
    assert len(data["supported_features"]) >= 4


@pytest.mark.asyncio
async def test_settlement_dossier_gaur(client: AsyncClient):
    """Verify settlement dossier for Gaur, Rautahat."""
    payload = {
        "settlement_name": "Gaur",
        "district": "Rautahat",
        "is_flooded": True,
        "flood_depth_meters": 2.4,
    }
    response = await client.post("/api/v1/intelligence/settlement-dossier", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["settlement_name"] == "Gaur"
    assert data["district"] == "Rautahat"
    assert data["is_flooded"] is True
    assert data["total_population"] >= 20000
    assert data["vulnerable_demographics"]["infants_under_5"] > 0
    assert len(data["healthcare_facilities"]) >= 1
    assert data["daily_relief_needs"]["potable_water_litres"] == data["total_population"] * 3


@pytest.mark.asyncio
async def test_settlement_dossier_birgunj(client: AsyncClient):
    """Verify settlement dossier for Birgunj, Parsa."""
    payload = {
        "settlement_name": "Birgunj",
        "district": "Parsa",
        "is_flooded": False,
    }
    response = await client.post("/api/v1/intelligence/settlement-dossier", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["settlement_name"] == "Birgunj"
    assert data["district"] == "Parsa"
    assert data["total_population"] >= 50000
    assert len(data["healthcare_facilities"]) >= 1
    assert any("Narayani Hospital" in h["name"] for h in data["healthcare_facilities"])
