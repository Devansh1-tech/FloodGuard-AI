"""
admin_boundaries.py — Administrative Boundaries Dataset Loader
==============================================================

Loads and normalizes national and sub-national administrative boundary layers
(Provinces, Districts, Municipalities, Wards) for Nepal.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional
import geopandas as gpd

from SettlementImpactEngine.utils.crs import ensure_crs, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class AdminBoundaryLoader:
    """
    Loader and validator for national administrative boundary vectors.
    """

    def __init__(self, file_path: Optional[str] = None) -> None:
        self.file_path = file_path

    def load(self) -> gpd.GeoDataFrame:
        """
        Load administrative boundaries from disk or return empty GeoDataFrame.
        """
        if self.file_path and os.path.exists(self.file_path):
            logger.info("Loading administrative boundaries from: %s", self.file_path)
            gdf = gpd.read_file(self.file_path)
            gdf = ensure_crs(gdf, DEFAULT_GEOGRAPHIC_CRS)
            return fix_invalid_geometries(gdf)

        logger.debug("No external administrative boundary file found at '%s'.", self.file_path)
        return gpd.GeoDataFrame(
            columns=[
                "province_id", "province_name", "district_id", "district_name",
                "municipality_id", "municipality_name", "municipality_type",
                "total_population", "geometry"
            ],
            crs=DEFAULT_GEOGRAPHIC_CRS,
        )
