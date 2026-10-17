"""
stage3_runner.py — Stage 3 (Settlement Impact Assessment Engine) Runner
======================================================================

Executes the Stage 3 Settlement Impact Assessment Engine, automatically ingesting
the Stage 2 flood polygon to evaluate administrative, settlement, infrastructure,
transportation, and human exposure impacts.
"""

from __future__ import annotations

import os
import shutil
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

from pipeline.execution_context import PipelineContext
from pipeline.exceptions import Stage3Error

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.pipeline import SettlementImpactPipeline, ImpactPipelineResult as S3Result


@dataclass
class Stage3RunOutput:
    """Artifacts and telemetry produced by Stage 3."""
    total_flood_area_km2: float
    affected_population: int
    flooded_buildings_count: int
    flooded_roads_km: float
    flooded_facilities_count: int
    affected_districts_count: int
    affected_municipalities_count: int
    isolated_settlements_count: int
    vector_paths: Dict[str, str]
    table_paths: Dict[str, str]
    report_paths: Dict[str, str]
    map_paths: Dict[str, str]
    damage_statistics: Dict[str, Any]
    dashboard_data: Dict[str, Any]
    impact_report: Dict[str, Any]
    elapsed_seconds: float


class Stage3Runner:
    """
    Executes and monitors the Stage 3 Settlement Impact Assessment Engine.
    """

    def __init__(self, context: PipelineContext) -> None:
        self.context = context

    def run(self, flood_polygon_path: Optional[str] = None) -> Stage3RunOutput:
        """
        Execute SettlementImpactEngine using the Stage 2 flood polygon.

        Parameters
        ----------
        flood_polygon_path : str | None
            Path to the FloodPolygon.geojson produced by Stage 2.

        Returns
        -------
        Stage3RunOutput
            Generated analytical layers, maps, reports, and disaster metrics.

        Raises
        ------
        Stage3Error
            If core impact assessment encounters an unrecoverable failure.
        """
        t0 = time.perf_counter()
        impact_dir = str(self.context.impact_dir)

        # Configure Stage 3 Engine
        s3_config = ImpactConfig(
            flood_polygon_path=flood_polygon_path,
            output_dir=impact_dir,
            aoi_name=self.context.aoi if isinstance(self.context.aoi, str) else "nepal_terai_koshi",
            generate_visualizations=True,
            enable_network_analysis=True,
        )

        try:
            pipeline = SettlementImpactPipeline(s3_config)
            result: S3Result = pipeline.run()

            # Move/Organize generated files into clean subdirectories
            # 1. Maps -> context.maps_dir
            clean_maps = {}
            for map_key, map_path in result.map_paths.items():
                if map_path and os.path.exists(map_path):
                    dest = self.context.maps_dir / Path(map_path).name
                    if Path(map_path) != dest:
                        shutil.copy2(map_path, dest)
                    clean_maps[map_key] = str(dest)
                    self.context.add_generated_file("maps", map_key, dest)

            # 2. Reports & Tables -> context.reports_dir
            clean_reports = {}
            for rep_key, rep_path in result.report_paths.items():
                if rep_path and os.path.exists(rep_path):
                    dest = self.context.reports_dir / Path(rep_path).name
                    if Path(rep_path) != dest:
                        shutil.copy2(rep_path, dest)
                    clean_reports[rep_key] = str(dest)
                    self.context.add_generated_file("reports", rep_key, dest)

            clean_tables = {}
            for tab_key, tab_path in result.table_paths.items():
                if tab_path and os.path.exists(tab_path):
                    dest = self.context.reports_dir / Path(tab_path).name
                    if Path(tab_path) != dest:
                        shutil.copy2(tab_path, dest)
                    clean_tables[tab_key] = str(dest)
                    self.context.add_generated_file("reports", tab_key, dest)

            # 3. Vector Layers -> context.impact_dir
            clean_vectors = {}
            for vec_key, vec_path in result.vector_paths.items():
                if vec_path and os.path.exists(vec_path):
                    clean_vectors[vec_key] = str(Path(vec_path).resolve())
                    self.context.add_generated_file("impact", vec_key, vec_path)

            elapsed = round(time.perf_counter() - t0, 2)
            self.context.impact_statistics = result.damage_statistics

            output = Stage3RunOutput(
                total_flood_area_km2=result.total_flood_area_km2,
                affected_population=result.affected_population,
                flooded_buildings_count=result.flooded_buildings_count,
                flooded_roads_km=result.flooded_roads_km,
                flooded_facilities_count=result.flooded_facilities_count,
                affected_districts_count=result.affected_districts_count,
                affected_municipalities_count=result.affected_municipalities_count,
                isolated_settlements_count=result.isolated_settlements_count,
                vector_paths=clean_vectors,
                table_paths=clean_tables,
                report_paths=clean_reports,
                map_paths=clean_maps,
                damage_statistics=result.damage_statistics,
                dashboard_data=result.dashboard_data,
                impact_report=result.impact_report,
                elapsed_seconds=elapsed,
            )
            return output

        except Exception as exc:
            raise Stage3Error(
                f"Stage 3 Settlement Impact Assessment failed: {exc}",
                details=str(exc),
            ) from exc
