"""
Detection Module
================

Flood detection pipeline components:

- ``change_detection`` – difference / ratio / log-ratio images
- ``otsu``             – automatic Otsu thresholding on EE images
- ``morphology``       – opening, closing, hole-fill, connected-component filter
- ``flood_mask``       – orchestrator combining detection + cleaning
- ``vectorization``    – raster mask → GeoJSON / Shapefile polygons
"""

from FloodDetectionEngine.detection.change_detection import ChangeDetector
from FloodDetectionEngine.detection.otsu import otsu_threshold
from FloodDetectionEngine.detection.morphology import MorphologyCleaner
from FloodDetectionEngine.detection.flood_mask import FloodMaskGenerator
from FloodDetectionEngine.detection.vectorization import Vectorizer
from FloodDetectionEngine.detection.topographic_filter import (
    TopographicFilter,
    TopographicFilterMetrics,
)
from FloodDetectionEngine.detection.flood_segmentation_engine import (
    FloodSegmentationEngine,
    FloodSegmentationResult,
    LandCoverImpact,
)
from FloodDetectionEngine.detection.spectral_indices import (
    compute_mndwi,
    compute_ndwi,
    compute_aweinsh,
    SpectralIndexEngine,
)

__all__ = [
    "ChangeDetector",
    "otsu_threshold",
    "MorphologyCleaner",
    "FloodMaskGenerator",
    "Vectorizer",
    "TopographicFilter",
    "TopographicFilterMetrics",
    "FloodSegmentationEngine",
    "FloodSegmentationResult",
    "LandCoverImpact",
    "compute_mndwi",
    "compute_ndwi",
    "compute_aweinsh",
    "SpectralIndexEngine",
]

