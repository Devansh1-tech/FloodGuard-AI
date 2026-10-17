"""
density.py — Spatial Population Density Surface Analysis
========================================================

Computes area-weighted population densities (persons/km²) across inundation zones
and administrative districts.
"""

from __future__ import annotations

import geopandas as gpd
import pandas as pd

from SettlementImpactEngine.utils.crs import to_projected, DEFAULT_PROJECTED_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries, dissolve_flood_footprint


class PopulationDensityAnalyzer:
    """
    Computes spatial population density metrics for risk assessment.
    """

    def __init__(self, projected_crs: str = DEFAULT_PROJECTED_CRS) -> None:
        self.projected_crs = projected_crs

    def compute_flood_zone_density(
        self,
        population_grid_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
    ) -> float:
        """
        Compute mean population density inside the active flood footprint (persons/km²).
        """
        if population_grid_gdf is None or population_grid_gdf.empty or flood_gdf is None or flood_gdf.empty:
            return 0.0

        pop_proj = to_projected(fix_invalid_geometries(population_grid_gdf), self.projected_crs)
        flood_proj = to_projected(dissolve_flood_footprint(flood_gdf), self.projected_crs)

        joined = gpd.sjoin(pop_proj, flood_proj, how="inner", predicate="intersects")
        if joined.empty or "density_per_km2" not in joined.columns:
            return 0.0

        return round(float(joined["density_per_km2"].mean()), 1)
