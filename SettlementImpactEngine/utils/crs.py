"""
crs.py — Coordinate Reference System (CRS) Management
=====================================================

Ensures consistent spatial reference handling across all geospatial
operations. Manages transformations between geographic (WGS 84 / EPSG:4326)
and metric projected systems (UTM Zone 45N / EPSG:32645, UTM Zone 44N / EPSG:32644).
"""

from __future__ import annotations

from typing import Tuple, Union
import geopandas as gpd
from pyproj import CRS

from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)

DEFAULT_GEOGRAPHIC_CRS = "EPSG:4326"
DEFAULT_PROJECTED_CRS = "EPSG:32645"  # UTM Zone 45N (Central & Eastern Nepal)
WEST_NEPAL_PROJECTED_CRS = "EPSG:32644"  # UTM Zone 44N (Western Nepal)


def get_utm_epsg_for_bounds(minx: float, miny: float, maxx: float, maxy: float) -> str:
    """
    Determine the optimal UTM projection EPSG code for a bounding box in Nepal.

    Nepal straddles UTM Zone 44N (west of 84°E) and UTM Zone 45N (east of 84°E).

    Parameters
    ----------
    minx, miny, maxx, maxy : float
        Bounding coordinates in WGS 84 degrees.

    Returns
    -------
    str
        EPSG identifier string (e.g. ``"EPSG:32645"``).
    """
    center_lon = (minx + maxx) / 2.0
    if center_lon < 84.0:
        return WEST_NEPAL_PROJECTED_CRS
    return DEFAULT_PROJECTED_CRS


def ensure_crs(gdf: gpd.GeoDataFrame, target_crs: Union[str, CRS] = DEFAULT_GEOGRAPHIC_CRS) -> gpd.GeoDataFrame:
    """
    Ensure the GeoDataFrame has a defined CRS and is reprojected to target_crs.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        Input vector layer.
    target_crs : str | CRS
        Desired CRS, defaulting to ``"EPSG:4326"``.

    Returns
    -------
    gpd.GeoDataFrame
        GeoDataFrame reprojected to target_crs.
    """
    if gdf is None or gdf.empty:
        return gdf

    if gdf.crs is None:
        logger.warning("GeoDataFrame missing CRS. Assuming default '%s'.", DEFAULT_GEOGRAPHIC_CRS)
        gdf = gdf.set_crs(DEFAULT_GEOGRAPHIC_CRS)

    target_crs_obj = CRS.from_user_input(target_crs)
    if gdf.crs != target_crs_obj:
        logger.debug("Reprojecting layer from %s to %s", gdf.crs.to_string(), target_crs_obj.to_string())
        return gdf.to_crs(target_crs_obj)
    return gdf


def to_projected(gdf: gpd.GeoDataFrame, projected_crs: Union[str, CRS] = DEFAULT_PROJECTED_CRS) -> gpd.GeoDataFrame:
    """
    Reproject GeoDataFrame to a planar metric projection for metric measurements.
    """
    return ensure_crs(gdf, target_crs=projected_crs)


def to_geographic(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Reproject GeoDataFrame back to WGS 84 geographic coordinates for GeoJSON export.
    """
    return ensure_crs(gdf, target_crs=DEFAULT_GEOGRAPHIC_CRS)
