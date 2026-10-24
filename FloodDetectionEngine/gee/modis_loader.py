"""
modis_loader.py — Daily MODIS Terra/Aqua Surface Reflectance Loader (250m/500m)
================================================================================

Module of GEE Virtual Constellation:
Bridges the critical 3–4 day revisit gap of Sentinel-1/2 by ingesting twice-daily
MODIS Terra (morning ~10:30 AM) and Aqua (afternoon ~1:30 PM) surface reflectance.

Key Features:
- Earth Engine collections:
    * Terra: MODIS/061/MOD09GA
    * Aqua:  MODIS/061/MYD09GA
- High temporal cadence: Twice-daily coverage over all Nepal Terai river sectors.
- 250m Band 1 (Red 620-670nm) and Band 2 (NIR 841-876nm) for sub-daily flood tracking.
- 500m Band 4 (Green 545-565nm) and Band 6 (SWIR1 1628-1652nm) for MODIS MNDWI.
- Automated 1km state QA cloud/shadow bitmasking.
- Offline synthetic fallback for zero-network testing and disconnected environments.
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


class ModisLoader:
    """
    Automated loader and cloud-masking preprocessor for daily MODIS surface reflectance.
    Fuses Terra (MOD09GA) and Aqua (MYD09GA) to bridge multi-day satellite revisit gaps.
    """

    TERRA_COLLECTION = "MODIS/061/MOD09GA"
    AQUA_COLLECTION = "MODIS/061/MYD09GA"

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

        logger.info("ModisLoader initialised — Bridging 3-4 day gaps via MODIS Terra/Aqua Daily 250m")

    # ── Cloud & Shadow Masking ──────────────────────────────────────────────

    @staticmethod
    def mask_modis_clouds(image: Any) -> Any:
        """
        Mask clouds and cloud shadows using MODIS state_1km QA bitmask.
        Bit 0-1: Cloud state (0=clear, 1=cloudy, 2=mixed, 3=not set)
        Bit 2:   Cloud shadow (1=yes, 0=no)
        Bit 8-9: Cirrus detected
        """
        if not _EE_AVAILABLE or ee is None:
            return image

        qa = image.select("state_1km")
        # Cloud state bits 0-1 must be 0 (clear)
        cloud_state = qa.bitwiseAnd(3).eq(0)
        # Cloud shadow bit 2 must be 0 (no shadow)
        cloud_shadow = qa.bitwiseAnd(1 << 2).eq(0)
        # Cirrus bits 8-9 must not be high (bits 8-9 != 3)
        cirrus = qa.bitwiseAnd(3 << 8).neq(3 << 8)

        clear_mask = cloud_state.And(cloud_shadow).And(cirrus)

        # Scale surface reflectance bands by 0.0001 (MODIS scale factor)
        modis_bands = [
            "sur_refl_b01",  # Red 250m
            "sur_refl_b02",  # NIR 250m
            "sur_refl_b03",  # Blue 500m
            "sur_refl_b04",  # Green 500m
            "sur_refl_b06",  # SWIR1 500m
        ]
        scaled = image.select(modis_bands).multiply(0.0001)

        return image.addBands(scaled, overwrite=True).updateMask(clear_mask)

    # ── Earth Engine Daily Ingestion ────────────────────────────────────────

    def load_daily_composite(self, date_str: str) -> Any:
        """
        Ingest daily MODIS passes (both Terra morning & Aqua afternoon) for date_str,
        apply state_1km QA cloud masking, and generate a daily cloud-reduced composite.
        """
        if not _EE_AVAILABLE or ee is None or self.aoi is None:
            raise RuntimeError("Earth Engine is not initialized or AOI is undefined.")

        import datetime
        target_d = datetime.date.fromisoformat(date_str)
        next_d = target_d + datetime.timedelta(days=1)
        start_str = target_d.isoformat()
        end_str = next_d.isoformat()

        with LogTimer(f"Load daily MODIS 250m composite for {date_str}", logger):
            terra_col = (
                ee.ImageCollection(self.TERRA_COLLECTION)
                .filterBounds(self.aoi)
                .filterDate(start_str, end_str)
                .map(self.mask_modis_clouds)
            )
            aqua_col = (
                ee.ImageCollection(self.AQUA_COLLECTION)
                .filterBounds(self.aoi)
                .filterDate(start_str, end_str)
                .map(self.mask_modis_clouds)
            )

            # Merge Terra + Aqua into a single daily sub-daily collection
            merged = terra_col.merge(aqua_col)
            count = merged.size().getInfo()

            logger.info("MODIS daily passes available on %s: %d scene(s)", date_str, count)

            if count == 0:
                logger.warning("No clear MODIS pass on %s; expanding window by +/- 1 day", date_str)
                prev_str = (target_d - datetime.timedelta(days=1)).isoformat()
                expanded_end = (target_d + datetime.timedelta(days=2)).isoformat()
                merged = (
                    ee.ImageCollection(self.TERRA_COLLECTION)
                    .merge(ee.ImageCollection(self.AQUA_COLLECTION))
                    .filterBounds(self.aoi)
                    .filterDate(prev_str, expanded_end)
                    .map(self.mask_modis_clouds)
                )

            daily_composite = merged.median().clip(self.aoi)
            return daily_composite

    # ── Zero-Dependency Offline Synthetic Generator ────────────────────────

    def generate_synthetic_modis_daily(
        self,
        height: int = 150,
        width: int = 225,
        seed: int = 101,
        flood_expansion_factor: float = 1.35,
    ) -> Dict[str, np.ndarray]:
        """
        Generate synthetic daily 250m MODIS surface reflectance for the Terai sector.
        Simulates the 250m/500m scale:
          - sur_refl_b01: Red (250m)
          - sur_refl_b02: NIR (250m)
          - sur_refl_b04: Green (500m)
          - sur_refl_b06: SWIR1 (500m)
        """
        np.random.seed(seed)
        x = np.linspace(0, 1, width)
        y = np.linspace(0, 1, height)
        xx, yy = np.meshgrid(x, y)

        # Braided river channel
        channel_center = 0.48 + 0.12 * np.sin(yy * 3.2) - 0.05 * np.cos(yy * 6.0)
        dist_to_channel = np.abs(xx - channel_center)

        # MODIS 250m resolution shows macro river and wider flood footprint
        channel_width = 0.06 * flood_expansion_factor
        flood_zone = dist_to_channel < channel_width

        noise = lambda: np.random.normal(0.0, 0.015, (height, width))

        # Dry land background (Vegetation / Agriculture)
        red = np.clip(0.06 + noise(), 0.02, 0.25)
        nir = np.clip(0.42 + noise(), 0.18, 0.65)
        green = np.clip(0.09 + noise(), 0.03, 0.28)
        swir = np.clip(0.18 + noise(), 0.06, 0.38)

        # Inundated pixels: Low NIR, Low SWIR, Moderate Green/Red (turbid monsoon water)
        red[flood_zone] = np.clip(0.08 + noise()[flood_zone], 0.03, 0.20)
        nir[flood_zone] = np.clip(0.04 + noise()[flood_zone], 0.01, 0.09)
        green[flood_zone] = np.clip(0.14 + noise()[flood_zone], 0.06, 0.28)
        swir[flood_zone] = np.clip(0.03 + noise()[flood_zone], 0.005, 0.08)

        return {
            "sur_refl_b01": red.astype(np.float32),    # Red 250m
            "sur_refl_b02": nir.astype(np.float32),    # NIR 250m
            "sur_refl_b04": green.astype(np.float32),  # Green 500m
            "sur_refl_b06": swir.astype(np.float32),   # SWIR1 500m
        }
