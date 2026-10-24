"""
test_flood_segmentation.py — Unit Tests for Phase 2 Detection, Filtering & Area Engine
======================================================================================

Tests:
  1. TopographicFilter HAND and slope false-positive elimination
  2. FloodSegmentationEngine river normal flow vs active flood separation
  3. Geodesic area quantification in km² and hectares (1 km² = 100 ha)
  4. Land cover impact breakdown (cropland/paddy vs settlement built-up)
"""

from __future__ import annotations

import numpy as np
import pytest

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.detection.topographic_filter import (
    TopographicFilter,
    TopographicFilterMetrics,
)
from FloodDetectionEngine.detection.flood_segmentation_engine import (
    FloodSegmentationEngine,
    FloodSegmentationResult,
    LandCoverImpact,
)


class TestTopographicFilter:
    """Verify HAND and Slope terrain physics constraints."""

    def test_topographic_filter_initialization(self) -> None:
        tf = TopographicFilter(max_slope_degrees=5.0, max_hand_meters=15.0, min_mapping_unit_pixels=8)
        assert tf.max_slope == 5.0
        assert tf.max_hand == 15.0
        assert tf.min_mmu == 8

    def test_slope_and_hand_elimination(self) -> None:
        tf = TopographicFilter(max_slope_degrees=5.0, max_hand_meters=15.0, min_mapping_unit_pixels=4)

        # 50x50 test domain
        raw_water = np.zeros((50, 50), dtype=np.uint8)
        slope = np.zeros((50, 50), dtype=np.float32)
        hand = np.zeros((50, 50), dtype=np.float32)

        # 1. Valid lowland flood patch (HAND 2m, slope 1°, 16 pixels)
        raw_water[10:14, 10:14] = 1
        slope[10:14, 10:14] = 1.0
        hand[10:14, 10:14] = 2.0

        # 2. Mountain radar shadow false positive (HAND 2m, slope 18°, 16 pixels)
        raw_water[20:24, 20:24] = 1
        slope[20:24, 20:24] = 18.0
        hand[20:24, 20:24] = 2.0

        # 3. High elevation perched noise (HAND 35m, slope 1°, 16 pixels)
        raw_water[30:34, 30:34] = 1
        slope[30:34, 30:34] = 1.0
        hand[30:34, 30:34] = 35.0

        cleaned_mask, metrics = tf.filter_terrain_artifacts(raw_water, slope, hand)

        # Only the valid lowland flood patch should survive
        assert np.all(cleaned_mask[10:14, 10:14] == 1), "Lowland flood must survive"
        assert np.all(cleaned_mask[20:24, 20:24] == 0), "Steep slope shadow must be rejected"
        assert np.all(cleaned_mask[30:34, 30:34] == 0), "High HAND perched water must be rejected"

        assert metrics.total_raw_water_pixels == 48
        assert metrics.cleaned_flood_pixels == 16
        assert metrics.rejected_slope_pixels == 16
        assert metrics.rejected_high_hand_pixels == 16
        assert metrics.false_positive_rejection_pct > 60.0

    def test_mmu_noise_filtering(self) -> None:
        tf = TopographicFilter(max_slope_degrees=10.0, max_hand_meters=20.0, min_mapping_unit_pixels=8)

        raw_water = np.zeros((30, 30), dtype=np.uint8)
        slope = np.zeros((30, 30), dtype=np.float32)
        hand = np.zeros((30, 30), dtype=np.float32)

        # Small 2-pixel isolated noise speckle (smaller than MMU=8)
        raw_water[5, 5:7] = 1

        # Legitimate 12-pixel flood polygon (larger than MMU=8)
        raw_water[15:18, 15:19] = 1

        cleaned_mask, metrics = tf.filter_terrain_artifacts(raw_water, slope, hand)

        assert np.all(cleaned_mask[5, 5:7] == 0), "Isolated 2-pixel speckle must be filtered out"
        assert np.all(cleaned_mask[15:18, 15:19] == 1), "12-pixel flood feature must survive"
        assert metrics.rejected_mmu_noise_pixels == 2


class TestFloodSegmentationEngine:
    """Verify complete segmentation, normal river separation & land-cover metrics."""

    def test_offline_segmentation_execution(self) -> None:
        cfg = EngineConfig(aoi_name="nepal_terai_koshi")
        engine = FloodSegmentationEngine(cfg)
        result = engine.execute_offline_segmentation(height=100, width=150, flood_severity_scale=1.2)

        assert isinstance(result, FloodSegmentationResult)
        assert result.status == "success"
        assert result.total_water_detected_km2 > 0.0
        assert result.normal_river_flow_km2 > 0.0
        assert result.active_flood_inundation_km2 > 0.0

        # Exact conversion: 1 km² = 100 hectares
        expected_ha = round(result.active_flood_inundation_km2 * 100.0, 1)
        assert abs(result.active_flood_inundation_hectares - expected_ha) <= 0.2

        # Land cover impact breakdown
        lc = result.land_cover_impact
        assert isinstance(lc, LandCoverImpact)
        assert lc.cropland_paddy_ha > 0.0
        assert lc.settlement_builtup_ha > 0.0
        assert lc.cropland_paddy_km2 + lc.settlement_builtup_km2 <= result.active_flood_inundation_km2

        # Severity level assignment
        assert result.severity_level in ["Minor", "Moderate", "Severe", "Catastrophic"]
        assert result.polygons_count >= 1

    def test_river_vs_flood_differentiation(self) -> None:
        cfg = EngineConfig(aoi_name="nepal_terai_koshi")
        engine = FloodSegmentationEngine(cfg)
        res = engine.execute_offline_segmentation(flood_severity_scale=0.5)

        # Inundation anomaly percentage must be valid
        assert 0.0 <= res.flood_anomaly_percentage <= 100.0
        # Active flood must not equal total water (since permanent river is separated)
        assert res.active_flood_inundation_km2 < res.total_water_detected_km2
