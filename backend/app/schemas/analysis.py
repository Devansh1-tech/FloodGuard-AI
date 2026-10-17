"""
analysis.py — Disaster Analysis Schemas
========================================

Schemas for requesting and inspecting unified pipeline disaster analysis runs.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class AnalysisTriggerRequest(BaseModel):
    """Payload to trigger an end-to-end flood and settlement impact analysis."""
    aoi: Union[str, List[List[float]]] = Field(
        default="nepal_terai_koshi",
        description="Preset study area name or custom polygon coordinate array [[lon, lat], ...]",
    )
    before_start: str = Field(default="2024-06-01", description="Pre-flood window start date (YYYY-MM-DD)")
    before_end: str = Field(default="2024-06-30", description="Pre-flood window end date (YYYY-MM-DD)")
    after_start: str = Field(default="2024-09-15", description="Post-flood crisis window start date (YYYY-MM-DD)")
    after_end: str = Field(default="2024-10-15", description="Post-flood crisis window end date (YYYY-MM-DD)")
    project_name: str = Field(default="FloodGuard AI", description="Human-readable project title")


class AnalysisResponse(BaseModel):
    """Response returned upon submission of an analysis task."""
    job_id: str
    status: str
    message: str
    aoi: Union[str, List[List[float]]]
    project_name: str
