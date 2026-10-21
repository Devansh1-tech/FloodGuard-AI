"""
test_optical_pipeline.py — Unit Tests for Optical Satellite Flood Detection
==========================================================================

Tests:
  - OpticalLoader multi-band optical synthesis & spectral consistency
  - SpectralIndexEngine (MNDWI, NDWI, AWEInsh calculation & change detection)
  - Hydro-conditioned slope masking and morphological cleaning
  - AccuracyAssessor ground-truth validation (IoU, F1, Precision, Recall, Kappa)
"""

from __future__ import annotations

import json
import os
import numpy as np
import pytest

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.gee.optical_loader import OpticalLoader
from FloodDetectionEngine.detection.spectral_indices import (
    compute_mndwi,
    compute_ndwi,
    compute_aweinsh,
    SpectralIndexEngine,
)
from FloodDetectionEngine.evaluation.accuracy_assessor import (
    AccuracyAssessor,
    AccuracyMetrics,
)


class TestOpticalLoader:
    """Verify optical satellite imagery loader and synthesis."""

    def test_optical_loader_initialization(self) -> None:
        cfg = EngineConfig(sensor_type="optical", optical_collection="COPERNICUS/S2_SR_HARMONIZED")
        loader = OpticalLoader(cfg)
        assert loader.collection_name == "COPERNICUS/S2_SR_HARMONIZED"
        assert loader.cloud_thresh == 40.0

    def test_synthetic_optical_bands_structure_and_values(self) -> None:
        cfg = EngineConfig()
        loader = OpticalLoader(cfg)
        pre, post = loader.generate_synthetic_optical_pair(height=100, width=150)

        required_bands = ["B2", "B3", "B4", "B8", "B11", "B12"]
        for b in required_bands:
            assert b in pre, f"Missing band {b} in pre-flood optical"
            assert b in post, f"Missing band {b} in post-flood optical"
            assert pre[b].shape == (100, 150)
            assert post[b].shape == (100, 150)
            assert np.all(pre[b] >= 0.0)
            assert np.all(post[b] >= 0.0)


class TestSpectralIndices:
    """Verify spectral water index formulations and thresholding."""

    def test_mndwi_water_vs_vegetation(self) -> None:
        # Water: Green high (~0.18), SWIR low (~0.02) -> MNDWI > 0.6
        green_water = np.array([0.18])
        swir_water = np.array([0.02])
        mndwi_water = compute_mndwi(green_water, swir_water)
        assert mndwi_water[0] > 0.5

        # Vegetation: Green moderate (~0.08), SWIR moderate (~0.20) -> MNDWI < 0
        green_veg = np.array([0.08])
        swir_veg = np.array([0.20])
        mndwi_veg = compute_mndwi(green_veg, swir_veg)
        assert mndwi_veg[0] < 0.0

    def test_ndwi_water_vs_vegetation(self) -> None:
        # Water: Green high (~0.18), NIR low (~0.03) -> NDWI > 0.5
        green_water = np.array([0.18])
        nir_water = np.array([0.03])
        ndwi_water = compute_ndwi(green_water, nir_water)
        assert ndwi_water[0] > 0.5

        # Vegetation: Green (~0.08), NIR high (~0.45) -> NDWI < 0
        green_veg = np.array([0.08])
        nir_veg = np.array([0.45])
        ndwi_veg = compute_ndwi(green_veg, nir_veg)
        assert ndwi_veg[0] < -0.5

    def test_aweinsh_calculation(self) -> None:
        g = np.array([0.16])
        s1 = np.array([0.02])
        n = np.array([0.03])
        s2 = np.array([0.015])
        awei = compute_aweinsh(g, s1, n, s2)
        # 4*(0.16-0.02) - (0.25*0.03 + 2.75*0.015) = 4*0.14 - (0.0075 + 0.04125) = 0.56 - 0.04875 > 0.5
        assert awei[0] > 0.5

    def test_detect_newly_flooded_change_detection(self) -> None:
        cfg = EngineConfig(spectral_index="mndwi", mndwi_threshold=0.0)
        loader = OpticalLoader(cfg)
        pre, post = loader.generate_synthetic_optical_pair(height=120, width=180)

        engine = SpectralIndexEngine(cfg)
        newly_flooded, pre_water, post_water, stats = engine.detect_newly_flooded(pre, post)

        assert newly_flooded.shape == (120, 180)
        assert pre_water.shape == (120, 180)
        assert post_water.shape == (120, 180)

        # Newly flooded pixels must be a subset of post_water and disjoint from pre_water
        assert np.all((newly_flooded == 1) <= (post_water == 1))
        assert np.all((newly_flooded == 1) & (pre_water == 1) == 0)

        assert stats["pre_flood_water_pixels"] > 0
        assert stats["post_flood_water_pixels"] > stats["pre_flood_water_pixels"]
        assert stats["newly_flooded_pixels"] > 0

    def test_slope_masking_eliminates_steep_terrain(self) -> None:
        cfg = EngineConfig(enable_slope_mask=True, slope_max_degrees=5.0)
        engine = SpectralIndexEngine(cfg)

        pre = {"B3": np.full((50, 50), 0.05), "B8": np.full((50, 50), 0.40), "B11": np.full((50, 50), 0.20)}
        post = {"B3": np.full((50, 50), 0.20), "B8": np.full((50, 50), 0.02), "B11": np.full((50, 50), 0.01)}

        # Steep terrain on left half (15 degrees), flat plain on right half (2 degrees)
        slope = np.zeros((50, 50), dtype=np.float32)
        slope[:, :25] = 15.0
        slope[:, 25:] = 2.0

        newly_flooded, _, _, _ = engine.detect_newly_flooded(pre, post, slope_array=slope)
        # Steep half should be completely masked out
        assert np.sum(newly_flooded[:, :25]) == 0
        # Flat half should detect water
        assert np.sum(newly_flooded[:, 25:]) > 0


class TestAccuracyAssessor:
    """Verify ground-truth accuracy validation metrics."""

    def test_perfect_accuracy(self) -> None:
        mask = np.zeros((50, 50), dtype=np.uint8)
        mask[10:30, 10:30] = 1

        assessor = AccuracyAssessor()
        metrics = assessor.evaluate(mask, mask, reference_source="Unit Test Synthetic")

        assert metrics.iou_jaccard == 1.0
        assert metrics.f1_score_dice == 1.0
        assert metrics.precision == 1.0
        assert metrics.recall == 1.0
        assert metrics.overall_accuracy == 1.0
        assert metrics.cohens_kappa == 1.0

    def test_disjoint_masks(self) -> None:
        mask1 = np.zeros((50, 50), dtype=np.uint8)
        mask1[0:10, 0:10] = 1

        mask2 = np.zeros((50, 50), dtype=np.uint8)
        mask2[20:30, 20:30] = 1

        assessor = AccuracyAssessor()
        metrics = assessor.evaluate(mask1, mask2)

        assert metrics.true_positives == 0
        assert metrics.iou_jaccard == 0.0
        assert metrics.f1_score_dice == 0.0

    def test_koshi_ground_truth_evaluation(self, tmp_path) -> None:
        cfg = EngineConfig(spectral_index="mndwi")
        loader = OpticalLoader(cfg)
        pre, post = loader.generate_synthetic_optical_pair(height=200, width=300)

        engine = SpectralIndexEngine(cfg)
        newly_flooded, _, _, _ = engine.detect_newly_flooded(pre, post)

        assessor = AccuracyAssessor()
        ref_mask = assessor.generate_reference_koshi_mask(shape=(200, 300))
        metrics = assessor.evaluate(newly_flooded, ref_mask, reference_source="Koshi Terai Cloud-Free Truth")

        # High agreement expected between optical detection and reference truth
        assert metrics.iou_jaccard >= 0.80
        assert metrics.f1_score_dice >= 0.88
        assert metrics.overall_accuracy >= 0.90
        assert metrics.flooded_area_detected_km2 > 0

        # Export test
        report_file = str(tmp_path / "AccuracyValidation.json")
        saved_path = assessor.export_validation_report(metrics, report_file)
        assert os.path.exists(saved_path)

        with open(saved_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert data["metrics"]["iou_jaccard"] >= 0.80
        assert "evaluation_criteria_compliance" in data
