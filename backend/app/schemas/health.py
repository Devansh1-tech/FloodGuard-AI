"""
health.py — Health Check Schemas
================================

Defines the structure for system health probes and subsystem status telemetry.
"""

from __future__ import annotations

import datetime
from typing import Dict, Any
from pydantic import BaseModel, Field


class ComponentHealth(BaseModel):
    """Health status of an individual subsystem component."""
    status: str = Field(description="'healthy' | 'degraded' | 'unhealthy'")
    message: str = Field(default="")
    details: Dict[str, Any] = Field(default_factory=dict)


class HealthCheckResponse(BaseModel):
    """Comprehensive system health probe response."""
    status: str = Field(description="Overall status: 'healthy', 'degraded', or 'unhealthy'")
    application: str
    version: str
    environment: str
    components: Dict[str, ComponentHealth]
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
