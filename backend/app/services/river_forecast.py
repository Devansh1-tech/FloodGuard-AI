"""Short-lead river forecasts and HAND-constrained inundation projection."""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional

import numpy as np


def manning_wave_velocity(
    hydraulic_radius_m: float,
    channel_slope: float,
    roughness: float = 0.035,
) -> float:
    """Return flood-wave velocity (m/s) using c ~= 5/3 times Manning velocity."""
    if not all(math.isfinite(v) and v > 0 for v in (hydraulic_radius_m, channel_slope, roughness)):
        raise ValueError("Hydraulic radius, channel slope, and roughness must be positive.")
    mean_velocity = (1.0 / roughness) * hydraulic_radius_m ** (2.0 / 3.0) * channel_slope ** 0.5
    return (5.0 / 3.0) * mean_velocity


def project_hand_inundation(
    hand_meters: np.ndarray,
    overtopping_depth_m: float,
    max_hand_meters: Optional[float] = None,
) -> np.ndarray:
    """Project cells whose HAND is below the predicted water depth; invalid cells stay dry."""
    hand = np.asarray(hand_meters, dtype=np.float32)
    if hand.ndim != 2:
        raise ValueError("HAND input must be a two-dimensional raster.")
    if overtopping_depth_m <= 0:
        return np.zeros(hand.shape, dtype=np.uint8)
    valid = np.isfinite(hand) & (hand >= 0)
    if max_hand_meters is not None:
        valid &= hand <= max_hand_meters
    return (valid & (hand <= overtopping_depth_m)).astype(np.uint8)


def _stage_at(gauge: Dict[str, Any], hours: float, rise_rate_cm_hr: float) -> float:
    return round(max(0.0, gauge["current_level_meters"] + rise_rate_cm_hr * hours / 100.0), 2)


def build_gauge_forecast(
    gauge: Dict[str, Any],
    horizon_hours: int = 24,
    rise_rate_cm_hr: Optional[float] = None,
    rainfall_mm_hr: Optional[float] = None,
    downstream_distance_km: Optional[float] = None,
    hydraulic_radius_m: Optional[float] = None,
    channel_slope: Optional[float] = None,
    manning_roughness: float = 0.035,
) -> Dict[str, Any]:
    """Create transparent linear stage projections using configured settlement lead times."""
    if not 1 <= horizon_hours <= 48:
        raise ValueError("Forecast horizon must be between 1 and 48 hours.")
    rate = float(gauge["rate_of_rise_cm_per_hour"] if rise_rate_cm_hr is None else rise_rate_cm_hr)
    if not math.isfinite(rate) or rate < -100 or rate > 100:
        raise ValueError("Rate of rise must be between -100 and 100 cm/hour.")
    if rainfall_mm_hr is not None and (not math.isfinite(rainfall_mm_hr) or rainfall_mm_hr < 0 or rainfall_mm_hr > 500):
        raise ValueError("Rainfall proxy must be between 0 and 500 mm/hour.")
    routing = None
    if any(value is not None for value in (downstream_distance_km, hydraulic_radius_m, channel_slope)):
        if downstream_distance_km is None or hydraulic_radius_m is None or channel_slope is None:
            raise ValueError("Distance, hydraulic radius, and channel slope are all required for Manning routing.")
        if not math.isfinite(downstream_distance_km) or downstream_distance_km <= 0:
            raise ValueError("Downstream distance must be positive.")
        velocity = manning_wave_velocity(hydraulic_radius_m, channel_slope, manning_roughness)
        travel_hours = downstream_distance_km * 1000.0 / velocity / 3600.0
        routing = {
            "downstream_distance_km": downstream_distance_km,
            "hydraulic_radius_m": hydraulic_radius_m,
            "channel_slope": channel_slope,
            "manning_roughness": manning_roughness,
            "wave_velocity_m_per_s": round(velocity, 3),
            "estimated_travel_time_hours": round(travel_hours, 2),
            "method": "Manning mean velocity multiplied by 5/3",
        }

    forecast_hours = sorted(set([1, 3, 6, 12, 24, 48, horizon_hours]))
    forecast_hours = [hour for hour in forecast_hours if hour <= horizon_hours]
    projected = [
        {
            "hours_ahead": hour,
            "stage_m": _stage_at(gauge, hour, rate),
            "warning_threshold_crossed": _stage_at(gauge, hour, rate) >= gauge["warning_level_meters"],
            "danger_threshold_crossed": _stage_at(gauge, hour, rate) >= gauge["danger_level_meters"],
        }
        for hour in forecast_hours
    ]
    settlements: List[Dict[str, Any]] = []
    for settlement in gauge.get("downstream_settlements", []):
        lead = float(settlement["estimated_lead_time_hours"])
        stage = _stage_at(gauge, min(horizon_hours, lead), rate)
        settlements.append({
            **settlement,
            "projected_arrival_hours": round(lead, 2),
            "projected_stage_at_arrival_m": stage,
            "danger_threshold_projected": stage >= gauge["danger_level_meters"],
            "projection_method": "configured travel-time estimate plus linear gauge rate-of-rise",
        })
    return {
        "station_id": gauge["id"],
        "station_name": gauge["name"],
        "river": gauge["river"],
        "current_stage_m": gauge["current_level_meters"],
        "warning_stage_m": gauge["warning_level_meters"],
        "danger_stage_m": gauge["danger_level_meters"],
        "rate_of_rise_cm_per_hour": rate,
        "critical_rising_alert": rate > 25 and gauge["current_level_meters"] >= gauge["warning_level_meters"],
        "horizon_hours": horizon_hours,
        "stage_forecast": projected,
        "downstream_forecasts": settlements,
        "hydraulic_routing": routing,
        "rainfall_proxy_mm_per_hour": rainfall_mm_hr,
        "rainfall_note": "Rainfall is reported as an input proxy only; no uncalibrated stage adjustment is applied." if rainfall_mm_hr is not None else None,
        "assumptions": [
            "Gauge values and downstream travel-time estimates come from the configured telemetry dataset.",
            "Stage is extrapolated linearly from the supplied rate of rise; this is a short-lead screening estimate, not a calibrated hydraulic forecast.",
            "A production GPM IMERG feed and station rating curves are required for operational rainfall-to-stage assimilation.",
            "Manning routing is calculated only when reach distance, hydraulic radius, and channel slope are supplied; otherwise configured station travel-time estimates are used.",
        ],
    }
