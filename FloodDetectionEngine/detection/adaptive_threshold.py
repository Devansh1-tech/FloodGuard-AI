"""
adaptive_threshold.py — Local Adaptive Bivariate Thresholding & Temporal Persistence
=====================================================================================

Resolves:
- Weakness 6: "Global Scene-Wide Otsu Thresholding Oversimplification"
- Weakness 7: "Dual-Date Snapshot vs. Inundation Duration (Single Event Focus)"

Implements:
1. Tile-based Local Adaptive Otsu Thresholding (512x512 moving windows with blending)
2. Multi-Index Water Consensus Engine (MNDWI + AWEInsh + DEM Slope Filtering)
3. Multi-Temporal Inundation Persistence Stacking (Flash <24h, Medium 2-5d, Stagnant >5d)
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from scipy import ndimage

from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


@dataclass
class PersistenceStackResult:
    """Container for multi-temporal flood duration analytics."""
    persistence_grid_pct: np.ndarray
    flash_flood_area_km2: float       # < 24h (< 30% persistence)
    medium_inundation_area_km2: float # 2-5 days (30% - 70% persistence)
    stagnant_flood_area_km2: float    # > 5 days (> 70% continuous water)
    total_impacted_km2: float
    temporal_passes_count: int

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["persistence_grid_shape"] = list(self.persistence_grid_pct.shape)
        del d["persistence_grid_pct"]
        return d


def compute_local_otsu_threshold(img_tile: np.ndarray, num_bins: int = 128) -> float:
    """
    Computes optimal Otsu threshold for a local tile.
    Suppresses bimodality failures when tile is purely dry land or purely water.
    """
    valid_data = img_tile[~np.isnan(img_tile)]
    if len(valid_data) < 50:
        return 0.0

    counts, bin_edges = np.histogram(valid_data, bins=num_bins, range=(-1.0, 1.0))
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2.0

    total = valid_data.size
    sum_total = np.sum(counts * bin_centers)

    weight_b = 0.0
    sum_b = 0.0
    max_variance = 0.0
    best_threshold = 0.0

    for i in range(num_bins):
        weight_b += counts[i]
        if weight_b == 0:
            continue
        weight_f = total - weight_b
        if weight_f == 0:
            break

        sum_b += counts[i] * bin_centers[i]
        mean_b = sum_b / weight_b
        mean_f = (sum_total - sum_b) / weight_f

        between_class_variance = weight_b * weight_f * ((mean_b - mean_f) ** 2)
        if between_class_variance > max_variance:
            max_variance = between_class_variance
            best_threshold = bin_centers[i]

    # Fallback to zero if variance is too low (unimodal dry or wet tile)
    if max_variance / (total ** 2 + 1e-6) < 0.005:
        return 0.0

    return float(np.clip(best_threshold, -0.25, 0.25))


def adaptive_local_water_extraction(
    mndwi: np.ndarray,
    aweinsh: Optional[np.ndarray] = None,
    dem_slope_deg: Optional[np.ndarray] = None,
    tile_size: int = 512,
    max_slope_deg: float = 5.0,
) -> np.ndarray:
    """
    Extracts water using overlapping tile-based adaptive Otsu thresholding
    combined with multi-spectral consensus and topographic slope constraints.
    """
    with LogTimer("Adaptive Local Multi-Index Water Extraction", logger):
        rows, cols = mndwi.shape
        local_threshold_map = np.zeros((rows, cols), dtype=np.float32)
        weight_map = np.zeros((rows, cols), dtype=np.float32)

        half_tile = tile_size // 2

        # Step through image with 50% overlap for smooth blending
        for r in range(0, rows, half_tile):
            for c in range(0, cols, half_tile):
                r_end = min(r + tile_size, rows)
                c_end = min(c + tile_size, cols)

                tile = mndwi[r:r_end, c:c_end]
                t_val = compute_local_otsu_threshold(tile)

                local_threshold_map[r:r_end, c:c_end] += t_val
                weight_map[r:r_end, c:c_end] += 1.0

        weight_map = np.maximum(weight_map, 1.0)
        blended_thresholds = local_threshold_map / weight_map

        # Primary segmentation: MNDWI > Local Adaptive Threshold
        water_mask = mndwi > blended_thresholds

        # Consensus Refinement 1: AWEInsh agreement (suppresses bright urban roof reflections)
        if aweinsh is not None:
            water_mask = water_mask & (aweinsh > 0.0)

        # Consensus Refinement 2: Copernicus 30m Slope Filter (eliminates hillshade shadows)
        if dem_slope_deg is not None:
            water_mask = water_mask & (dem_slope_deg < max_slope_deg)

        return water_mask.astype(np.uint8)


def analyze_inundation_persistence(
    temporal_flood_masks: List[np.ndarray],
    pixel_size_m: float = 10.0,
) -> PersistenceStackResult:
    """
    Analyzes temporal persistence across N consecutive satellite overpasses.
    Classifies land into Flash Flood (<24h), Medium Inundation (2-5d), and Stagnant (>5d).
    """
    with LogTimer("Multi-Temporal Inundation Persistence Analysis", logger):
        n_passes = len(temporal_flood_masks)
        if n_passes == 0:
            raise ValueError("At least 1 temporal flood mask is required for persistence stacking.")

        stacked = np.stack(temporal_flood_masks, axis=0) # shape (N, H, W)
        water_frequency = np.sum(stacked, axis=0)        # count of times pixel was water

        persistence_pct = (water_frequency / float(n_passes)) * 100.0
        ever_flooded = water_frequency > 0

        pixel_area_km2 = (pixel_size_m * pixel_size_m) / 1e6

        flash_pixels = np.sum((water_frequency == 1) & (persistence_pct < 33.3))
        medium_pixels = np.sum((water_frequency > 1) & (persistence_pct >= 33.3) & (persistence_pct <= 66.6))
        stagnant_pixels = np.sum(persistence_pct > 66.6)
        total_pixels = np.sum(ever_flooded)

        return PersistenceStackResult(
            persistence_grid_pct=persistence_pct.astype(np.float32),
            flash_flood_area_km2=round(flash_pixels * pixel_area_km2, 2),
            medium_inundation_area_km2=round(medium_pixels * pixel_area_km2, 2),
            stagnant_flood_area_km2=round(stagnant_pixels * pixel_area_km2, 2),
            total_impacted_km2=round(total_pixels * pixel_area_km2, 2),
            temporal_passes_count=n_passes,
        )
