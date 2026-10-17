"""
infrastructure.py — Critical Infrastructure Dataset Loader
===========================================================

Loads and classifies essential community lifelines: hospitals, clinics,
schools, police stations, fire stations, and emergency evacuation shelters.
"""

from __future__ import annotations

import os
from typing import Optional
import geopandas as gpd

from SettlementImpactEngine.utils.crs import ensure_crs, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class InfrastructureLoader:
    """
    Loader for critical public facilities and emergency lifeline assets.
    """

    def __init__(self, file_path: Optional[str] = None) -> None:
        self.file_path = file_path

    def load(self) -> gpd.GeoDataFrame:
        """
        Load infrastructure facilities from disk.
        """
        if self.file_path and os.path.exists(self.file_path):
            logger.info("Loading critical infrastructure from: %s", self.file_path)
            gdf = gpd.read_file(self.file_path)
            gdf = ensure_crs(gdf, DEFAULT_GEOGRAPHIC_CRS)

            if "category" not in gdf.columns:
                gdf["category"] = "general"
            if "capacity" not in gdf.columns:
                gdf["capacity"] = 50

            return fix_invalid_geometries(gdf)

        logger.debug("No external infrastructure file found at '%s'.", self.file_path)
        return gpd.GeoDataFrame(
            columns=["facility_id", "facility_name", "category", "sub_type", "capacity", "geometry"],
            crs=DEFAULT_GEOGRAPHIC_CRS,
        )
