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

__all__ = [
    "ChangeDetector",
    "otsu_threshold",
    "MorphologyCleaner",
    "FloodMaskGenerator",
    "Vectorizer",
]
