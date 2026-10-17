"""
geometry.py — Geometric Operations & Topology Sanitization
==========================================================

Robust geometry validation, topological repairs, metric measurements,
and safe spatial operations for disaster risk assessment.
"""

from __future__ import annotations

from typing import Optional, Union
import geopandas as gpd
import pandas as pd
from shapely.geometry import Polygon, MultiPolygon
from shapely.validation import make_valid

from SettlementImpactEngine.utils.logger import get_logger
from SettlementImpactEngine.utils.crs import (
    ensure_crs,
    to_projected,
    DEFAULT_GEOGRAPHIC_CRS,
    DEFAULT_PROJECTED_CRS,
)

logger = get_logger(__name__)


def fix_invalid_geometries(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Sanitize and fix topologically invalid geometries in a GeoDataFrame.

    Applies ``shapely.validation.make_valid`` and drops empty or null records.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        Input GeoDataFrame.

    Returns
    -------
    gpd.GeoDataFrame
        Cleaned GeoDataFrame with valid geometries.
    """
    if gdf is None or gdf.empty:
        return gdf

    cleaned = gdf.copy()
    initial_count = len(cleaned)

    # Drop null geometries
    cleaned = cleaned[cleaned.geometry.notnull() & (~cleaned.geometry.is_empty)]

    # Validate and repair invalid geometries
    invalid_mask = ~cleaned.geometry.is_valid
    invalid_count = int(invalid_mask.sum())
    if invalid_count > 0:
        logger.warning("Detected %d invalid geometries. Applying topological repair.", invalid_count)
        cleaned.loc[invalid_mask, "geometry"] = cleaned.loc[invalid_mask, "geometry"].apply(make_valid)

    # Ensure no empty geometries remain post-repair
    cleaned = cleaned[~cleaned.geometry.is_empty]
    logger.debug("Topology sanitized: %d -> %d features retained.", initial_count, len(cleaned))
    return cleaned


def dissolve_flood_footprint(flood_gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Dissolve all flood polygons into a single multi-part geometry.

    Prevents double-counting when intersecting with administrative units,
    buildings, or roads.

    Parameters
    ----------
    flood_gdf : gpd.GeoDataFrame
        Input flood polygons.

    Returns
    -------
    gpd.GeoDataFrame
        Dissolved single-row GeoDataFrame with unified flood extent.
    """
    if flood_gdf is None or flood_gdf.empty:
        return gpd.GeoDataFrame(
            {"flood_id": [1], "geometry": [MultiPolygon([])]},
            crs=DEFAULT_GEOGRAPHIC_CRS,
        )

    clean_flood = fix_invalid_geometries(flood_gdf)
    dissolved = clean_flood.dissolve()
    dissolved["flood_id"] = 1
    return dissolved[["flood_id", "geometry"]].reset_index(drop=True)


def calculate_precise_area_km2(
    gdf: gpd.GeoDataFrame,
    projected_crs: str = DEFAULT_PROJECTED_CRS,
) -> pd.Series:
    """
    Calculate accurate planar surface area in square kilometers (km²).

    Reprojects geometry to the designated metric UTM CRS prior to measurement.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        Layer containing polygon geometries.
    projected_crs : str
        Metric coordinate reference system.

    Returns
    -------
    pd.Series
        Area in square kilometers.
    """
    if gdf is None or gdf.empty:
        return pd.Series(dtype=float)

    proj_gdf = to_projected(gdf, projected_crs=projected_crs)
    return proj_gdf.geometry.area / 1_000_000.0


def calculate_precise_length_km(
    gdf: gpd.GeoDataFrame,
    projected_crs: str = DEFAULT_PROJECTED_CRS,
) -> pd.Series:
    """
    Calculate accurate planar length in kilometers (km) for linear features.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        Layer containing line or multiline geometries.
    projected_crs : str
        Metric coordinate reference system.

    Returns
    -------
    pd.Series
        Length in kilometers.
    """
    if gdf is None or gdf.empty:
        return pd.Series(dtype=float)

    proj_gdf = to_projected(gdf, projected_crs=projected_crs)
    return proj_gdf.geometry.length / 1_000.0


def safe_intersection(
    gdf_a: gpd.GeoDataFrame,
    gdf_b: gpd.GeoDataFrame,
) -> gpd.GeoDataFrame:
    """
    Safely intersect two GeoDataFrames with automatic CRS synchronization
    and spatial indexing.

    Parameters
    ----------
    gdf_a : gpd.GeoDataFrame
        Primary layer (e.g., roads, administrative boundaries).
    gdf_b : gpd.GeoDataFrame
        Overlay mask layer (e.g., dissolved flood extent).

    Returns
    -------
    gpd.GeoDataFrame
        Intersected spatial features.
    """
    if gdf_a is None or gdf_a.empty or gdf_b is None or gdf_b.empty:
        return gpd.GeoDataFrame(columns=gdf_a.columns if gdf_a is not None else [], crs=DEFAULT_GEOGRAPHIC_CRS)

    # Ensure matching CRS
    b_matched = ensure_crs(gdf_b, target_crs=gdf_a.crs)
    clean_a = fix_invalid_geometries(gdf_a)
    clean_b = fix_invalid_geometries(b_matched)

    try:
        intersected = gpd.overlay(clean_a, clean_b, how="intersection", keep_geom_type=False)
        return fix_invalid_geometries(intersected)
    except Exception as exc:
        logger.error("Spatial intersection failed: %s. Falling back to spatial join.", exc)
        joined = gpd.sjoin(clean_a, clean_b, how="inner", predicate="intersects")
        return joined
