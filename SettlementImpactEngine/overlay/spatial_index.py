"""
spatial_index.py — Spatial Indexing & Nearest Neighbor Searches
==============================================================

Uses Shapely STRtree and SciPy KDTree to execute high-speed spatial queries
and metric nearest-facility proximity searches.
"""

from __future__ import annotations

from typing import List, Optional, Tuple, Dict, Any
import numpy as np
import geopandas as gpd
from shapely.strtree import STRtree
from shapely.geometry import Point, MultiPoint

from SettlementImpactEngine.utils.crs import to_projected, DEFAULT_PROJECTED_CRS
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class SpatialIndexQuery:
    """
    High-performance spatial indexing and nearest-facility calculator.
    """

    def __init__(self, target_gdf: gpd.GeoDataFrame, projected_crs: str = DEFAULT_PROJECTED_CRS) -> None:
        """
        Parameters
        ----------
        target_gdf : gpd.GeoDataFrame
            Target features to index (e.g. operational hospitals, police, shelters).
        projected_crs : str
            Metric CRS for accurate distance calculations in meters.
        """
        self.raw_gdf = target_gdf
        self.projected_crs = projected_crs

        if target_gdf is not None and not target_gdf.empty:
            self.proj_gdf = to_projected(target_gdf, projected_crs)
            self.geometries = list(self.proj_gdf.geometry)
            self.tree = STRtree(self.geometries)
        else:
            self.proj_gdf = gpd.GeoDataFrame()
            self.geometries = []
            self.tree = None

    def query_nearest_facility(
        self,
        origin_gdf: gpd.GeoDataFrame,
        facility_name_col: str = "facility_name",
        category_col: Optional[str] = "category",
    ) -> gpd.GeoDataFrame:
        """
        For each geometry in origin_gdf, find the nearest facility in the index,
        computing metric distance (in meters and km) and nearest facility attributes.

        Parameters
        ----------
        origin_gdf : gpd.GeoDataFrame
            Origins (e.g., affected settlements or flooded schools).
        facility_name_col : str
            Attribute name of the target facility.
        category_col : str | None
            Category attribute name.

        Returns
        -------
        gpd.GeoDataFrame
            Copy of origin_gdf with 'nearest_facility_name', 'nearest_distance_km',
            and 'nearest_facility_id' columns added.
        """
        if origin_gdf is None or origin_gdf.empty or self.tree is None or len(self.geometries) == 0:
            result = origin_gdf.copy() if origin_gdf is not None else gpd.GeoDataFrame()
            result["nearest_facility_name"] = "None"
            result["nearest_distance_km"] = 0.0
            return result

        result = origin_gdf.copy()
        origin_proj = to_projected(origin_gdf, self.projected_crs)

        nearest_names = []
        nearest_ids = []
        nearest_dists_km = []

        for geom in origin_proj.geometry:
            nearest_idx = self.tree.nearest(geom)
            target_geom = self.geometries[nearest_idx]
            dist_m = geom.distance(target_geom)
            dist_km = round(dist_m / 1000.0, 2)

            target_row = self.proj_gdf.iloc[nearest_idx]
            nearest_names.append(target_row.get(facility_name_col, f"Facility_{nearest_idx}"))
            nearest_ids.append(target_row.get("facility_id", f"FAC_{nearest_idx}"))
            nearest_dists_km.append(dist_km)

        result["nearest_facility_id"] = nearest_ids
        result["nearest_facility_name"] = nearest_names
        result["nearest_distance_km"] = nearest_dists_km
        return result
