"""
buildings.py — Building Footprints Dataset Loader
=================================================

Loads and validates building footprints and settlement points (OpenStreetMap,
Microsoft Building Footprints, or Survey Department Nepal).
"""

from __future__ import annotations

import os
from typing import Optional, Tuple
import geopandas as gpd

from SettlementImpactEngine.utils.crs import ensure_crs, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class BuildingLoader:
    """
    Loader for building footprint polygons and settlement point datasets.
    """

    def __init__(self, file_path: Optional[str] = None) -> None:
        self.file_path = file_path

    def load(self) -> gpd.GeoDataFrame:
        """
        Load building footprint polygons from disk.
        """
        if self.file_path and os.path.exists(self.file_path):
            logger.info("Loading building footprints from: %s", self.file_path)
            gdf = gpd.read_file(self.file_path)
            gdf = ensure_crs(gdf, DEFAULT_GEOGRAPHIC_CRS)

            if "building_type" not in gdf.columns:
                gdf["building_type"] = gdf.get("type", "residential")
            if "floors" not in gdf.columns:
                gdf["floors"] = 1
            if "occupancy_estimate" not in gdf.columns:
                gdf["occupancy_estimate"] = 4

            return fix_invalid_geometries(gdf)

        logger.debug("No external building footprints file found at '%s'.", self.file_path)
        return gpd.GeoDataFrame(
            columns=["building_id", "settlement_name", "building_type", "floors", "occupancy_estimate", "geometry"],
            crs=DEFAULT_GEOGRAPHIC_CRS,
        )
