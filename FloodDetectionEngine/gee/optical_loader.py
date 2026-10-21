"""
optical_loader.py — Sentinel-2 & Landsat Optical Satellite Imagery Loader
========================================================================

Module 1 of Redesigned Flood Detection Engine:
Loads Level-2A surface reflectance optical satellite imagery (Sentinel-2 MSI
or Landsat-8/9) from Google Earth Engine with automated cloud/shadow masking
and temporal compositing. Includes zero-dependency offline fallback synthesis
for testing and disaster environments without active GEE cloud connection.
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


class OpticalLoader:
    """
    Automated loader and cloud-masking preprocessor for optical satellite imagery.
    Supports Sentinel-2 Level-2A Harmonized (COPERNICUS/S2_SR_HARMONIZED)
    and Landsat-8/9 Surface Reflectance (LANDSAT/LC08/C02/T1_L2).
    """

    def __init__(self, config: EngineConfig) -> None:
        self.config = config
        self.collection_name = getattr(config, "optical_collection", "COPERNICUS/S2_SR_HARMONIZED")
        self.cloud_thresh = getattr(config, "optical_cloud_threshold", 40.0)
        coords = config.get_aoi_coordinates()

        if _EE_AVAILABLE and ee is not None:
            try:
                self.aoi: Optional[ee.Geometry] = ee.Geometry.Polygon([coords])
            except Exception:
                self.aoi = None
        else:
            self.aoi = None

        logger.info(
            "OpticalLoader initialised — Collection: %s, Cloud Max: %.1f%%, AOI: %s",
            self.collection_name,
            self.cloud_thresh,
            config.aoi_name,
        )

    # ── Cloud & Shadow Masking ──────────────────────────────────────────────

    @staticmethod
    def mask_s2_clouds(image: Any) -> Any:
        """
        Mask clouds and cloud shadows from Sentinel-2 MSI L2A imagery using SCL.

        SCL (Scene Classification Layer) values:
          3: Cloud shadow
          8: Cloud medium probability
          9: Cloud high probability
          10: Thin cirrus
          11: Snow / Ice
        """
        if not _EE_AVAILABLE or ee is None:
            return image

        scl = image.select("SCL")
        # Keep clear land, water, vegetation (values 4, 5, 6, 7) and mask 3, 8, 9, 10, 11
        clear_mask = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10)).And(scl.neq(11))

        # Scale surface reflectance bands to 0.0 - 1.0 (Sentinel-2 L2A is scaled by 10000)
        optical_bands = ["B2", "B3", "B4", "B8", "B11", "B12"]
        scaled = image.select(optical_bands).multiply(0.0001)

        return image.addBands(scaled, overwrite=True).updateMask(clear_mask)

    @staticmethod
    def mask_landsat_clouds(image: Any) -> Any:
        """
        Mask clouds and shadows using Landsat-8/9 Collection 2 QA_PIXEL bitmask.
        Bit 3 = cloud, bit 4 = cloud shadow, bit 5 = snow.
        """
        if not _EE_AVAILABLE or ee is None:
            return image

        qa = image.select("QA_PIXEL")
        cloud_shadow_mask = qa.bitwiseAnd(1 << 4).eq(0)
        cloud_mask = qa.bitwiseAnd(1 << 3).eq(0)
        clear_mask = cloud_shadow_mask.And(cloud_mask)

        # Scale optical surface reflectance: mult 0.0000275 - 0.2
        optical_bands = ["SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7"]
        scaled = image.select(optical_bands).multiply(0.0000275).add(-0.2)
        # Rename to standardized band names (B2, B3, B4, B8, B11, B12)
        standardized = scaled.select(
            ["SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7"],
            ["B2", "B3", "B4", "B8", "B11", "B12"],
        )
        return image.addBands(standardized, overwrite=True).updateMask(clear_mask)

    # ── Earth Engine Image Loading ──────────────────────────────────────────

    def load_before_image(self) -> Any:
        """
        Load and cloud-mask the pre-flood optical baseline composite.
        """
        with LogTimer("Load pre-flood optical baseline", logger):
            return self._load_composite(
                start=self.config.before_start,
                end=self.config.before_end,
                label="pre-flood",
            )

    def load_after_image(self) -> Any:
        """
        Load and cloud-mask the post-flood crisis optical composite.
        """
        with LogTimer("Load post-flood optical crisis", logger):
            return self._load_composite(
                start=self.config.after_start,
                end=self.config.after_end,
                label="post-flood",
            )

    def load_pair(self) -> Tuple[Any, Any]:
        """
        Load both pre-flood baseline and post-flood event optical composites.
        """
        return self.load_before_image(), self.load_after_image()

    def _load_composite(self, start: str, end: str, label: str) -> Any:
        """Internal Earth Engine collection query, filtering, cloud masking and median composite."""
        if not _EE_AVAILABLE or ee is None or self.aoi is None:
            raise RuntimeError("Earth Engine is not initialized or AOI is undefined.")

        is_sentinel = "S2" in self.collection_name.upper()
        cloud_property = "CLOUDY_PIXEL_PERCENT" if is_sentinel else "CLOUD_COVER"

        collection = (
            ee.ImageCollection(self.collection_name)
            .filterBounds(self.aoi)
            .filterDate(start, end)
            .filter(ee.Filter.lt(cloud_property, self.cloud_thresh))
        )

        # Apply cloud mask
        if is_sentinel:
            masked = collection.map(self.mask_s2_clouds)
        else:
            masked = collection.map(self.mask_landsat_clouds)

        count = collection.size().getInfo()
        logger.info(
            "Optical %s collection (%s): %d scene(s) in [%s, %s)",
            label, self.collection_name, count, start, end
        )

        if count == 0:
            logger.warning(
                "No cloud-free optical scenes found for %s (%s to %s) with cloud < %.1f%%. Relaxing cloud filter.",
                label, start, end, self.cloud_thresh
            )
            # Try relaxed query with median composite
            collection = (
                ee.ImageCollection(self.collection_name)
                .filterBounds(self.aoi)
                .filterDate(start, end)
            )
            masked = collection.map(self.mask_s2_clouds if is_sentinel else self.mask_landsat_clouds)

        composite = masked.median().clip(self.aoi)
        return composite

    # ── Local / Zero-Dependency Offline Synthetic Generator ────────────────

    def generate_synthetic_optical_pair(
        self,
        height: int = 300,
        width: int = 450,
        seed: int = 42,
    ) -> Tuple[Dict[str, np.ndarray], Dict[str, np.ndarray]]:
        """
        Generate synthetic pre-flood and post-flood optical multi-band rasters
        for the Koshi River sector (86.50°E-87.10°E, 26.40°N-26.80°N).

        Produces physically calibrated surface reflectance bands:
          - B2 (Blue ~490nm)
          - B3 (Green ~560nm)
          - B4 (Red ~665nm)
          - B8 (NIR ~842nm)
          - B11 (SWIR1 ~1610nm)
          - B12 (SWIR2 ~2190nm)

        Simulates realistic Terai landscape:
          - Permanent Koshi braided channel
          - Low-lying Terai floodplains & agricultural fields
          - Settlement clusters (Hanumannagar, Bhantabari, Sunsari)
          - Monsoon inundation surge engulfing lowlands during post-flood
        """
        np.random.seed(seed)
        x = np.linspace(0, 1, width)
        y = np.linspace(0, 1, height)
        xx, yy = np.meshgrid(x, y)

        # 1. Base Koshi River Channel (sinuous braided channel)
        channel_center = 0.48 + 0.12 * np.sin(yy * 3.2) - 0.05 * np.cos(yy * 6.0)
        dist_to_channel = np.abs(xx - channel_center)
        perm_river = dist_to_channel < 0.055

        # 2. Low-lying floodplain zone prone to monsoon inundation
        floodplain_zone = (dist_to_channel < 0.22) & (yy > 0.15) & (yy < 0.90)
        lowland_noise = np.random.normal(0, 0.02, (height, width))
        post_flood_water = perm_river | (floodplain_zone & ((dist_to_channel + lowland_noise) < 0.17))

        # 3. Settlement Clusters
        # Sunsari / Saptari urban / rural clusters
        settlement_mask = (
            ((np.abs(xx - 0.72) < 0.04) & (np.abs(yy - 0.35) < 0.04)) |  # Hanumannagar area
            ((np.abs(xx - 0.30) < 0.05) & (np.abs(yy - 0.70) < 0.05)) |  # Bhantabari area
            ((np.abs(xx - 0.80) < 0.06) & (np.abs(yy - 0.75) < 0.06))    # Inaruwa fringe
        )

        def build_optical_bands(is_water: np.ndarray, is_settlement: np.ndarray) -> Dict[str, np.ndarray]:
            """Create physical surface reflectance values with realistic sensor noise."""
            noise = lambda: np.random.normal(0.0, 0.008, (height, width))

            # Default Vegetation / Agricultural Land:
            # High NIR, moderate SWIR, low Green, very low Red
            b2 = np.clip(0.04 + noise(), 0.01, 0.20)
            b3 = np.clip(0.08 + noise(), 0.02, 0.25)
            b4 = np.clip(0.05 + noise(), 0.01, 0.25)
            b8 = np.clip(0.46 + noise(), 0.20, 0.70)   # Strong NIR peak
            b11 = np.clip(0.18 + noise(), 0.05, 0.40)  # Moderate SWIR
            b12 = np.clip(0.10 + noise(), 0.02, 0.30)

            # Water Bodies:
            # Moderate Green, very low NIR, near-zero SWIR
            # Gives MNDWI = (Green - SWIR1)/(Green + SWIR1) ~ (0.16 - 0.03)/(0.16 + 0.03) = +0.68
            # Gives NDWI  = (Green - NIR)/(Green + NIR)     ~ (0.16 - 0.04)/(0.16 + 0.04) = +0.60
            b2[is_water] = np.clip(0.12 + noise()[is_water], 0.06, 0.25)
            b3[is_water] = np.clip(0.16 + noise()[is_water], 0.08, 0.30)
            b4[is_water] = np.clip(0.09 + noise()[is_water], 0.04, 0.20)
            b8[is_water] = np.clip(0.035 + noise()[is_water], 0.01, 0.08)
            b11[is_water] = np.clip(0.020 + noise()[is_water], 0.005, 0.06)
            b12[is_water] = np.clip(0.015 + noise()[is_water], 0.003, 0.05)

            # Built-up / Settlement footprint (where not flooded):
            # Moderate reflectance across all bands (high SWIR, moderate Red/NIR)
            dry_settlement = is_settlement & (~is_water)
            b2[dry_settlement] = np.clip(0.12 + noise()[dry_settlement], 0.08, 0.25)
            b3[dry_settlement] = np.clip(0.14 + noise()[dry_settlement], 0.09, 0.30)
            b4[dry_settlement] = np.clip(0.16 + noise()[dry_settlement], 0.10, 0.35)
            b8[dry_settlement] = np.clip(0.22 + noise()[dry_settlement], 0.14, 0.40)
            b11[dry_settlement] = np.clip(0.28 + noise()[dry_settlement], 0.18, 0.50)
            b12[dry_settlement] = np.clip(0.24 + noise()[dry_settlement], 0.15, 0.45)

            return {
                "B2": b2.astype(np.float32),
                "B3": b3.astype(np.float32),
                "B4": b4.astype(np.float32),
                "B8": b8.astype(np.float32),
                "B11": b11.astype(np.float32),
                "B12": b12.astype(np.float32),
            }

        pre_bands = build_optical_bands(perm_river, settlement_mask)
        post_bands = build_optical_bands(post_flood_water, settlement_mask)

        return pre_bands, post_bands
