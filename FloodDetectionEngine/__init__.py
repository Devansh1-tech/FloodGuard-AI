"""
FloodDetectionEngine
====================

Production-ready Flood Detection Engine for rapid flood extent mapping
and settlement impact assessment using Sentinel-1 SAR imagery.

Architecture:
    - config/   : Centralized configuration management
    - gee/      : Google Earth Engine data loading and preprocessing
    - detection/: Flood change detection, thresholding, morphology, vectorization
    - export/   : GeoTIFF, GeoJSON, Shapefile, PNG export
    - utils/    : Logging and helper utilities
    - tests/    : Unit and integration tests

Pipeline:
    Sentinel-1 Before -> Sentinel-1 After -> Border Noise Removal ->
    Refined Lee Filter -> Normalization -> Change Detection ->
    Otsu Threshold -> Morphological Cleaning -> Flood Mask ->
    Vectorization -> Export

Author: FloodGuard-AI Team
License: MIT
"""

__version__ = "1.0.0"
__author__ = "FloodGuard-AI Team"
