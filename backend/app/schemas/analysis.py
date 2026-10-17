"""
analysis.py — Disaster Analysis Request & Response Schemas
==========================================================

Defines validation contracts for dispatching new flood disaster analyses
and inspecting consolidated spatial impact summaries.
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator

from app.models.enums import JobPriority
from app.utils.geo import validate_aoi_input
from app.utils.time import validate_date_range


class AnalysisTriggerRequest(BaseModel):
    """Payload to trigger an end-to-end flood and settlement impact analysis."""

    aoi: Union[str, List[List[float]]] = Field(
        default="nepal_terai_koshi",
        description="Preset study area name ('nepal_terai_koshi') or custom polygon [[lon, lat], ...]",
    )
    before_start: str = Field(default="2024-06-01", description="Pre-flood reference start (YYYY-MM-DD)")
    before_end: str = Field(default="2024-06-30", description="Pre-flood reference end (YYYY-MM-DD)")
    after_start: str = Field(default="2024-09-15", description="Post-flood crisis start (YYYY-MM-DD)")
    after_end: str = Field(default="2024-10-15", description="Post-flood crisis end (YYYY-MM-DD)")
    project_name: str = Field(default="FloodGuard AI", description="Human-readable project title")
    priority: JobPriority = Field(default=JobPriority.HIGH, description="Scheduling priority level")

    @field_validator("aoi")
    @classmethod
    def validate_aoi(cls, v: Union[str, List[List[float]]]) -> Union[str, List[List[float]]]:
        is_valid, msg = validate_aoi_input(v)
        if not is_valid:
            raise ValueError(msg)
        return v

    @field_validator("before_end")
    @classmethod
    def validate_before_dates(cls, v: str, info) -> str:
        s_date = info.data.get("before_start")
        if s_date:
            validate_date_range(s_date, v)
        return v

    @field_validator("after_end")
    @classmethod
    def validate_after_dates(cls, v: str, info) -> str:
        s_date = info.data.get("after_start")
        if s_date:
            validate_date_range(s_date, v)
        return v


class AnalysisSubmissionResponse(BaseModel):
    """Response returned upon submission of an analysis task."""

    job_id: str
    status: str
    estimated_queue_position: int = Field(default=1, description="Estimated position in execution queue")
    project_name: str
    aoi: Union[str, List[List[float]]]
    created_at: str
    priority: JobPriority = Field(default=JobPriority.HIGH, description="Execution priority level")


# Backward-compatibility alias
AnalysisResponse = AnalysisSubmissionResponse


class PipelineSummarySchema(BaseModel):
    """Metadata summary of the unified pipeline execution."""

    execution_id: str
    pipeline_version: str
    stage2_version: str
    stage3_version: str
    execution_status: str
    execution_time: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class FloodEventSummarySchema(BaseModel):
    """Spatial summary of delineated flood extent."""

    id: str
    name: str
    country: str
    state: Optional[str] = None
    district: Optional[str] = None
    municipality: Optional[str] = None
    before_date: str
    after_date: str
    flood_area_km2: float
    severity: str
    crs: str
    geometry: Optional[str] = None
    bounding_box: Optional[str] = None


class PopulationSummarySchema(BaseModel):
    """Demographic impact summary."""

    total_affected_population: int
    estimated_displaced_households: int
    children_count: int
    women_count: int
    elderly_count: int
    population_density_per_km2: float
    demographics_breakdown: Optional[Dict[str, Any]] = None


class DisasterStatisticsSummarySchema(BaseModel):
    """Disaster overview statistics."""

    flood_area_km2: float
    affected_buildings_count: int
    affected_roads_km: float
    affected_population: int
    disaster_severity_index: float
    json_summary: Optional[Dict[str, Any]] = None


class FacilityItemSchema(BaseModel):
    """Critical infrastructure facility."""

    id: str
    name: str
    infrastructure_type: str
    hospital: bool
    school: bool
    police: bool
    shelter: bool
    status: str


class InfrastructureSummarySchema(BaseModel):
    """Aggregated infrastructure lifelines."""

    total_submerged_facilities: int
    hospitals_count: int
    schools_count: int
    police_stations_count: int
    shelters_count: int
    facilities: List[FacilityItemSchema] = Field(default_factory=list)


class ReportMetadataSchema(BaseModel):
    """Metadata for an exported report document."""

    id: str
    report_type: str
    format: str
    report_path: str
    download_url: str
    created_at: str


class ArtifactMetadataSchema(BaseModel):
    """Metadata for an exported geospatial deliverable."""

    id: str
    artifact_type: str
    file_path: str
    file_size_bytes: Optional[int] = None
    checksum: Optional[str] = None
    download_url: str
    created_at: str


class AnalysisDetailResponse(BaseModel):
    """
    Consolidated disaster analysis response containing spatial, demographic,
    and infrastructure assessments.
    """

    analysis_id: str
    job_id: str
    job_name: str
    status: str
    progress: int
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_seconds: Optional[float] = None
    pipeline: Optional[PipelineSummarySchema] = None
    flood_event: Optional[FloodEventSummarySchema] = None
    statistics: Optional[DisasterStatisticsSummarySchema] = None
    population: Optional[PopulationSummarySchema] = None
    infrastructure: Optional[InfrastructureSummarySchema] = None
    reports: List[ReportMetadataSchema] = Field(default_factory=list)
    artifacts: List[ArtifactMetadataSchema] = Field(default_factory=list)
