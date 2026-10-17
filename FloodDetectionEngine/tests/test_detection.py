"""
test_detection.py — Unit Tests for Detection Module
===================================================

Tests the vectorization, change detection, morphological cleaning,
and flood mask generation components.  Tests that require GEE
objects are tested for configuration and interface contracts, while
local array and vector operations are thoroughly tested with
synthetic data.
"""

from __future__ import annotations

import json
import os
import numpy as np
import pytest
import affine
import geopandas as gpd
from shapely.geometry import Polygon

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.detection.change_detection import ChangeDetector
from FloodDetectionEngine.detection.morphology import MorphologyCleaner
from FloodDetectionEngine.detection.flood_mask import FloodMaskGenerator
from FloodDetectionEngine.detection.vectorization import Vectorizer


# ── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def default_config(tmp_path) -> EngineConfig:
    """Provide a default EngineConfig pointing to a temporary output dir."""
    return EngineConfig(
        aoi_name="nepal_terai_koshi",
        output_dir=str(tmp_path / "outputs"),
        change_method="log_ratio",
    )


@pytest.fixture
def sample_raster_mask() -> tuple[np.ndarray, affine.Affine, str]:
    """
    Create a synthetic 100x100 binary mask with two distinct flooded patches.
    Georeferenced to Eastern Nepal (EPSG:4326, Koshi basin approx. 87.0°E, 26.5°N).
    """
    mask = np.zeros((100, 100), dtype=np.uint8)
    # Patch 1: 20x20 square
    mask[10:30, 10:30] = 1
    # Patch 2: 15x25 rectangle
    mask[50:65, 60:85] = 1

    # Approx 0.0001 deg resolution (~10m)
    transform = affine.Affine(0.0001, 0.0, 87.0, 0.0, -0.0001, 26.5)
    crs = "EPSG:4326"
    return mask, transform, crs


# ── ChangeDetector Tests ────────────────────────────────────────────────────

class TestChangeDetector:
    """Tests for the ChangeDetector class."""

    def test_init_valid_methods(self):
        for method in ["difference", "ratio", "log_ratio"]:
            cfg = EngineConfig(change_method=method)
            detector = ChangeDetector(cfg)
            assert detector.method == method

    def test_init_invalid_method(self):
        cfg = EngineConfig(change_method="unsupported_method")
        with pytest.raises(ValueError, match="Unknown change method"):
            ChangeDetector(cfg)


# ── MorphologyCleaner Tests ─────────────────────────────────────────────────

class TestMorphologyCleaner:
    """Tests for the MorphologyCleaner configuration and logic."""

    def test_init_parameters(self, default_config):
        cleaner = MorphologyCleaner(default_config)
        assert cleaner.config.morphology_opening_radius == 1
        assert cleaner.config.morphology_closing_radius == 2
        assert cleaner.config.min_mapping_unit_pixels == 8
        assert cleaner.config.fill_holes is True


# ── FloodMaskGenerator Tests ────────────────────────────────────────────────

class TestFloodMaskGenerator:
    """Tests for the FloodMaskGenerator orchestration class."""

    def test_init(self, default_config):
        generator = FloodMaskGenerator(default_config)
        assert generator.config == default_config
        assert isinstance(generator.change_detector, ChangeDetector)
        assert isinstance(generator.morphology_cleaner, MorphologyCleaner)


# ── Vectorizer Tests (Local Raster-to-Vector) ───────────────────────────────

class TestVectorizer:
    """Tests for the local Vectorizer (rasterio/shapely/geopandas)."""

    def test_vectorize_local_success(self, default_config, sample_raster_mask):
        mask, transform, crs = sample_raster_mask
        vectorizer = Vectorizer(default_config)
        gdf = vectorizer.vectorize_local(mask, transform, crs)

        assert isinstance(gdf, gpd.GeoDataFrame)
        assert len(gdf) == 2
        assert "geometry" in gdf.columns
        assert "flood" in gdf.columns
        assert "area_km2" in gdf.columns
        assert "perimeter_km" in gdf.columns

        # Verify areas and perimeters are positive
        assert (gdf["area_km2"] > 0).all()
        assert (gdf["perimeter_km"] > 0).all()
        assert (gdf["flood"] == 1).all()

    def test_vectorize_local_empty_mask(self, default_config, sample_raster_mask):
        _, transform, crs = sample_raster_mask
        empty_mask = np.zeros((100, 100), dtype=np.uint8)
        vectorizer = Vectorizer(default_config)
        gdf = vectorizer.vectorize_local(empty_mask, transform, crs)

        assert isinstance(gdf, gpd.GeoDataFrame)
        assert len(gdf) == 0
        assert "area_km2" in gdf.columns

    def test_save_geojson(self, default_config, sample_raster_mask, tmp_path):
        mask, transform, crs = sample_raster_mask
        vectorizer = Vectorizer(default_config)
        gdf = vectorizer.vectorize_local(mask, transform, crs)

        out_geojson = str(tmp_path / "test_flood.geojson")
        saved_path = vectorizer.save_geojson(gdf, out_geojson)

        assert os.path.exists(saved_path)
        with open(saved_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert data["type"] == "FeatureCollection"
        assert len(data["features"]) == 2

    def test_save_shapefile(self, default_config, sample_raster_mask, tmp_path):
        mask, transform, crs = sample_raster_mask
        vectorizer = Vectorizer(default_config)
        gdf = vectorizer.vectorize_local(mask, transform, crs)

        out_shp = str(tmp_path / "shp_dir" / "test_flood.shp")
        saved_path = vectorizer.save_shapefile(gdf, out_shp)

        assert os.path.exists(saved_path)
        # Check that shapefile components (.shp, .shx, .dbf) were created
        stem = os.path.splitext(saved_path)[0]
        assert os.path.exists(f"{stem}.shx")
        assert os.path.exists(f"{stem}.dbf")

    def test_compute_statistics(self, default_config, sample_raster_mask, tmp_path):
        mask, transform, crs = sample_raster_mask
        vectorizer = Vectorizer(default_config)
        gdf = vectorizer.vectorize_local(mask, transform, crs)

        out_json = str(tmp_path / "stats.json")
        threshold_val = 1.25
        stats = vectorizer.compute_statistics(gdf, threshold_val, out_json)

        assert os.path.exists(out_json)
        assert "flood_detection_summary" in stats
        summary = stats["flood_detection_summary"]
        assert summary["number_of_flood_polygons"] == 2
        assert summary["otsu_threshold"] == 1.25
        assert summary["total_flooded_area_km2"] > 0
        assert summary["largest_polygon_km2"] >= summary["smallest_polygon_km2"]
        assert len(stats["polygon_statistics"]) == 2

        # Verify individual polygon stats
        poly0 = stats["polygon_statistics"][0]
        assert "centroid_lon" in poly0
        assert "centroid_lat" in poly0
        assert "area_km2" in poly0
        assert "perimeter_km" in poly0

    def test_compute_statistics_empty_gdf(self, default_config, tmp_path):
        vectorizer = Vectorizer(default_config)
        empty_gdf = gpd.GeoDataFrame(
            columns=["geometry", "flood", "area_km2", "perimeter_km"],
            crs="EPSG:4326",
        )
        out_json = str(tmp_path / "empty_stats.json")
        stats = vectorizer.compute_statistics(empty_gdf, 0.0, out_json)

        assert stats["flood_detection_summary"]["number_of_flood_polygons"] == 0
        assert stats["flood_detection_summary"]["total_flooded_area_km2"] == 0.0
        assert len(stats["polygon_statistics"]) == 0
