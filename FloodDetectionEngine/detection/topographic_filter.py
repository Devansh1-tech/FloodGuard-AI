"""
topographic_filter.py — Height Above Nearest Drainage (HAND) & Slope Terrain Filter
====================================================================================

Module of Phase 2 Detection Engine:
Eliminates physical false positives in flood inundation mapping across Nepal Terai:
1. Slope Filtering: Slopes > 5.0° cannot physically hold standing floodwater.
   Eliminates radar mountain shadow and layover artifacts common in the Chure / Siwalik foothills.
2. HAND Filtering: Floodwaters cannot sit tens of meters above their local drainage path.
   Eliminates perched high-elevation radar specular reflections (HAND > 15.0m).
3. Morphological MMU: Filters out isolated speckle (< 8 pixels / ~800 m²).
"""

from __future__ import annotations

import logging
from typing import Dict, Tuple, Optional, Any
from dataclasses import dataclass, asdict
import numpy as np
from scipy import ndimage

try:
    import ee
    _EE_AVAILABLE = True
except ImportError:
    ee = None
    _EE_AVAILABLE = False

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


@dataclass
class TopographicFilterMetrics:
    total_raw_water_pixels: int
    rejected_slope_pixels: int
    rejected_high_hand_pixels: int
    rejected_mmu_noise_pixels: int
    cleaned_flood_pixels: int
    false_positive_rejection_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class TopographicFilter:
    """
    Applies hydrodynamic and terrain feasibility constraints using DEM elevation,
    slope arrays, and Height Above Nearest Drainage (HAND).
    """

    def __init__(
        self,
        max_slope_degrees: float = 5.0,
        max_hand_meters: float = 15.0,
        min_mapping_unit_pixels: int = 8,
    ) -> None:
        self.max_slope = max_slope_degrees
        self.max_hand = max_hand_meters
        self.min_mmu = min_mapping_unit_pixels

        logger.info(
            "TopographicFilter initialised (Max Slope: %.1f°, Max HAND: %.1fm, MMU: %d px)",
            self.max_slope,
            self.max_hand,
            self.min_mmu,
        )

    def filter_terrain_artifacts(
        self,
        raw_flood_mask: np.ndarray,
        slope_degrees: np.ndarray,
        hand_meters: np.ndarray,
    ) -> Tuple[np.ndarray, TopographicFilterMetrics]:
        """
        Filters a 2D binary water/flood mask using terrain physics:
          1. Slope constraint: Discard pixels where slope > max_slope (radar hillshade / steep cliffs).
          2. HAND constraint: Discard pixels where HAND > max_hand (perched elevated terrain).
          3. MMU constraint: Discard disconnected clusters smaller than min_mmu connected pixels.

        Returns:
          (cleaned_mask, metrics)
        """
        raw_bool = np.asarray(raw_flood_mask, dtype=bool)
        slope_degrees = np.asarray(slope_degrees, dtype=np.float32)
        hand_meters = np.asarray(hand_meters, dtype=np.float32)
        if raw_bool.ndim != 2 or slope_degrees.shape != raw_bool.shape or hand_meters.shape != raw_bool.shape:
            raise ValueError("Flood, slope, and HAND rasters must be two-dimensional arrays with matching shapes.")
        total_raw = int(np.sum(raw_bool))

        if total_raw == 0:
            empty_metrics = TopographicFilterMetrics(0, 0, 0, 0, 0, 0.0)
            return np.zeros_like(raw_flood_mask, dtype=np.uint8), empty_metrics

        # 1. Slope Filter: Water drains rapidly on slopes > max_slope
        valid_terrain = np.isfinite(slope_degrees) & np.isfinite(hand_meters)
        steep_mask = (slope_degrees > self.max_slope) | ~valid_terrain
        rejected_slope = int(np.sum(raw_bool & steep_mask))
        after_slope = raw_bool & (~steep_mask)

        # 2. HAND Filter: True river flooding occurs in low HAND drainage corridors
        high_hand_mask = hand_meters > self.max_hand
        rejected_hand = int(np.sum(after_slope & high_hand_mask))
        after_hand = after_slope & (~high_hand_mask)

        # 3. Minimum Mapping Unit (MMU) connected-component filtering
        # Closing seals one-pixel gaps in coherent flood bodies before the MMU test.
        closed = ndimage.binary_closing(after_hand, structure=np.ones((3, 3), dtype=bool))
        labeled_components, num_features = ndimage.label(closed, structure=np.ones((3, 3), dtype=bool))
        component_sizes = np.bincount(labeled_components.ravel())

        # Keep components with size >= min_mmu (ignore background label 0)
        valid_sizes = component_sizes >= self.min_mmu
        valid_sizes[0] = False  # Background
        cleaned_mask = valid_sizes[labeled_components]

        # Closing may add pixels, so count only surviving pixels from the source mask.
        cleaned_mask &= after_hand
        cleaned_count = int(np.sum(cleaned_mask))
        rejected_mmu = int(np.sum(after_hand & ~cleaned_mask))
        total_rejected = total_raw - cleaned_count
        rejection_pct = round((total_rejected / max(1, total_raw)) * 100.0, 2)

        metrics = TopographicFilterMetrics(
            total_raw_water_pixels=total_raw,
            rejected_slope_pixels=rejected_slope,
            rejected_high_hand_pixels=rejected_hand,
            rejected_mmu_noise_pixels=rejected_mmu,
            cleaned_flood_pixels=cleaned_count,
            false_positive_rejection_pct=rejection_pct,
        )

        logger.info(
            "Topographic Filtering: In=%d px, Slope-rej=%d, HAND-rej=%d, MMU-rej=%d -> Clean=%d px (%.1f%% rejected)",
            total_raw,
            rejected_slope,
            rejected_hand,
            rejected_mmu,
            cleaned_count,
            rejection_pct,
        )

        return cleaned_mask.astype(np.uint8), metrics

    # ── Zero-Dependency Offline Synthetic Terrain Generator ────────────────

    @staticmethod
    def generate_synthetic_terrain(
        height: int = 200,
        width: int = 300,
        seed: int = 42,
    ) -> Dict[str, np.ndarray]:
        """
        Generate synthetic DEM elevation, slope, and HAND rasters matching
        the Southern Nepal Terai plains grading into the Chure foothills.
        """
        np.random.seed(seed)
        x = np.linspace(0, 1, width)
        y = np.linspace(0, 1, height)
        xx, yy = np.meshgrid(x, y)

        # Chure foothills in northern sector (yy < 0.25): steep slope 8° - 25°
        # Lowland floodplains in central/southern sector (yy >= 0.25): gentle slope 0.2° - 2.5°
        is_foothills = yy < 0.22
        slope = np.zeros((height, width), dtype=np.float32)
        slope[is_foothills] = np.random.uniform(7.0, 22.0, size=np.sum(is_foothills))
        slope[~is_foothills] = np.random.uniform(0.1, 2.2, size=np.sum(~is_foothills))

        # Channel center (Koshi / Narayani braided river path)
        channel_center = 0.48 + 0.12 * np.sin(yy * 3.2) - 0.05 * np.cos(yy * 6.0)
        dist_to_channel = np.abs(xx - channel_center)

        # HAND (Height Above Nearest Drainage in meters)
        # Low near river (< 2m), increasing to 5-12m on terraces, > 30m in hills
        hand = np.zeros((height, width), dtype=np.float32)
        hand[~is_foothills] = np.clip(dist_to_channel[~is_foothills] * 45.0 + np.random.normal(0, 0.5, np.sum(~is_foothills)), 0.0, 25.0)
        hand[is_foothills] = np.random.uniform(35.0, 120.0, size=np.sum(is_foothills))

        # Absolute DEM elevation (75m in far south border, ~140m near Chure base, > 400m in hills)
        elevation = 75.0 + (1.0 - yy) * 65.0
        elevation[is_foothills] += np.random.uniform(150.0, 350.0, size=np.sum(is_foothills))

        return {
            "elevation_m": elevation.astype(np.float32),
            "slope_degrees": slope.astype(np.float32),
            "hand_meters": hand.astype(np.float32),
        }
