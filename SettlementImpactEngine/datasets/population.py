"""
population.py — Population Dataset Loader
=========================================

Handles high-resolution gridded population datasets (WorldPop, LandScan, or
census enumeration polygons) for human exposure modeling.
"""

from __future__ import annotations

import os
from typing import Optional, Union
import geopandas as gpd
import numpy as np

from SettlementImpactEngine.utils.crs import ensure_crs, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class PopulationLoader:
    """
    Loader for raster or vector population surfaces.
    """

    def __init__(self, file_path: Optional[str] = None) -> None:
        self.file_path = file_path

    def load_vector(self) -> gpd.GeoDataFrame:
        """
        Load population vector grid if file is a vector format.
        """
        if self.file_path and os.path.exists(self.file_path):
            ext = os.path.splitext(self.file_path)[1].lower()
            if ext in [".geojson", ".shp", ".gpkg"]:
                logger.info("Loading population vector grid from: %s", self.file_path)
                gdf = gpd.read_file(self.file_path)
                gdf = ensure_crs(gdf, DEFAULT_GEOGRAPHIC_CRS)
                return fix_invalid_geometries(gdf)

        return gpd.GeoDataFrame(
            columns=["cell_id", "population", "density_per_km2", "geometry"],
            crs=DEFAULT_GEOGRAPHIC_CRS,
        )

    def get_raster_path(self) -> Optional[str]:
        """
        Return the raster file path if it exists as a GeoTIFF.
        """
        if self.file_path and os.path.exists(self.file_path):
            ext = os.path.splitext(self.file_path)[1].lower()
            if ext in [".tif", ".tiff"]:
                return self.file_path
        return None
