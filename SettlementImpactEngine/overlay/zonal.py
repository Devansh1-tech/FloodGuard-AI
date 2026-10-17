"""
zonal.py — Zonal Statistics & Proportional Population Exposure
==============================================================

Computes proportional raster and vector zonal aggregations, attributing
human and spatial metrics to administrative boundaries and inundation zones.
"""

from __future__ import annotations

import os
from typing import Dict, Any, Optional
import geopandas as gpd
import pandas as pd
import numpy as np

try:
    import rasterio
    from rasterio.mask import mask as rasterio_mask
except ImportError:
    rasterio = None

from SettlementImpactEngine.utils.crs import to_projected, to_geographic, DEFAULT_PROJECTED_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries, dissolve_flood_footprint
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class ZonalStatisticsEngine:
    """
    Computes zonal summaries across raster and vector human exposure layers.
    """

    def __init__(self, projected_crs: str = DEFAULT_PROJECTED_CRS) -> None:
        self.projected_crs = projected_crs

    def compute_vector_population_exposure(
        self,
        pop_grid_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
        admin_gdf: Optional[gpd.GeoDataFrame] = None,
    ) -> Dict[str, Any]:
        """
        Calculate proportional population exposure using vector population grids.

        When a population cell partially overlaps with a flood polygon,
        the affected population is weighted proportionally by intersection area:
        ``exposed_pop = cell_pop * (intersected_area / cell_area)``.

        Parameters
        ----------
        pop_grid_gdf : gpd.GeoDataFrame
            Population surface with 'population' column.
        flood_gdf : gpd.GeoDataFrame
            Flood polygon layer.
        admin_gdf : gpd.GeoDataFrame | None
            Optional administrative boundaries to group exposure by district/municipality.

        Returns
        -------
        dict
            Structured population exposure metrics.
        """
        if pop_grid_gdf is None or pop_grid_gdf.empty or flood_gdf is None or flood_gdf.empty:
            return {
                "total_exposed_population": 0,
                "exposure_percentage": 0.0,
                "admin_breakdown": {},
            }

        # Reproject for accurate metric area math
        pop_proj = to_projected(fix_invalid_geometries(pop_grid_gdf), self.projected_crs)
        flood_proj = to_projected(dissolve_flood_footprint(flood_gdf), self.projected_crs)

        pop_proj["cell_area_m2"] = pop_proj.geometry.area
        total_baseline_pop = int(pop_proj["population"].sum())

        # Intersect cells with flood footprint
        try:
            inter = gpd.overlay(pop_proj, flood_proj, how="intersection", keep_geom_type=True)
        except Exception:
            pop_proj["geometry"] = pop_proj.geometry.buffer(0)
            flood_proj["geometry"] = flood_proj.geometry.buffer(0)
            inter = gpd.overlay(pop_proj, flood_proj, how="intersection", keep_geom_type=True)

        if inter.empty:
            return {
                "total_exposed_population": 0,
                "exposure_percentage": 0.0,
                "admin_breakdown": {},
            }

        inter["submerged_area_m2"] = inter.geometry.area
        inter["overlap_ratio"] = (inter["submerged_area_m2"] / inter["cell_area_m2"].replace(0, 1e-6)).clip(0.0, 1.0)
        inter["exposed_pop"] = inter["population"] * inter["overlap_ratio"]

        total_exposed = int(round(inter["exposed_pop"].sum()))
        exposure_pct = round((total_exposed / max(1, total_baseline_pop)) * 100.0, 2)

        # Attribute to administrative units if available
        admin_breakdown = {}
        if admin_gdf is not None and not admin_gdf.empty:
            admin_proj = to_projected(fix_invalid_geometries(admin_gdf), self.projected_crs)
            joined = gpd.sjoin(inter, admin_proj, how="inner", predicate="intersects")
            if "municipality_name" in joined.columns:
                muni_agg = joined.groupby("municipality_name")["exposed_pop"].sum().round().astype(int)
                admin_breakdown = muni_agg.to_dict()

        return {
            "total_exposed_population": total_exposed,
            "total_baseline_population": total_baseline_pop,
            "exposure_percentage": exposure_pct,
            "admin_breakdown": admin_breakdown,
        }

    def compute_raster_zonal_stats(
        self,
        raster_path: str,
        zones_gdf: gpd.GeoDataFrame,
        zone_id_col: str = "municipality_name",
    ) -> Dict[str, float]:
        """
        Extract zonal sums from a population GeoTIFF (e.g. WorldPop).
        """
        if rasterio is None or not os.path.exists(raster_path) or zones_gdf is None or zones_gdf.empty:
            return {}

        results = {}
        try:
            with rasterio.open(raster_path) as src:
                # Reproject zones to raster CRS
                matched_zones = zones_gdf.to_crs(src.crs)
                for _, row in matched_zones.iterrows():
                    geom = [row.geometry]
                    zone_id = str(row.get(zone_id_col, "Unknown"))
                    try:
                        out_image, _ = rasterio_mask(src, geom, crop=True)
                        data = out_image[0]
                        # Filter no-data
                        valid_data = data[data > 0]
                        val_sum = float(valid_data.sum()) if valid_data.size > 0 else 0.0
                        results[zone_id] = round(val_sum, 1)
                    except Exception as e:
                        logger.debug("Failed raster mask for zone %s: %s", zone_id, e)
                        results[zone_id] = 0.0
        except Exception as exc:
            logger.warning("Raster zonal stats failed: %s", exc)

        return results
