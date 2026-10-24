"""
Google Earth Engine Module
==========================

Server-side image processing using the Earth Engine Python API:

- ``initialize``       – authentication and project setup
- ``sentinel_loader``  – Sentinel-1 GRD loading with filters & compositing
- ``preprocessing``    – border noise removal and radiometric normalisation
- ``filters``          – Refined Lee speckle filter (edge-preserving)
- ``visualization``    – colour palettes and map rendering
"""

from FloodDetectionEngine.gee.initialize import initialize_gee
from FloodDetectionEngine.gee.sentinel_loader import SentinelLoader
from FloodDetectionEngine.gee.optical_loader import OpticalLoader
from FloodDetectionEngine.gee.modis_loader import ModisLoader
from FloodDetectionEngine.gee.jrc_water_loader import JrcWaterLoader
from FloodDetectionEngine.gee.virtual_constellation import (
    VirtualConstellationResolver,
    VirtualConstellationResult,
    ConstellationCandidate,
)
from FloodDetectionEngine.gee.preprocessing import Preprocessor
from FloodDetectionEngine.gee.filters import refined_lee_filter
from FloodDetectionEngine.gee.visualization import Visualizer

__all__ = [
    "initialize_gee",
    "SentinelLoader",
    "OpticalLoader",
    "ModisLoader",
    "JrcWaterLoader",
    "VirtualConstellationResolver",
    "VirtualConstellationResult",
    "ConstellationCandidate",
    "Preprocessor",
    "refined_lee_filter",
    "Visualizer",
]

