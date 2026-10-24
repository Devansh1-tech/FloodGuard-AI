"""
test_virtual_constellation.py — Unit Tests for GEE Multi-Satellite Constellation
================================================================================

Tests Phase 1 components:
  1. ModisLoader daily 250m/500m ingestion & synthetic spectrum
  2. JrcWaterLoader 38-year permanent baseline & river/flood separation
  3. VirtualConstellationResolver multi-sensor fallback hierarchy & gap bridging
"""

from __future__ import annotations

import numpy as np
import pytest

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.gee.modis_loader import ModisLoader
from FloodDetectionEngine.gee.jrc_water_loader import JrcWaterLoader
from FloodDetectionEngine.gee.virtual_constellation import (
    VirtualConstellationResolver,
    VirtualConstellationResult,
)


class TestModisLoader:
    """Verify daily MODIS 250m/500m ingestion module."""

    def test_modis_loader_initialization(self) -> None:
        cfg = EngineConfig(aoi_name="nepal_terai_koshi")
        loader = ModisLoader(cfg)
        assert loader.TERRA_COLLECTION == "MODIS/061/MOD09GA"
        assert loader.AQUA_COLLECTION == "MODIS/061/MYD09GA"

    def test_synthetic_modis_daily_bands(self) -> None:
        cfg = EngineConfig()
        loader = ModisLoader(cfg)
        bands = loader.generate_synthetic_modis_daily(height=100, width=150)

        assert "sur_refl_b01" in bands  # Red 250m
        assert "sur_refl_b02" in bands  # NIR 250m
        assert "sur_refl_b04" in bands  # Green 500m
        assert "sur_refl_b06" in bands  # SWIR1 500m

        assert bands["sur_refl_b01"].shape == (100, 150)
        assert bands["sur_refl_b02"].shape == (100, 150)
        assert np.all(bands["sur_refl_b01"] >= 0.0)
        assert np.all(bands["sur_refl_b02"] >= 0.0)

    def test_modis_ndwi_water_extraction(self) -> None:
        cfg = EngineConfig()
        loader = ModisLoader(cfg)
        bands = loader.generate_synthetic_modis_daily(height=100, width=150, flood_expansion_factor=1.5)

        green = bands["sur_refl_b04"]
        nir = bands["sur_refl_b02"]
        # NDWI = (Green - NIR) / (Green + NIR)
        ndwi = (green - nir) / (green + nir + 1e-6)

        water_pixels = np.sum(ndwi > 0.0)
        assert water_pixels > 0, "MODIS NDWI should identify river/flood pixels"


class TestJrcWaterLoader:
    """Verify JRC 38-year permanent water baseline and river separation."""

    def test_jrc_loader_initialization(self) -> None:
        cfg = EngineConfig()
        loader = JrcWaterLoader(cfg)
        assert loader.JRC_COLLECTION == "JRC/GSW1_4/GlobalSurfaceWater"

    def test_synthetic_permanent_baseline(self) -> None:
        cfg = EngineConfig()
        loader = JrcWaterLoader(cfg)
        baseline = loader.generate_synthetic_permanent_baseline(height=100, width=150)

        assert "occurrence" in baseline
        assert "seasonality" in baseline
        assert "permanent_mask" in baseline

        assert baseline["permanent_mask"].shape == (100, 150)
        # Verify that permanent river channel pixels are present
        assert np.sum(baseline["permanent_mask"]) > 0

    def test_river_and_flood_separation(self) -> None:
        cfg = EngineConfig()
        loader = JrcWaterLoader(cfg)
        baseline = loader.generate_synthetic_permanent_baseline(height=100, width=150)
        perm_mask = baseline["permanent_mask"]

        # Simulate detected surface water covering permanent channel PLUS extra flooded land
        detected_water = perm_mask.copy().astype(bool)
        # Add flood overbank spilling
        detected_water[40:60, 20:50] = True

        normal_river, active_flood, metrics = loader.separate_river_and_flood_arrays(
            detected_water, perm_mask
        )

        assert np.all(normal_river[perm_mask == 1]), "Permanent water must be classified as normal river flow"
        assert np.all(active_flood[perm_mask == 1] == False), "Permanent water must NOT be classified as flood anomaly"
        assert metrics["normal_river_pixels"] > 0
        assert metrics["active_flood_pixels"] > 0
        assert metrics["flood_anomaly_percentage"] > 0.0


class TestVirtualConstellationResolver:
    """Verify multi-satellite fallback engine and gap bridging."""

    def test_resolver_initialization(self) -> None:
        resolver = VirtualConstellationResolver()
        assert resolver.config is not None
        assert resolver.s1_loader is not None
        assert resolver.modis_loader is not None
        assert resolver.jrc_loader is not None

    def test_offline_synthetic_resolution(self) -> None:
        resolver = VirtualConstellationResolver()
        result = resolver.resolve_offline_synthetic(target_date="2024-10-04")

        assert isinstance(result, VirtualConstellationResult)
        assert result.status == "success"
        assert result.selected_sensor in [
            "Sentinel-1 SAR",
            "Sentinel-2 MSI",
            "MODIS Daily (Terra + Aqua)",
        ]
        assert result.resolution_m in [10, 30, 250]
        assert result.confidence_score > 0.5
        assert result.total_water_km2 >= result.normal_river_km2
        assert result.active_flood_km2 >= 0.0
        assert len(result.candidates_evaluated) >= 3

    def test_force_sensor_selection(self) -> None:
        resolver = VirtualConstellationResolver()

        # Force MODIS Daily fallback
        modis_res = resolver.resolve_offline_synthetic(
            target_date="2024-10-04",
            force_sensor="MODIS Daily (Terra + Aqua)",
        )
        assert modis_res.selected_sensor == "MODIS Daily (Terra + Aqua)"
        assert modis_res.resolution_m == 250
        assert modis_res.temporal_gap_bridged_days == 3.5

        # Force Sentinel-1 SAR
        s1_res = resolver.resolve_offline_synthetic(
            target_date="2024-10-04",
            force_sensor="Sentinel-1 SAR",
        )
        assert s1_res.selected_sensor == "Sentinel-1 SAR"
        assert s1_res.resolution_m == 10
        assert s1_res.temporal_gap_bridged_days == 0.0
        assert s1_res.confidence_score == 0.96
