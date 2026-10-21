"""
test_pipeline.py — Integration and Unit Tests for Pipeline Orchestrator
========================================================================

Tests the FloodDetectionPipeline class, PipelineResult dataclass,
configuration validation, argument parser, and stage orchestration.
"""

from __future__ import annotations

import argparse
import sys
from unittest.mock import MagicMock, patch
import numpy as np
import pytest
import affine
import geopandas as gpd

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.pipeline import (
    FloodDetectionPipeline,
    PipelineResult,
    main,
)


# ── PipelineResult Tests ────────────────────────────────────────────────────

class TestPipelineResult:
    """Tests for the PipelineResult dataclass."""

    def test_default_values(self):
        res = PipelineResult()
        assert res.flood_mask_path == ""
        assert res.geojson_path == ""
        assert res.shapefile_path == ""
        assert res.preview_path == ""
        assert res.statistics_path == ""
        assert res.statistics == {}
        assert res.otsu_threshold == 0.0
        assert res.total_flooded_area_km2 == 0.0
        assert res.num_polygons == 0
        assert res.elapsed_seconds == 0.0

    def test_custom_values(self):
        res = PipelineResult(
            flood_mask_path="outputs/FloodMask.tif",
            geojson_path="outputs/FloodPolygon.geojson",
            otsu_threshold=1.45,
            total_flooded_area_km2=24.5,
            num_polygons=12,
        )
        assert res.flood_mask_path == "outputs/FloodMask.tif"
        assert res.otsu_threshold == 1.45
        assert res.total_flooded_area_km2 == 24.5
        assert res.num_polygons == 12


# ── Pipeline Config Validation Tests ────────────────────────────────────────

class TestPipelineValidation:
    """Tests for pipeline initialization and configuration validation."""

    def test_valid_config(self):
        cfg = EngineConfig(
            aoi_name="nepal_terai_koshi",
            before_start="2024-06-01",
            before_end="2024-06-30",
            after_start="2024-09-15",
            after_end="2024-10-15",
        )
        pipeline = FloodDetectionPipeline(cfg)
        assert pipeline.config == cfg

    def test_invalid_date_format(self):
        cfg = EngineConfig(before_start="01-06-2024")
        with pytest.raises(ValueError, match="Invalid before_start"):
            FloodDetectionPipeline(cfg)

    def test_invalid_aoi_name(self):
        cfg = EngineConfig(aoi_name="unknown_region")
        with pytest.raises(ValueError, match="AOI preset 'unknown_region' not found"):
            FloodDetectionPipeline(cfg)


# ── Pipeline Orchestration Mock Tests ───────────────────────────────────────

class TestPipelineMockRun:
    """End-to-end integration test of the pipeline with mocked Earth Engine calls."""

    @patch("FloodDetectionEngine.pipeline.initialize_gee")
    @patch("FloodDetectionEngine.pipeline.SentinelLoader")
    @patch("FloodDetectionEngine.pipeline.Preprocessor")
    @patch("FloodDetectionEngine.pipeline.FloodMaskGenerator")
    @patch("FloodDetectionEngine.pipeline.GeoTIFFExporter")
    @patch("FloodDetectionEngine.pipeline.Vectorizer")
    @patch("FloodDetectionEngine.pipeline.Visualizer")
    @patch("FloodDetectionEngine.pipeline.ee")
    def test_pipeline_run_local_export(
        self,
        mock_ee,
        mock_visualizer_cls,
        mock_vectorizer_cls,
        mock_geotiff_exporter_cls,
        mock_mask_gen_cls,
        mock_preprocessor_cls,
        mock_loader_cls,
        mock_init_gee,
        tmp_path,
    ):
        output_dir = str(tmp_path / "mock_outputs")
        cfg = EngineConfig(
            sensor_type="sar",
            aoi_name="nepal_terai_koshi",
            output_dir=output_dir,
            gee_export_to_drive=False,
        )

        # Mock loader
        mock_loader = MagicMock()
        mock_loader.load_pair.return_value = (MagicMock(), MagicMock())
        mock_loader.aoi = MagicMock()
        mock_loader_cls.return_value = mock_loader

        # Mock preprocessor
        mock_preprocessor = MagicMock()
        mock_preprocessor.preprocess.return_value = MagicMock()
        mock_preprocessor_cls.return_value = mock_preprocessor

        # Mock mask generator
        mock_mask_gen = MagicMock()
        mock_change_img = MagicMock()
        mock_flood_mask = MagicMock()
        mock_threshold_ee = MagicMock()
        mock_mask_gen.generate.return_value = (mock_change_img, mock_flood_mask, mock_threshold_ee)
        mock_mask_gen_cls.return_value = mock_mask_gen

        # Mock ee.Number
        mock_ee_num = MagicMock()
        mock_ee_num.getInfo.return_value = 1.345
        mock_ee.Number.return_value = mock_ee_num

        # Mock geotiff exporter
        mock_geotiff = MagicMock()
        synthetic_array = np.zeros((10, 10), dtype=np.uint8)
        meta = {"transform": affine.Affine.identity(), "crs": "EPSG:4326"}
        mock_geotiff.download_ee_image.return_value = (synthetic_array, meta)
        mock_geotiff_exporter_cls.return_value = mock_geotiff

        # Mock vectorizer
        mock_vec = MagicMock()
        mock_gdf = gpd.GeoDataFrame(
            {"geometry": [], "flood": [], "area_km2": [], "perimeter_km": []},
            crs="EPSG:4326",
        )
        mock_vec.vectorize_local.return_value = mock_gdf
        mock_vec.save_geojson.return_value = f"{output_dir}/FloodPolygon.geojson"
        mock_vec.save_shapefile.return_value = f"{output_dir}/FloodPolygon.shp"
        mock_vec.compute_statistics.return_value = {
            "flood_detection_summary": {
                "total_flooded_area_km2": 15.2,
                "number_of_flood_polygons": 5,
            }
        }
        mock_vectorizer_cls.return_value = mock_vec

        # Mock visualizer
        mock_vis = MagicMock()
        mock_vis.render_flood_preview.return_value = f"{output_dir}/FloodPreview.png"
        mock_visualizer_cls.return_value = mock_vis

        # Run pipeline
        pipeline = FloodDetectionPipeline(cfg)
        result = pipeline.run()

        # Assertions on pipeline result
        assert isinstance(result, PipelineResult)
        assert result.otsu_threshold == 1.345
        assert result.total_flooded_area_km2 == 15.2
        assert result.num_polygons == 5
        assert result.geojson_path.endswith("FloodPolygon.geojson")
        assert result.shapefile_path.endswith("FloodPolygon.shp")
        assert result.preview_path.endswith("FloodPreview.png")
        assert result.elapsed_seconds >= 0.0

        # Assertions on calls
        mock_init_gee.assert_called_once_with(cfg)
        mock_loader.load_pair.assert_called_once()
        assert mock_preprocessor.preprocess.call_count == 2
        mock_mask_gen.generate.assert_called_once()
        mock_vec.vectorize_local.assert_called_once()
        mock_vis.render_flood_preview.assert_called_once()

    def test_pipeline_run_optical_offline(self, tmp_path):
        """End-to-end test of the optical pipeline running on local test scene."""
        output_dir = str(tmp_path / "optical_outputs")
        cfg = EngineConfig(
            sensor_type="optical",
            spectral_index="mndwi",
            aoi_name="nepal_terai_koshi",
            output_dir=output_dir,
            gee_export_to_drive=False,
        )
        pipeline = FloodDetectionPipeline(cfg)
        result = pipeline.run()

        assert isinstance(result, PipelineResult)
        assert result.sensor_type == "optical"
        assert result.spectral_index == "mndwi"
        assert result.total_flooded_area_km2 > 0
        assert result.num_polygons > 0
        assert result.geojson_path.endswith("FloodPolygon.geojson")
        assert result.shapefile_path.endswith("FloodPolygon.shp")
        assert result.flood_mask_path.endswith("FloodMask.tif")
        assert result.accuracy_report_path.endswith("AccuracyValidation.json")
        assert result.accuracy_metrics is not None
        assert "iou_jaccard" in result.accuracy_metrics
        assert result.accuracy_metrics["iou_jaccard"] > 0.8
