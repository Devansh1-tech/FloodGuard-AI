"""
metadata.py — Execution Provenance & Audit Metadata Generator
=============================================================

Generates structured provenance and audit metadata (metadata.json) for every
pipeline run, recording execution environment, parameters, and generated files.
"""

from __future__ import annotations

import json
import os
import platform
import sys
from pathlib import Path
from typing import Any, Dict

from pipeline.execution_context import PipelineContext


class MetadataGenerator:
    """
    Constructs and exports standardized execution provenance metadata.
    """

    PIPELINE_VERSION = "1.0.0"
    STAGE2_VERSION = "1.0.0"
    STAGE3_VERSION = "1.0.0"

    @classmethod
    def generate_metadata_payload(cls, ctx: PipelineContext) -> Dict[str, Any]:
        """
        Build the comprehensive audit metadata dictionary.
        """
        payload = {
            "metadata_version": "1.0.0",
            "system_info": {
                "pipeline_version": cls.PIPELINE_VERSION,
                "stage2_version": cls.STAGE2_VERSION,
                "stage3_version": cls.STAGE3_VERSION,
                "python_version": sys.version.split()[0],
                "platform": platform.platform(),
                "os_name": platform.system(),
                "machine": platform.machine(),
                "processor": platform.processor(),
            },
            "execution": {
                "execution_id": ctx.execution_id,
                "project_name": ctx.project_name,
                "status": ctx.status,
                "start_time_utc": ctx.start_time_iso,
                "end_time_utc": ctx.end_time_iso,
                "elapsed_seconds": ctx.get_elapsed_seconds(),
            },
            "input_parameters": {
                "aoi": ctx.aoi if isinstance(ctx.aoi, str) else "custom_polygon",
                "before_date_start": ctx.before_date[0],
                "before_date_end": ctx.before_date[1],
                "after_date_start": ctx.after_date[0],
                "after_date_end": ctx.after_date[1],
                "earth_engine_project": os.getenv("EE_PROJECT_ID", "home-credit-505106"),
            },
            "generated_files": ctx.generated_files,
            "disaster_summary_highlights": {
                "flood": ctx.flood_statistics,
                "impact": {
                    "affected_population": ctx.impact_statistics.get("disaster_overview", {}).get("affected_population_total", 0),
                    "flooded_buildings": ctx.impact_statistics.get("disaster_overview", {}).get("flooded_buildings_count", 0),
                    "flooded_roads_km": ctx.impact_statistics.get("disaster_overview", {}).get("flooded_road_length_km", 0.0),
                    "flooded_facilities": ctx.impact_statistics.get("disaster_overview", {}).get("flooded_facilities_count", 0),
                },
            },
            "diagnostics": {
                "warnings_count": len(ctx.warnings),
                "errors_count": len(ctx.errors),
                "warnings": ctx.warnings,
                "errors": ctx.errors,
            },
        }

        return payload

    @classmethod
    def write_metadata_file(cls, ctx: PipelineContext) -> Path:
        """
        Serialize metadata to metadata/metadata.json inside the run directory.
        """
        payload = cls.generate_metadata_payload(ctx)
        ctx.metadata = payload

        out_path = ctx.metadata_dir / "metadata.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

        ctx.add_generated_file("metadata", "execution_metadata", out_path)
        return out_path
