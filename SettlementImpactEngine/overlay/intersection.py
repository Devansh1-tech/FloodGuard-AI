"""
intersection.py — Core Spatial Overlay & Intersection Engine
============================================================

Executes topological intersections across polygon, linear, and point features
with rigorous geometric repair, metric surface measurement, and proportion math.
"""

from __future__ import annotations

import geopandas as gpd
import pandas as pd

from SettlementImpactEngine.utils.crs import (
    ensure_crs,
    to_projected,
    to_geographic,
    DEFAULT_GEOGRAPHIC_CRS,
    DEFAULT_PROJECTED_CRS,
)
from SettlementImpactEngine.utils.geometry import (
    fix_invalid_geometries,
    dissolve_flood_footprint,
    calculate_precise_area_km2,
    calculate_precise_length_km,
)
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class SpatialIntersectionEngine:
    """
    Production-grade spatial overlay engine for disaster impact evaluation.
    """

    def __init__(self, projected_crs: str = DEFAULT_PROJECTED_CRS) -> None:
        self.projected_crs = projected_crs

    def intersect_polygons(
        self,
        base_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
        id_col: str = "municipality_id",
    ) -> gpd.GeoDataFrame:
        """
        Overlay polygon features (e.g. Municipalities / Districts / Wards)
        with the dissolved flood footprint.

        Calculates:
        - ``total_area_km2``: original unit area in km²
        - ``flooded_area_km2``: flooded portion in km²
        - ``flood_pct``: percentage of unit submerged (0 - 100%)

        Returns
        -------
        gpd.GeoDataFrame
            Impacted polygon units with flood metrics attached.
        """
        if base_gdf is None or base_gdf.empty or flood_gdf is None or flood_gdf.empty:
            return gpd.GeoDataFrame(columns=base_gdf.columns if base_gdf is not None else [], crs=DEFAULT_GEOGRAPHIC_CRS)

        # Standardize and project layers
        base_proj = to_projected(fix_invalid_geometries(base_gdf), self.projected_crs)
        flood_proj = to_projected(dissolve_flood_footprint(flood_gdf), self.projected_crs)

        # Record original areas
        base_proj["total_area_km2"] = base_proj.geometry.area / 1_000_000.0

        # Perform geometric intersection
        try:
            inter = gpd.overlay(base_proj, flood_proj, how="intersection", keep_geom_type=True)
        except Exception as e:
            logger.warning("Intersection overlay raised %s, executing buffered repair.", e)
            base_proj["geometry"] = base_proj.geometry.buffer(0)
            flood_proj["geometry"] = flood_proj.geometry.buffer(0)
            inter = gpd.overlay(base_proj, flood_proj, how="intersection", keep_geom_type=True)

        if inter.empty:
            logger.info("No spatial intersection found between polygons and flood footprint.")
            return gpd.GeoDataFrame(columns=base_gdf.columns, crs=DEFAULT_GEOGRAPHIC_CRS)

        # Measure flooded area
        inter["flooded_area_km2"] = inter.geometry.area / 1_000_000.0
        inter["flood_pct"] = (inter["flooded_area_km2"] / inter["total_area_km2"].replace(0, 1e-6)) * 100.0
        inter["flood_pct"] = inter["flood_pct"].clip(upper=100.0).round(2)
        inter["flooded_area_km2"] = inter["flooded_area_km2"].round(3)
        inter["total_area_km2"] = inter["total_area_km2"].round(3)

        # Convert back to geographic CRS for standard serialization
        return to_geographic(inter)

    def intersect_lines(
        self,
        roads_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
        id_col: str = "road_id",
    ) -> gpd.GeoDataFrame:
        """
        Overlay linear features (road networks) with the flood extent.

        Calculates:
        - ``total_length_km``
        - ``flooded_length_km``
        - ``flood_pct``
        """
        if roads_gdf is None or roads_gdf.empty or flood_gdf is None or flood_gdf.empty:
            return gpd.GeoDataFrame(columns=roads_gdf.columns if roads_gdf is not None else [], crs=DEFAULT_GEOGRAPHIC_CRS)

        roads_proj = to_projected(fix_invalid_geometries(roads_gdf), self.projected_crs)
        flood_proj = to_projected(dissolve_flood_footprint(flood_gdf), self.projected_crs)

        roads_proj["total_length_km"] = roads_proj.geometry.length / 1000.0

        try:
            inter = gpd.overlay(roads_proj, flood_proj, how="intersection", keep_geom_type=False)
        except Exception as e:
            logger.warning("Linear intersection exception %s, applying geometry repair.", e)
            roads_proj["geometry"] = roads_proj.geometry.buffer(0)
            flood_proj["geometry"] = flood_proj.geometry.buffer(0)
            inter = gpd.overlay(roads_proj, flood_proj, how="intersection", keep_geom_type=False)

        if inter.empty:
            return gpd.GeoDataFrame(columns=roads_gdf.columns, crs=DEFAULT_GEOGRAPHIC_CRS)

        # Keep only LineString and MultiLineString
        inter = inter[inter.geometry.type.isin(["LineString", "MultiLineString"])].copy()
        inter["flooded_length_km"] = (inter.geometry.length / 1000.0).round(3)
        inter["flood_pct"] = ((inter["flooded_length_km"] / inter["total_length_km"].replace(0, 1e-6)) * 100.0).clip(upper=100.0).round(2)

        return to_geographic(inter)

    def intersect_points(
        self,
        points_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
        buffer_meters: float = 0.0,
    ) -> gpd.GeoDataFrame:
        """
        Identify point assets (facilities / buildings) located inside the flood extent
        or within a designated encroachment buffer.
        """
        if points_gdf is None or points_gdf.empty or flood_gdf is None or flood_gdf.empty:
            return gpd.GeoDataFrame(columns=points_gdf.columns if points_gdf is not None else [], crs=DEFAULT_GEOGRAPHIC_CRS)

        points_proj = to_projected(fix_invalid_geometries(points_gdf), self.projected_crs)
        flood_proj = to_projected(dissolve_flood_footprint(flood_gdf), self.projected_crs)

        if buffer_meters > 0:
            flood_test_geom = flood_proj.copy()
            flood_test_geom["geometry"] = flood_test_geom.geometry.buffer(buffer_meters)
        else:
            flood_test_geom = flood_proj

        joined = gpd.sjoin(points_proj, flood_test_geom, how="inner", predicate="intersects")
        joined = joined.drop(columns=[col for col in ["index_right", "flood_id"] if col in joined.columns])

        return to_geographic(joined)
