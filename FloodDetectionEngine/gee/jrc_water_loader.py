"""
jrc_water_loader.py — JRC Global Surface Water Baseline & River Normal Flow Separator
====================================================================================

Module of GEE Virtual Constellation:
Implements permanent hydrological baseline extraction from the European Commission's
Joint Research Centre (JRC) Global Surface Water Dataset (JRC/GSW1_4/GlobalSurfaceWater).

Key Capabilities:
- Distinguishes permanent river channel flow from anomalous monsoon flood inundation.
- Uses 38+ years of global surface water observation history (1984 - present):
    * 'occurrence': percentage of valid observations where water was detected (0 - 100%).
    * 'seasonality': number of months per year water is typically present (1 - 12).
- Automatic separation:
    * Permanent River / Waterbody: occurrence >= 80% OR seasonality >= 10 months.
    * Active Flood Inundation: detected water occurring OUTSIDE the permanent baseline.
- Zero-dependency offline synthetic baseline generator for testing and standalone mode.
"""

from __future__ import annotations

import logging
from typing import Dict, Tuple, Optional, Any
import numpy as np

try:
    import ee
    _EE_AVAILABLE = True
except ImportError:
    ee = None
    _EE_AVAILABLE = False

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class JrcWaterLoader:
    """
    Automated loader for JRC Global Surface Water 38-year historical water baseline.
    Separates normal river channels and lakes from crisis flood inundation.
    """

    JRC_COLLECTION = "JRC/GSW1_4/GlobalSurfaceWater"

    def __init__(self, config: EngineConfig) -> None:
        self.config = config
        coords = config.get_aoi_coordinates()

        if _EE_AVAILABLE and ee is not None:
            try:
                self.aoi: Optional[ee.Geometry] = ee.Geometry.Polygon([coords])
            except Exception:
                self.aoi = None
        else:
            self.aoi = None

        logger.info("JrcWaterLoader initialised — Historical Baseline: %s", self.JRC_COLLECTION)

    def load_permanent_water_mask(
        self,
        min_occurrence: int = 80,
        min_seasonality: int = 10,
    ) -> Any:
        """
        Load JRC permanent water baseline from Earth Engine.
        Pixels with occurrence >= min_occurrence% OR seasonality >= min_seasonality months
        are classified as permanent surface water (normal river flow / permanent waterbodies).
        """
        if not _EE_AVAILABLE or ee is None or self.aoi is None:
            raise RuntimeError("Earth Engine is not initialized or AOI is undefined.")

        with LogTimer("Load JRC 38-year permanent water baseline", logger):
            jrc_image = ee.Image(self.JRC_COLLECTION).clip(self.aoi)

            occurrence = jrc_image.select("occurrence")
            seasonality = jrc_image.select("seasonality")

            perm_mask = occurrence.gte(min_occurrence).Or(seasonality.gte(min_seasonality))
            return perm_mask.selfMask()

    @staticmethod
    def separate_river_and_flood_arrays(
        detected_water_mask: np.ndarray,
        permanent_water_mask: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, float]]:
        """
        Separate total detected surface water into:
          1. Normal River Flow (water that coincides with historical baseline)
          2. Active Flood Inundation (anomalous water overflowing onto dry land/floodplains)

        Returns:
          (normal_river_mask, flood_water_mask, summary_metrics)
        """
        detected = np.asarray(detected_water_mask)
        permanent = np.asarray(permanent_water_mask)
        if detected.ndim != 2 or permanent.shape != detected.shape:
            raise ValueError("Detected-water and permanent-water masks must be matching 2D arrays.")
        det_bool = np.isfinite(detected) & (detected > 0)
        perm_bool = np.isfinite(permanent) & (permanent > 0)

        # Normal river = detected AND permanent baseline
        normal_river = det_bool & perm_bool

        # Active flood = detected AND NOT permanent baseline
        active_flood = det_bool & (~perm_bool)

        total_water_pixels = int(np.sum(det_bool))
        river_pixels = int(np.sum(normal_river))
        flood_pixels = int(np.sum(active_flood))

        flood_ratio = (flood_pixels / max(1, total_water_pixels)) * 100.0

        metrics = {
            "total_water_pixels": float(total_water_pixels),
            "normal_river_pixels": float(river_pixels),
            "active_flood_pixels": float(flood_pixels),
            "flood_anomaly_percentage": round(flood_ratio, 2),
        }

        return normal_river, active_flood, metrics

    # ── Zero-Dependency Offline Synthetic Baseline Generator ───────────────

    def generate_synthetic_permanent_baseline(
        self,
        height: int = 300,
        width: int = 450,
        seed: int = 42,
    ) -> Dict[str, np.ndarray]:
        """
        Generate synthetic 38-year JRC occurrence and seasonality rasters
        matching the braided Koshi / Narayani permanent river channels.
        """
        np.random.seed(seed)
        x = np.linspace(0, 1, width)
        y = np.linspace(0, 1, height)
        xx, yy = np.meshgrid(x, y)

        channel_center = 0.48 + 0.12 * np.sin(yy * 3.2) - 0.05 * np.cos(yy * 6.0)
        dist_to_channel = np.abs(xx - channel_center)

        # Main deep channel: occurrence 85-100%, seasonality 11-12 months
        main_channel = dist_to_channel < 0.045
        # Secondary perennial channels: occurrence 60-80%
        braided_arms = (dist_to_channel < 0.065) & (np.sin(xx * 25.0 + yy * 15.0) > 0.2)

        occurrence = np.zeros((height, width), dtype=np.float32)
        seasonality = np.zeros((height, width), dtype=np.float32)

        occurrence[main_channel] = np.random.uniform(85, 100, size=np.sum(main_channel))
        seasonality[main_channel] = np.random.uniform(11, 12, size=np.sum(main_channel))

        occurrence[braided_arms] = np.random.uniform(60, 80, size=np.sum(braided_arms))
        seasonality[braided_arms] = np.random.uniform(8, 10, size=np.sum(braided_arms))

        perm_binary = (occurrence >= 80.0) | (seasonality >= 10.0)

        return {
            "occurrence": occurrence,
            "seasonality": seasonality,
            "permanent_mask": perm_binary.astype(np.uint8),
        }
