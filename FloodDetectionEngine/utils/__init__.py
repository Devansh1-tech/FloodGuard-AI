"""
Utilities Module
================

Cross-cutting concerns shared by every other module:

- ``logger``  – structured, timed logging with file + console sinks
- ``helper``  – date validation, timing decorators, GeoJSON helpers
"""

from FloodDetectionEngine.utils.logger import get_logger, LogTimer
from FloodDetectionEngine.utils.helper import (
    validate_date_string,
    elapsed_str,
    ensure_directory,
    coords_to_geojson_polygon,
    calculate_polygon_area_km2,
    calculate_polygon_perimeter_km,
)

__all__ = [
    "get_logger",
    "LogTimer",
    "validate_date_string",
    "elapsed_str",
    "ensure_directory",
    "coords_to_geojson_polygon",
    "calculate_polygon_area_km2",
    "calculate_polygon_perimeter_km",
]
