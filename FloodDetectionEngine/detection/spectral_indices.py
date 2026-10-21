"""
spectral_indices.py — Optical Spectral Water Indices & Change Detection
=======================================================================

Module 2 of Redesigned Flood Detection Engine:
Implements spectral water index algorithms (MNDWI, NDWI, AWEInsh),
dual-date optical change detection (newly flooded = post_water & ~pre_water),
hydro-conditioned DEM slope masking, and morphological filtering.
"""

from __future__ import annotations

import logging
from typing import Dict, Tuple, Optional, Any, Union
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


def compute_mndwi(green: np.ndarray, swir: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    """
    Modified Normalized Difference Water Index (Xu, 2006):
        MNDWI = (Green - SWIR1) / (Green + SWIR1)

    Particularly effective at suppressing false positives from built-up land
    and settlements in the Terai region.
    """
    numerator = green.astype(np.float32) - swir.astype(np.float32)
    denominator = green.astype(np.float32) + swir.astype(np.float32) + eps
    return np.clip(numerator / denominator, -1.0, 1.0)


def compute_ndwi(green: np.ndarray, nir: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    """
    Normalized Difference Water Index (McFeeters, 1996):
        NDWI = (Green - NIR) / (Green + NIR)
    """
    numerator = green.astype(np.float32) - nir.astype(np.float32)
    denominator = green.astype(np.float32) + nir.astype(np.float32) + eps
    return np.clip(numerator / denominator, -1.0, 1.0)


def compute_aweinsh(
    green: np.ndarray,
    swir1: np.ndarray,
    nir: np.ndarray,
    swir2: np.ndarray,
) -> np.ndarray:
    """
    Automated Water Extraction Index for non-shadow terrain (Feyisa et al., 2014):
        AWEInsh = 4 * (Green - SWIR1) - (0.25 * NIR + 2.75 * SWIR2)
    """
    g = green.astype(np.float32)
    s1 = swir1.astype(np.float32)
    n = nir.astype(np.float32)
    s2 = swir2.astype(np.float32)
    return 4.0 * (g - s1) - (0.25 * n + 2.75 * s2)


class SpectralIndexEngine:
    """
    Executes spectral index computation, Otsu/zero-crossing thresholding,
    topographic hydro-conditioning, and dual-date optical change detection.
    """

    def __init__(self, config: Optional[EngineConfig] = None) -> None:
        self.config = config or EngineConfig()
        self.index_name = getattr(self.config, "spectral_index", "mndwi").lower()
        self.mndwi_thresh = getattr(self.config, "mndwi_threshold", 0.0)
        self.ndwi_thresh = getattr(self.config, "ndwi_threshold", 0.0)
        self.slope_max = getattr(self.config, "slope_max_degrees", 5.0)
        self.enable_slope = getattr(self.config, "enable_slope_mask", True)

    # ── Earth Engine Server-Side Implementations ───────────────────────────

    @staticmethod
    def compute_ee_indices(image: Any) -> Any:
        """Add MNDWI, NDWI, and AWEInsh bands to an Earth Engine optical image."""
        if not _EE_AVAILABLE or ee is None:
            return image

        mndwi = image.normalizedDifference(["B3", "B11"]).rename("mndwi")
        ndwi = image.normalizedDifference(["B3", "B8"]).rename("ndwi")
        aweinsh = image.expression(
            "4 * (b3 - b11) - (0.25 * b8 + 2.75 * b12)",
            {
                "b3": image.select("B3"),
                "b11": image.select("B11"),
                "b8": image.select("B8"),
                "b12": image.select("B12"),
            },
        ).rename("aweinsh")

        return image.addBands([mndwi, ndwi, aweinsh])

    @staticmethod
    def apply_ee_slope_mask(water_mask: Any, max_slope_degrees: float = 5.0) -> Any:
        """Mask out mountain terrain / shadow false positives using Copernicus GLO-30 DEM."""
        if not _EE_AVAILABLE or ee is None:
            return water_mask

        dem = ee.Image("COPERNICUS/DEM/GLO30").select("DEM")
        slope = ee.Terrain.slope(dem)
        valid_slope = slope.lt(max_slope_degrees)
        return water_mask.updateMask(valid_slope)

    # ── Local Array Water Extraction & Change Detection ────────────────────

    def extract_water_mask(
        self,
        bands: Dict[str, np.ndarray],
        threshold: Optional[float] = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute the chosen spectral index and extract a binary water mask.

        Returns
        -------
        tuple[np.ndarray, np.ndarray]
            (binary_water_mask, spectral_index_array)
        """
        b3 = bands["B3"]
        b8 = bands["B8"]
        b11 = bands["B11"]
        b12 = bands.get("B12", bands["B11"])

        if self.index_name == "ndwi":
            index_arr = compute_ndwi(b3, b8)
            th = self.ndwi_thresh if threshold is None else threshold
            water = (index_arr > th).astype(np.uint8)
        elif self.index_name == "aweinsh":
            index_arr = compute_aweinsh(b3, b11, b8, b12)
            th = 0.0 if threshold is None else threshold
            water = (index_arr > th).astype(np.uint8)
        elif self.index_name == "ensemble":
            # Multi-index consensus
            mndwi_arr = compute_mndwi(b3, b11)
            ndwi_arr = compute_ndwi(b3, b8)
            index_arr = mndwi_arr
            water = ((mndwi_arr > self.mndwi_thresh) | ((ndwi_arr > self.ndwi_thresh) & (mndwi_arr > -0.05))).astype(np.uint8)
        else:
            # Default MNDWI
            index_arr = compute_mndwi(b3, b11)
            th = self.mndwi_thresh if threshold is None else threshold
            water = (index_arr > th).astype(np.uint8)

        return water, index_arr

    def detect_newly_flooded(
        self,
        pre_bands: Dict[str, np.ndarray],
        post_bands: Dict[str, np.ndarray],
        slope_array: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Execute dual-date optical change detection:
            Newly Flooded = Post-Flood Water & ~Pre-Flood Water

        Parameters
        ----------
        pre_bands : dict
            Multi-band surface reflectance for pre-flood dry season baseline.
        post_bands : dict
            Multi-band surface reflectance for post-flood crisis period.
        slope_array : np.ndarray | None
            Optional terrain slope grid (in degrees) from DEM.

        Returns
        -------
        tuple[np.ndarray, np.ndarray, np.ndarray, dict]
            - newly_flooded_mask (binary 0/1)
            - pre_water_mask (binary 0/1)
            - post_water_mask (binary 0/1)
            - metadata dictionary with area and spectral metrics
        """
        with LogTimer("Optical Spectral Change Detection", logger):
            raw_pre_water, pre_index = self.extract_water_mask(pre_bands)
            raw_post_water, post_index = self.extract_water_mask(post_bands)

            pre_water = self.clean_binary_mask(raw_pre_water)
            post_water = self.clean_binary_mask(raw_post_water)

            # Change detection: newly flooded is post-water minus baseline water
            newly_flooded = (post_water == 1) & (pre_water == 0)

            # Hydro-conditioned slope masking
            if self.enable_slope and slope_array is not None:
                flat_mask = slope_array < self.slope_max
                newly_flooded = newly_flooded & flat_mask
                logger.info(
                    "Applied hydro-conditioning slope mask (< %.1f°).", self.slope_max
                )

            # Connected component MMU cleaning on newly flooded delta
            cleaned_flooded = self.clean_binary_mask(newly_flooded, fill_holes=False)

            # Calculate pixel metrics
            total_px = int(np.sum(cleaned_flooded))
            pre_water_px = int(np.sum(pre_water))
            post_water_px = int(np.sum(post_water))

            stats = {
                "spectral_index_used": self.index_name,
                "pre_flood_water_pixels": pre_water_px,
                "post_flood_water_pixels": post_water_px,
                "newly_flooded_pixels": total_px,
                "mndwi_mean_pre": float(np.mean(pre_index)),
                "mndwi_mean_post": float(np.mean(post_index)),
            }

            logger.info(
                "Change detection complete: %d baseline water px, %d newly flooded px.",
                pre_water_px, total_px
            )
            return cleaned_flooded.astype(np.uint8), pre_water, post_water, stats

    def clean_binary_mask(
        self,
        mask: np.ndarray,
        min_pixels: Optional[int] = None,
        opening_radius: int = 1,
        fill_holes: Optional[bool] = None,
    ) -> np.ndarray:
        """
        Morphological opening to eliminate salt-and-pepper noise,
        followed by connected-component Minimum Mapping Unit (MMU) filtering.
        """
        min_px = min_pixels or getattr(self.config, "min_mapping_unit_pixels", 8)
        do_fill = fill_holes if fill_holes is not None else getattr(self.config, "fill_holes", True)
        binary = mask.astype(bool)

        # 1. Morphological opening
        if opening_radius > 0:
            structure = ndimage.generate_binary_structure(2, 1)
            binary = ndimage.binary_opening(binary, structure=structure, iterations=opening_radius)

        # 2. Minimum Mapping Unit (remove tiny isolated patches)
        labeled, num_features = ndimage.label(binary)
        if num_features > 0:
            sizes = ndimage.sum(binary, labeled, range(1, num_features + 1))
            remove_labels = np.where(sizes < min_px)[0] + 1
            mask_to_remove = np.isin(labeled, remove_labels)
            binary[mask_to_remove] = False

        # 3. Fill small internal holes
        if do_fill:
            binary = ndimage.binary_fill_holes(binary)

        return binary.astype(np.uint8)
