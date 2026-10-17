"""
geo.py — Geospatial Validation & Spatial Helper Utilities
=========================================================

Validates Area of Interest (AOI) inputs, bounding coordinates,
and GeoJSON polygon structures.
"""

from __future__ import annotations

from typing import Any, List, Tuple, Union

SUPPORTED_PRESETS = {
    "nepal_terai_koshi",
    "nepal_terai_west_rapti",
}


def validate_aoi_input(aoi: Union[str, List[List[float]]]) -> Tuple[bool, str]:
    """
    Validate that an AOI input is either a known preset or a valid polygon ring.

    Returns
    -------
    tuple[bool, str]
        (is_valid, error_message_if_invalid)
    """
    if isinstance(aoi, str):
        if aoi.lower() in SUPPORTED_PRESETS:
            return True, ""
        return False, f"Unknown AOI preset '{aoi}'. Supported: {sorted(SUPPORTED_PRESETS)}"

    if isinstance(aoi, list):
        if len(aoi) < 4:
            return False, "Polygon coordinates must contain at least 4 coordinate pairs (first and last matching)."

        for pt in aoi:
            if not isinstance(pt, (list, tuple)) or len(pt) < 2:
                return False, f"Invalid coordinate pair: {pt}"
            lon, lat = pt[0], pt[1]
            if not (-180.0 <= lon <= 180.0 and -90.0 <= lat <= 90.0):
                return False, f"Coordinate ({lon}, {lat}) out of valid range [-180..180, -90..90]"

        return True, ""

    return False, f"AOI must be a preset string or list of coordinates, got {type(aoi).__name__}"


def compute_bounding_box(coords: List[List[float]]) -> Tuple[float, float, float, float]:
    """
    Compute bounding box [min_lon, min_lat, max_lon, max_lat] for coordinate array.
    """
    lons = [pt[0] for pt in coords]
    lats = [pt[1] for pt in coords]
    return min(lons), min(lats), max(lons), max(lats)
