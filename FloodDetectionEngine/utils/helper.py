"""
helper.py — Shared Utility Functions
=====================================

Pure-Python helpers consumed by multiple modules.  None of these functions
depend on Earth Engine so they can be tested without GEE credentials.

Catalogue
---------
- ``validate_date_string``         – ISO-8601 date guard
- ``elapsed_str``                  – human-readable elapsed-time formatter
- ``ensure_directory``             – ``os.makedirs`` wrapper
- ``coords_to_geojson_polygon``    – coordinate list → GeoJSON dict
- ``calculate_polygon_area_km2``   – geodesic area via Shapely / PyProj
- ``calculate_polygon_perimeter_km`` – geodesic perimeter
"""

from __future__ import annotations

import json
import os
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from shapely.geometry import Polygon, shape, mapping
from shapely.ops import transform
import pyproj


# ── Date helpers ────────────────────────────────────────────────────────────

def validate_date_string(date_str: str, label: str = "date") -> str:
    """
    Validate that *date_str* conforms to ``YYYY-MM-DD``.

    Parameters
    ----------
    date_str : str
        Date string to validate.
    label : str
        Human-readable label for error messages.

    Returns
    -------
    str
        The validated (unchanged) date string.

    Raises
    ------
    ValueError
        If the string cannot be parsed as ``YYYY-MM-DD``.
    """
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError as exc:
        raise ValueError(
            f"Invalid {label}: '{date_str}'. Expected YYYY-MM-DD format."
        ) from exc
    return date_str


def elapsed_str(seconds: float) -> str:
    """
    Format *seconds* into a human-readable string.

    Parameters
    ----------
    seconds : float
        Elapsed time in seconds.

    Returns
    -------
    str
        E.g. ``"2 m 34.12 s"`` or ``"0.98 s"``.
    """
    if seconds < 60:
        return f"{seconds:.2f} s"
    minutes = int(seconds // 60)
    remaining = seconds - minutes * 60
    return f"{minutes} m {remaining:.2f} s"


# ── Filesystem helpers ──────────────────────────────────────────────────────

def ensure_directory(path: str) -> str:
    """
    Create *path* (and parents) if it does not exist.

    Parameters
    ----------
    path : str
        Directory path to ensure.

    Returns
    -------
    str
        The same *path* for chaining convenience.
    """
    os.makedirs(path, exist_ok=True)
    return path


# ── GeoJSON helpers ─────────────────────────────────────────────────────────

def coords_to_geojson_polygon(
    coords: List[List[float]],
    properties: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Convert a coordinate ring to a GeoJSON Feature.

    Parameters
    ----------
    coords : list[list[float]]
        Polygon exterior ring as ``[[lon, lat], ...]``.
    properties : dict | None
        Optional feature properties.

    Returns
    -------
    dict
        GeoJSON Feature dictionary.
    """
    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [coords],
        },
        "properties": properties or {},
    }


def _project_geometry(poly: Any, utm_crs: pyproj.CRS) -> Any:
    """Project a shapely geometry from WGS84 to a UTM CRS."""
    wgs84 = pyproj.CRS("EPSG:4326")
    transformer = pyproj.Transformer.from_crs(wgs84, utm_crs, always_xy=True)
    try:
        import shapely
        if hasattr(shapely, "transform"):
            return shapely.transform(
                poly,
                lambda coords: np.column_stack(
                    transformer.transform(coords[:, 0], coords[:, 1])
                ),
            )
    except Exception:
        pass
    from shapely.ops import transform as ops_transform
    return ops_transform(transformer.transform, poly)


def calculate_polygon_area_km2(geojson_geometry: Dict[str, Any]) -> float:
    """
    Compute the geodesic area of a GeoJSON polygon in km².

    Re-projects the geometry from WGS84 (EPSG:4326) into the
    appropriate UTM zone based on the centroid longitude, then
    computes planar area.  This is accurate to within < 0.1 %
    for typical flood polygons.

    Parameters
    ----------
    geojson_geometry : dict
        GeoJSON geometry (``{"type": "Polygon", "coordinates": ...}``).

    Returns
    -------
    float
        Area in square kilometres.
    """
    poly = shape(geojson_geometry)
    centroid = poly.centroid
    # Determine UTM zone from centroid longitude
    utm_zone = int((centroid.x + 180) / 6) + 1
    hemisphere = "north" if centroid.y >= 0 else "south"
    utm_crs = pyproj.CRS(f"+proj=utm +zone={utm_zone} +{hemisphere} +datum=WGS84")
    projected = _project_geometry(poly, utm_crs)
    return projected.area / 1e6  # m² → km²


def calculate_polygon_perimeter_km(geojson_geometry: Dict[str, Any]) -> float:
    """
    Compute the geodesic perimeter of a GeoJSON polygon in km.

    Uses the same UTM reprojection strategy as
    :func:`calculate_polygon_area_km2`.

    Parameters
    ----------
    geojson_geometry : dict
        GeoJSON geometry dict.

    Returns
    -------
    float
        Perimeter in kilometres.
    """
    poly = shape(geojson_geometry)
    centroid = poly.centroid
    utm_zone = int((centroid.x + 180) / 6) + 1
    hemisphere = "north" if centroid.y >= 0 else "south"
    utm_crs = pyproj.CRS(f"+proj=utm +zone={utm_zone} +{hemisphere} +datum=WGS84")
    projected = _project_geometry(poly, utm_crs)
    return projected.length / 1e3  # m → km


def save_json(data: Any, filepath: str, indent: int = 2) -> str:
    """
    Serialise *data* to a JSON file.

    Parameters
    ----------
    data : Any
        JSON-serialisable object.
    filepath : str
        Destination file path.
    indent : int
        JSON indentation level.

    Returns
    -------
    str
        The written filepath.
    """
    ensure_directory(os.path.dirname(filepath) if os.path.dirname(filepath) else ".")
    with open(filepath, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=indent, default=str)
    return filepath


def load_json(filepath: str) -> Any:
    """
    Load a JSON file and return its contents.

    Parameters
    ----------
    filepath : str
        Path to the JSON file.

    Returns
    -------
    Any
        Parsed JSON content.
    """
    with open(filepath, "r", encoding="utf-8") as fh:
        return json.load(fh)
