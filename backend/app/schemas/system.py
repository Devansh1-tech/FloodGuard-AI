"""
system.py — System Configuration and Platform Statistics Schemas
================================================================
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from pydantic import BaseModel


class SystemConfigurationResponse(BaseModel):
    """Platform architecture and subsystem configurations."""

    platform_version: str
    pipeline_version: str
    earth_engine_project: Optional[str] = None
    storage_backend: str
    database: Dict[str, Any]
    environment: str


class SystemStatisticsResponse(BaseModel):
    """High-level platform usage and database aggregates."""

    users_count: int
    jobs_count: int
    flood_events_count: int
    generated_reports_count: int
    generated_artifacts_count: int
    storage_usage_bytes: int
    average_execution_time_seconds: float
