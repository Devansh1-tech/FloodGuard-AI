"""
pipeline.py — FloodGuard-AI Main Pipeline Orchestrator
========================================================

This is the **single entry point** for running the complete flood
detection pipeline end-to-end.  It wires together every module in
the correct sequence:

.. code-block:: text

    ┌─────────────────────────────────────────────────────────┐
    │                    PIPELINE STAGES                      │
    ├─────────────────────────────────────────────────────────┤
    │  1. GEE Initialization                                  │
    │  2. Sentinel-1 Loading (before + after composites)      │
    │  3. Preprocessing (border noise → speckle → normalize)  │
    │  4. Change Detection (difference / ratio / log-ratio)   │
    │  5. Otsu Thresholding (automatic)                       │
    │  6. Morphological Cleaning                              │
    │  7. Export — GeoTIFF download                           │
    │  8. Vectorization (raster → polygon)                    │
    │  9. Export — GeoJSON + Shapefile + statistics.json       │
    │ 10. Visualization — FloodPreview.png                    │
    └─────────────────────────────────────────────────────────┘

Usage
-----
::

    from FloodDetectionEngine.config import EngineConfig
    from FloodDetectionEngine.pipeline import FloodDetectionPipeline

    config = EngineConfig(
        aoi_name="nepal_terai_koshi",
        before_start="2024-06-01",
        before_end="2024-06-30",
        after_start="2024-09-15",
        after_end="2024-10-15",
        gee_project="ee-floodguardai",
    )

    pipeline = FloodDetectionPipeline(config)
    results = pipeline.run()

The ``run()`` method returns a ``PipelineResult`` dataclass with
paths to every generated artefact plus summary statistics.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

import ee
import numpy as np

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.gee.initialize import initialize_gee
from FloodDetectionEngine.gee.sentinel_loader import SentinelLoader
from FloodDetectionEngine.gee.preprocessing import Preprocessor
from FloodDetectionEngine.gee.visualization import Visualizer
from FloodDetectionEngine.detection.flood_mask import FloodMaskGenerator
from FloodDetectionEngine.detection.vectorization import Vectorizer
from FloodDetectionEngine.export.export_geotiff import GeoTIFFExporter
from FloodDetectionEngine.export.export_geojson import GeoJSONExporter
from FloodDetectionEngine.utils.logger import get_logger, LogTimer
from FloodDetectionEngine.utils.helper import elapsed_str, save_json


logger = get_logger(__name__)


@dataclass
class PipelineResult:
    """
    Container for all pipeline outputs.

    Attributes
    ----------
    flood_mask_path : str
        Path to ``FloodMask.tif``.
    geojson_path : str
        Path to ``FloodPolygon.geojson``.
    shapefile_path : str
        Path to ``FloodPolygon.shp``.
    preview_path : str
        Path to ``FloodPreview.png``.
    statistics_path : str
        Path to ``statistics.json``.
    statistics : dict
        Parsed statistics dictionary.
    otsu_threshold : float
        The computed Otsu threshold value.
    total_flooded_area_km2 : float
        Total detected flood area in km².
    num_polygons : int
        Number of flood polygons generated.
    elapsed_seconds : float
        Total pipeline wall-clock time.
    """

    flood_mask_path: str = ""
    geojson_path: str = ""
    shapefile_path: str = ""
    preview_path: str = ""
    statistics_path: str = ""
    statistics: Dict[str, Any] = field(default_factory=dict)
    otsu_threshold: float = 0.0
    total_flooded_area_km2: float = 0.0
    num_polygons: int = 0
    elapsed_seconds: float = 0.0


class FloodDetectionPipeline:
    """
    End-to-end flood detection pipeline.

    Parameters
    ----------
    config : EngineConfig
        Complete engine configuration.
    """

    def __init__(self, config: EngineConfig) -> None:
        self.config = config
        self._validate_config()

    def _validate_config(self) -> None:
        """Perform basic configuration validation before running."""
        from FloodDetectionEngine.utils.helper import validate_date_string
        validate_date_string(self.config.before_start, "before_start")
        validate_date_string(self.config.before_end, "before_end")
        validate_date_string(self.config.after_start, "after_start")
        validate_date_string(self.config.after_end, "after_end")
        # Verify AOI resolves
        self.config.get_aoi_coordinates()
        logger.info("Configuration validated successfully.")

    def run(self) -> PipelineResult:
        """
        Execute the full flood detection pipeline.

        Returns
        -------
        PipelineResult
            All output paths and summary statistics.

        Raises
        ------
        RuntimeError
            If any pipeline stage fails.
        """
        result = PipelineResult()
        pipeline_start = time.perf_counter()

        logger.info("=" * 60)
        logger.info("FloodGuard-AI — Flood Detection Pipeline")
        logger.info("=" * 60)

        try:
            # ── Stage 1: GEE Initialization ─────────────────────────────
            with LogTimer("Stage 1: GEE Initialization", logger):
                initialize_gee(self.config)

            # ── Stage 2: Load Sentinel-1 ────────────────────────────────
            with LogTimer("Stage 2: Sentinel-1 Loading", logger):
                loader = SentinelLoader(self.config)
                before_raw, after_raw = loader.load_pair()
                aoi = loader.aoi

            # ── Stage 3: Preprocessing ──────────────────────────────────
            with LogTimer("Stage 3: Preprocessing", logger):
                preprocessor = Preprocessor(self.config)
                before_processed = preprocessor.preprocess(before_raw)
                after_processed = preprocessor.preprocess(after_raw)

            # ── Stages 4-6: Flood Mask Generation ───────────────────────
            with LogTimer("Stages 4-6: Flood Mask Generation", logger):
                mask_gen = FloodMaskGenerator(self.config)
                change_image, flood_mask, threshold_ee = mask_gen.generate(
                    before_processed, after_processed, aoi
                )

            # Get threshold as local value
            threshold_val = ee.Number(threshold_ee).getInfo()
            result.otsu_threshold = threshold_val
            logger.info("Otsu threshold: %.4f", threshold_val)

            # ── Stage 7: Export GeoTIFF ─────────────────────────────────
            geotiff_exporter = GeoTIFFExporter(self.config)

            if self.config.gee_export_to_drive:
                # Drive export path
                with LogTimer("Stage 7: Export to Drive", logger):
                    geotiff_exporter.export_to_drive(
                        image=flood_mask.toFloat(),
                        description="FloodMask",
                        region=aoi,
                    )
                    geotiff_exporter.export_to_drive(
                        image=before_processed.toFloat(),
                        description="Before_SAR",
                        region=aoi,
                    )
                    geotiff_exporter.export_to_drive(
                        image=after_processed.toFloat(),
                        description="After_SAR",
                        region=aoi,
                    )
                    geotiff_exporter.export_to_drive(
                        image=change_image.toFloat(),
                        description="Change_Image",
                        region=aoi,
                    )
                logger.info("Drive export tasks submitted. Check your Google Drive.")
                result.flood_mask_path = "Google Drive"
            else:
                # Local download path
                with LogTimer("Stage 7: Download & Export GeoTIFF", logger):
                    # Download flood mask
                    flood_mask_array, mask_meta = geotiff_exporter.download_ee_image(
                        image=flood_mask.toFloat(),
                        region=aoi,
                        output_path=self.config.get_output_path(
                            self.config.export_flood_mask_filename
                        ),
                    )
                    result.flood_mask_path = self.config.get_output_path(
                        self.config.export_flood_mask_filename
                    )

                    # Download before/after/change for visualization
                    before_array, _ = geotiff_exporter.download_ee_image(
                        image=before_processed.toFloat(),
                        region=aoi,
                        output_path=self.config.get_output_path("Before_SAR.tif"),
                    )
                    after_array, _ = geotiff_exporter.download_ee_image(
                        image=after_processed.toFloat(),
                        region=aoi,
                        output_path=self.config.get_output_path("After_SAR.tif"),
                    )
                    change_array, _ = geotiff_exporter.download_ee_image(
                        image=change_image.toFloat(),
                        region=aoi,
                        output_path=self.config.get_output_path("Change_Image.tif"),
                    )

                # ── Stage 8: Vectorization ──────────────────────────────
                with LogTimer("Stage 8: Vectorization", logger):
                    vectorizer = Vectorizer(self.config)
                    gdf = vectorizer.vectorize_local(
                        flood_mask_array=flood_mask_array,
                        transform=mask_meta["transform"],
                        crs=mask_meta["crs"],
                    )

                # ── Stage 9: Export GeoJSON + Shapefile + Stats ─────────
                with LogTimer("Stage 9: Vector Export", logger):
                    result.geojson_path = vectorizer.save_geojson(gdf)
                    result.shapefile_path = vectorizer.save_shapefile(gdf)
                    stats = vectorizer.compute_statistics(
                        gdf, threshold_val
                    )
                    result.statistics_path = self.config.get_output_path(
                        self.config.export_statistics_filename
                    )
                    result.statistics = stats
                    result.total_flooded_area_km2 = stats["flood_detection_summary"].get(
                        "total_flooded_area_km2", 0.0
                    )
                    result.num_polygons = stats["flood_detection_summary"].get(
                        "number_of_flood_polygons", 0
                    )

                # ── Stage 10: Visualization ─────────────────────────────
                with LogTimer("Stage 10: Visualization", logger):
                    visualizer = Visualizer(self.config)
                    result.preview_path = visualizer.render_flood_preview(
                        before_array=before_array,
                        after_array=after_array,
                        difference_array=change_array,
                        flood_mask_array=flood_mask_array,
                        output_path=self.config.get_output_path(
                            self.config.export_preview_filename
                        ),
                    )

        except Exception as exc:
            logger.error("Pipeline failed: %s", exc, exc_info=True)
            raise

        finally:
            result.elapsed_seconds = time.perf_counter() - pipeline_start
            logger.info("=" * 60)
            logger.info(
                "Pipeline finished in %s",
                elapsed_str(result.elapsed_seconds),
            )
            logger.info("=" * 60)

        # ── Summary ─────────────────────────────────────────────────────
        logger.info("── Results Summary ──")
        logger.info("  Flood Mask  : %s", result.flood_mask_path)
        logger.info("  GeoJSON     : %s", result.geojson_path)
        logger.info("  Shapefile   : %s", result.shapefile_path)
        logger.info("  Preview     : %s", result.preview_path)
        logger.info("  Statistics  : %s", result.statistics_path)
        logger.info("  Threshold   : %.4f", result.otsu_threshold)
        logger.info("  Flooded Area: %.4f km²", result.total_flooded_area_km2)
        logger.info("  Polygons    : %d", result.num_polygons)

        return result


# ── CLI entry point ─────────────────────────────────────────────────────────

def main() -> None:
    """
    Command-line entry point for the flood detection pipeline.

    Reads configuration from defaults (can be overridden programmatically)
    and runs the full pipeline.
    """
    import argparse
    import sys

    parser = argparse.ArgumentParser(
        description="FloodGuard-AI — Flood Detection Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--aoi",
        type=str,
        default="nepal_terai_koshi",
        help="AOI preset name or 'custom' (default: nepal_terai_koshi)",
    )
    parser.add_argument(
        "--before-start",
        type=str,
        default="2024-06-01",
        help="Pre-event window start date (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--before-end",
        type=str,
        default="2024-06-30",
        help="Pre-event window end date (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--after-start",
        type=str,
        default="2024-09-15",
        help="Post-event window start date (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--after-end",
        type=str,
        default="2024-10-15",
        help="Post-event window end date (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--method",
        type=str,
        default="log_ratio",
        choices=["difference", "ratio", "log_ratio"],
        help="Change detection method (default: log_ratio)",
    )
    parser.add_argument(
        "--project",
        type=str,
        default=None,
        help="GEE project ID (e.g. ee-floodguardai)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="outputs",
        help="Output directory (default: outputs)",
    )
    parser.add_argument(
        "--drive",
        action="store_true",
        help="Export to Google Drive instead of local download",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level (default: INFO)",
    )

    args = parser.parse_args()

    config = EngineConfig(
        aoi_name=args.aoi,
        before_start=args.before_start,
        before_end=args.before_end,
        after_start=args.after_start,
        after_end=args.after_end,
        change_method=args.method,
        gee_project=args.project,
        output_dir=args.output_dir,
        gee_export_to_drive=args.drive,
        log_level=args.log_level,
    )

    pipeline = FloodDetectionPipeline(config)
    result = pipeline.run()

    print("\n" + "=" * 50)
    print("FloodGuard-AI — Pipeline Complete")
    print("=" * 50)
    print(f"  Flooded Area : {result.total_flooded_area_km2:.4f} km²")
    print(f"  Polygons     : {result.num_polygons}")
    print(f"  Threshold    : {result.otsu_threshold:.4f}")
    print(f"  Time         : {elapsed_str(result.elapsed_seconds)}")
    print(f"  Outputs in   : {config.output_dir}/")
    print("=" * 50)


if __name__ == "__main__":
    main()
