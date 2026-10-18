"""
test_stage59_telemetry.py — Stage 5.9 River Gauge Telemetry & Vernacular Alert Tests
=====================================================================================

Tests:
1. GET /api/v1/telemetry/river-gauges (all stations, schema verification)
2. GET /api/v1/telemetry/river-gauges?district=Sunsari (filter by district)
3. GET /api/v1/telemetry/river-gauges?status=extreme_flood (filter by severity)
4. GET /api/v1/telemetry/vernacular-alert (bilingual SMS, WhatsApp, and Radio script)
5. GET /api/v1/telemetry/vernacular-alert (404 not found handling)
6. GET /api/v1/telemetry/summary (executive counters and reporting scope)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_river_gauges_all(client: AsyncClient):
    """Verify retrieval of all Nepal Terai DHM hydrological monitoring stations."""
    response = await client.get("/api/v1/telemetry/river-gauges")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert len(data) >= 7

    # Check station structure
    chatara = next((g for g in data if g["id"] == "gauge_koshi_chatara"), None)
    assert chatara is not None
    assert chatara["river"] == "Saptakoshi River"
    assert chatara["nepali_river"] == "सप्तकोशी नदी"
    assert chatara["warning_level_meters"] > 0
    assert chatara["danger_level_meters"] > chatara["warning_level_meters"]
    assert chatara["current_level_meters"] >= chatara["danger_level_meters"]
    assert len(chatara["hourly_history"]) >= 6
    assert len(chatara["downstream_settlements"]) >= 1


@pytest.mark.asyncio
async def test_get_river_gauges_filtered(client: AsyncClient):
    """Verify filtering by district and status."""
    # Filter by district
    res_dist = await client.get("/api/v1/telemetry/river-gauges?district=Sunsari")
    assert res_dist.status_code == 200
    data_dist = res_dist.json()["data"]
    assert len(data_dist) >= 1
    assert all("Sunsari" in g["district"] for g in data_dist)

    # Filter by status
    res_status = await client.get("/api/v1/telemetry/river-gauges?status=extreme_flood")
    assert res_status.status_code == 200
    data_status = res_status.json()["data"]
    assert len(data_status) >= 1
    assert all(g["status"] == "extreme_flood" for g in data_status)


@pytest.mark.asyncio
async def test_vernacular_alert_generation(client: AsyncClient):
    """Verify bilingual multi-channel SOS alert generation (SMS, WhatsApp, Radio)."""
    response = await client.get("/api/v1/telemetry/vernacular-alert?station_id=gauge_narayani_devghat")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    alert = body["data"]

    assert alert["station_id"] == "gauge_narayani_devghat"
    assert "नारायणी" in alert["nepali_river"]
    assert alert["current_level_meters"] >= alert["danger_level_meters"]

    channels = alert["channels"]
    # 1. Compact Nepali SMS
    assert "🚨" in channels["sms_nepali_compact"]
    assert "1155" in channels["sms_nepali_compact"]

    # 2. Rich WhatsApp
    assert "*🚨 बाढी संकटकालीन पूर्वसूचना" in channels["whatsapp_nepali_rich"]
    assert "१११४" in channels["whatsapp_nepali_rich"]
    assert channels["shareable_whatsapp_url"].startswith("https://wa.me/?text=")

    # 3. Community FM Radio broadcast script
    assert "नमस्कार, यो बाढी गार्ड एआई" in channels["community_radio_script_nepali"]
    assert "This is an urgent flood bulletin" in channels["community_radio_script_english"]


@pytest.mark.asyncio
async def test_vernacular_alert_not_found(client: AsyncClient):
    """Verify 404 response for non-existent gauge station."""
    response = await client.get("/api/v1/telemetry/vernacular-alert?station_id=non_existent_station")
    assert response.status_code == 404
    body = response.json()
    assert body["success"] is False
    assert "not found" in body["error"]["message"].lower()


@pytest.mark.asyncio
async def test_telemetry_summary_counters(client: AsyncClient):
    """Verify executive summary telemetry counters for government dashboards."""
    response = await client.get("/api/v1/telemetry/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    summary = body["data"]

    assert summary["total_stations_monitored"] >= 7
    assert summary["stations_in_danger_or_extreme"] >= 3
    assert summary["maximum_discharge_cusecs"] >= 400000
    assert "Saptakoshi" in summary["maximum_discharge_station"]
    assert summary["total_downstream_population_at_risk"] > 50000
    assert "21 Districts" in summary["reporting_basin_scope"]
