"""
stage2_runner.py — Stage 2 (Sentinel-1 Flood Detection Engine) Runner
=====================================================================

Executes the Stage 2 Earth Observation pipeline (FloodDetectionEngine),
capturing flood rasters, vectorized flood polygons, preview visuals, and statistics.
"""

from __future__ import annotations

import os
import shutil
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

from pipeline.execution_context import PipelineContext
from pipeline.exceptions import Stage2Error

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.pipeline import FloodDetectionPipeline, PipelineResult as S2Result


@dataclass
class Stage2RunOutput:
    """Artifacts and telemetry produced by Stage 2."""
    flood_mask_path: str
    flood_polygon_geojson: str
    flood_polygon_shp: str
    preview_path: str
    statistics_path: str
    statistics: Dict[str, Any]
    total_flooded_area_km2: float
    elapsed_seconds: float


class Stage2Runner:
    """
    Executes and monitors the Stage 2 Flood Detection Engine.
    """

    def __init__(self, context: PipelineContext) -> None:
        self.context = context

    def run(self) -> Stage2RunOutput:
        """
        Execute FloodDetectionEngine with parameters from context.

        Returns
        -------
        Stage2RunOutput
            Generated files and summary metrics.

        Raises
        ------
        Stage2Error
            If Sentinel-1 downloading, processing, or vectorization fails.
        """
        t0 = time.perf_counter()
        flood_dir = str(self.context.flood_dir)

        # Configure Stage 2 Engine
        is_preset = isinstance(self.context.aoi, str)
        sensor_type = getattr(self.context, "sensor_type", "optical")
        spectral_index = getattr(self.context, "spectral_index", "mndwi")

        s2_config = EngineConfig(
            aoi_name=self.context.aoi if is_preset else "custom",
            aoi_coords=None if is_preset else self.context.aoi,
            before_start=self.context.before_date[0],
            before_end=self.context.before_date[1],
            after_start=self.context.after_date[0],
            after_end=self.context.after_date[1],
            sensor_type=sensor_type,
            spectral_index=spectral_index,
            output_dir=flood_dir,
            gee_project=os.getenv("EE_PROJECT_ID", "home-credit-505106"),
            log_file=str(self.context.log_file),
            export_scale=30,  # Fast and memory-safe resolution for rapid disaster response
        )

        try:
            pipeline = FloodDetectionPipeline(s2_config)
            result: S2Result = pipeline.run()

            elapsed = round(time.perf_counter() - t0, 2)

            # Record files in context
            self.context.add_generated_file("flood", "flood_mask_geotiff", result.flood_mask_path)
            self.context.add_generated_file("flood", "flood_polygon_geojson", result.geojson_path)
            self.context.add_generated_file("flood", "flood_polygon_shapefile", result.shapefile_path)
            self.context.add_generated_file("flood", "statistics_json", result.statistics_path)

            if getattr(result, "accuracy_report_path", None) and os.path.exists(result.accuracy_report_path):
                self.context.add_generated_file("flood", "accuracy_validation_json", result.accuracy_report_path)

            # Copy preview image to maps directory
            if result.preview_path and os.path.exists(result.preview_path):
                dest_map = self.context.maps_dir / Path(result.preview_path).name
                shutil.copy2(result.preview_path, dest_map)
                self.context.add_generated_file("maps", "flood_preview", dest_map)

            self.context.flood_statistics = result.statistics

            output = Stage2RunOutput(
                flood_mask_path=result.flood_mask_path,
                flood_polygon_geojson=result.geojson_path,
                flood_polygon_shp=result.shapefile_path,
                preview_path=result.preview_path,
                statistics_path=result.statistics_path,
                statistics=result.statistics,
                total_flooded_area_km2=result.total_flooded_area_km2,
                elapsed_seconds=elapsed,
            )
            return output

        except Exception as exc:
            raise Stage2Error(
                f"Stage 2 Flood Detection failed: {exc}",
                details=str(exc),
            ) from exc
