"""
telemetry.py — Pydantic Schemas for River Gauge Telemetry & Vernacular SOS Alerts
==================================================================================

Stage 5.9:
- DHM River Gauge Telemetry across 21 Nepal Terai districts.
- Hydrological thresholds, discharge, water level, rate of rise.
- Vernacular Nepali and English multi-channel SOS alert payloads (SMS, WhatsApp, Radio).
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class HourlyLevelSchema(BaseModel):
    time: str
    level_meters: float
    discharge_cusecs: Optional[int] = None


class DownstreamSettlementSchema(BaseModel):
    settlement_name: str
    nepali_name: str
    district: str
    estimated_lead_time_hours: float
    population_at_risk: int
    recommended_safe_haven_id: str
    evacuation_route_hint: str


class RiverGaugeStationSchema(BaseModel):
    id: str
    dhm_station_number: str
    name: str
    nepali_name: str
    river: str
    nepali_river: str
    basin: str
    district: str
    coords: List[float] = Field(..., description="[lat, lng]")
    current_level_meters: float
    warning_level_meters: float
    danger_level_meters: float
    highest_historical_level_meters: float
    historical_record_year: int
    discharge_cusecs: int
    status: str = Field(..., description="normal | warning | danger | extreme_flood")
    trend: str = Field(..., description="rising_rapidly | rising | steady | receding")
    rate_of_rise_cm_per_hour: int
    is_barrage_controlled: bool
    total_sluice_gates: Optional[int] = None
    sluice_gates_open: Optional[int] = None
    station_officer: str
    contact_number: str
    last_updated_nst: str
    hourly_history: List[HourlyLevelSchema] = []
    downstream_settlements: List[DownstreamSettlementSchema] = []


class VernacularAlertChannelsSchema(BaseModel):
    sms_nepali_compact: str = Field(..., description="Compact text kept to 160 Unicode code points; Unicode SMS may be segmented by carriers")
    sms_english_compact: str
    whatsapp_nepali_rich: str = Field(..., description="Rich emoji formatted messaging payload")
    whatsapp_english_rich: str
    community_radio_script_nepali: str = Field(..., description="Official spoken announcement for FM radio")
    community_radio_script_english: str
    sms_maithili_compact: str
    sms_bhojpuri_compact: str
    whatsapp_maithili_rich: str
    whatsapp_bhojpuri_rich: str
    community_radio_script_maithili: str
    community_radio_script_bhojpuri: str
    shareable_whatsapp_url: str


class VernacularAlertResponseSchema(BaseModel):
    station_id: str
    station_name: str
    nepali_station_name: str
    river: str
    nepali_river: str
    district: str
    current_level_meters: float
    danger_level_meters: float
    severity: str
    channels: VernacularAlertChannelsSchema
    timestamp_nst: str


class TelemetrySummarySchema(BaseModel):
    total_stations_monitored: int
    stations_in_danger_or_extreme: int
    stations_in_warning: int
    stations_normal: int
    maximum_discharge_station: str
    maximum_discharge_cusecs: int
    total_downstream_population_at_risk: int
    reporting_basin_scope: str
