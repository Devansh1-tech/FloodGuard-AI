"""
roads.py — Road Network Dataset Loader
======================================

Loads and validates transportation network vectors (OpenStreetMap / Department
of Roads Nepal) with road classifications, bridge flags, and topology.
"""

from __future__ import annotations

import os
from typing import Optional
import geopandas as gpd

from SettlementImpactEngine.utils.crs import ensure_crs, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class RoadNetworkLoader:
    """
    Loader and validator for road network vector datasets.
    """

    def __init__(self, file_path: Optional[str] = None) -> None:
        self.file_path = file_path

    def load(self) -> gpd.GeoDataFrame:
        """
        Load road networks from disk.
        """
        if self.file_path and os.path.exists(self.file_path):
            logger.info("Loading road networks from: %s", self.file_path)
            gdf = gpd.read_file(self.file_path)
            gdf = ensure_crs(gdf, DEFAULT_GEOGRAPHIC_CRS)

            # Ensure expected attributes exist
            if "highway_type" not in gdf.columns and "highway" in gdf.columns:
                gdf["highway_type"] = gdf["highway"]
            if "is_bridge" not in gdf.columns:
                gdf["is_bridge"] = gdf.get("bridge", False).fillna(False).astype(bool)

            return fix_invalid_geometries(gdf)

        logger.debug("No external road network file found at '%s'.", self.file_path)
        return gpd.GeoDataFrame(
            columns=["road_id", "road_name", "highway_type", "surface", "lanes", "is_bridge", "geometry"],
            crs=DEFAULT_GEOGRAPHIC_CRS,
        )
