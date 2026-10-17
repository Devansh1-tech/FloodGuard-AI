"""
pipeline_result.py — Unified Pipeline Execution Result
======================================================

Standardized output container encapsulating the complete disaster intelligence
lifecycle, ready for direct serialization by FastAPI, Celery, and CLI consumers.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class PipelineResult:
    """
    Consolidated disaster intelligence result returned by the orchestrator.

    Attributes
    ----------
    status : str
        Execution outcome: 'SUCCESS', 'PARTIAL_SUCCESS', or 'FAILED'.
    execution_id : str
        Unique identifier for the run.
    project_name : str
        Name of the project.
    aoi : str
        Area of Interest identifier.
    elapsed_seconds : float
        Total pipeline execution duration in seconds.
    generated_files : dict
        Hierarchical map of all created file paths grouped by category.
    flood_statistics : dict
        Stage 2 Sentinel-1 SAR detection telemetry.
    impact_statistics : dict
        Stage 3 human, infrastructure, and transport impact telemetry.
    geojson_paths : dict
        All exported GeoJSON vector layers.
    map_paths : dict
        All rendered cartographic PNG map paths.
    report_paths : dict
        All JSON situation reports and summary documents.
    csv_paths : dict
        All tabular CSV exports.
    metadata_path : str
        Path to metadata.json.
    log_path : str
        Path to pipeline.log.
    warnings : list[str]
        Non-fatal diagnostic warnings collected during execution.
    errors : list[str]
        Errors encountered during processing.
    metadata : dict
        Full execution provenance metadata dictionary.
    """

    status: str = "SUCCESS"
    execution_id: str = ""
    project_name: str = "FloodGuard AI"
    aoi: str = ""
    elapsed_seconds: float = 0.0

    # Categorized File Paths
    generated_files: Dict[str, Dict[str, str]] = field(default_factory=dict)
    geojson_paths: Dict[str, str] = field(default_factory=dict)
    map_paths: Dict[str, str] = field(default_factory=dict)
    report_paths: Dict[str, str] = field(default_factory=dict)
    csv_paths: Dict[str, str] = field(default_factory=dict)
    metadata_path: str = ""
    log_path: str = ""

    # Analytical Telemetry
    flood_statistics: Dict[str, Any] = field(default_factory=dict)
    impact_statistics: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_success(self) -> bool:
        """Check if execution completed without fatal failures."""
        return self.status in ["SUCCESS", "PARTIAL_SUCCESS"]

    def to_dict(self) -> Dict[str, Any]:
        """Convert entire result into a clean, JSON-serializable dictionary."""
        return {
            "status": self.status,
            "execution_id": self.execution_id,
            "project_name": self.project_name,
            "aoi": self.aoi,
            "elapsed_seconds": self.elapsed_seconds,
            "paths": {
                "geojsons": self.geojson_paths,
                "maps": self.map_paths,
                "reports": self.report_paths,
                "csvs": self.csv_paths,
                "metadata": self.metadata_path,
                "log": self.log_path,
            },
            "summary_metrics": {
                "flood_area_km2": self.impact_statistics.get("disaster_overview", {}).get("total_flooded_area_km2", 0.0),
                "affected_population": self.impact_statistics.get("disaster_overview", {}).get("affected_population_total", 0),
                "flooded_buildings": self.impact_statistics.get("disaster_overview", {}).get("flooded_buildings_count", 0),
                "flooded_roads_km": self.impact_statistics.get("disaster_overview", {}).get("flooded_road_length_km", 0.0),
                "flooded_facilities": self.impact_statistics.get("disaster_overview", {}).get("flooded_facilities_count", 0),
            },
            "flood_statistics": self.flood_statistics,
            "impact_statistics": self.impact_statistics,
            "warnings": self.warnings,
            "errors": self.errors,
            "metadata": self.metadata,
        }

    def to_json(self, indent: int = 2) -> str:
        """Serialize result to a formatted JSON string."""
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)
