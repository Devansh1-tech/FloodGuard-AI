"""
settlement_impact.py — Settlement & Building Footprint Impact Assessment
========================================================================

Module 2 of Stage 3: Evaluates flood encroachment across human settlements,
village clusters, and individual building footprints with structural breakdowns.
"""

from __future__ import annotations

from typing import Dict, Any, Tuple
import geopandas as gpd
import pandas as pd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.overlay.intersection import SpatialIntersectionEngine
from SettlementImpactEngine.utils.crs import to_projected, to_geographic, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries, dissolve_flood_footprint
from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class SettlementImpactAnalyzer:
    """
    Assesses flood impacts on villages, human settlements, and building stock.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config
        self.intersection_engine = SpatialIntersectionEngine(config.projected_crs)

    def analyze(
        self,
        settlements_gdf: gpd.GeoDataFrame,
        buildings_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
    ) -> Tuple[gpd.GeoDataFrame, gpd.GeoDataFrame, Dict[str, Any]]:
        """
        Execute settlement and building impact assessment.

        Parameters
        ----------
        settlements_gdf : gpd.GeoDataFrame
            Village and town center points.
        buildings_gdf : gpd.GeoDataFrame
            Building footprint polygons.
        flood_gdf : gpd.GeoDataFrame
            Dissolved flood extent vector.

        Returns
        -------
        tuple[gpd.GeoDataFrame, gpd.GeoDataFrame, dict]
            - ``affected_settlements_gdf``
            - ``affected_buildings_gdf``
            - ``summary_statistics``
        """
        with LogTimer("Settlement & Building Footprint Analysis", logger):
            # ── 1. Building Footprint Inundation ────────────────────────────
            affected_bld = gpd.GeoDataFrame(columns=["building_id", "geometry"], crs=DEFAULT_GEOGRAPHIC_CRS)
            building_stats = {
                "total_buildings_flooded": 0,
                "total_building_area_m2": 0.0,
                "estimated_occupants_affected": 0,
                "by_building_type": {},
            }

            if buildings_gdf is not None and not buildings_gdf.empty and flood_gdf is not None and not flood_gdf.empty:
                # Spatial join: buildings whose footprint intersects the flood
                bld_proj = to_projected(fix_invalid_geometries(buildings_gdf), self.config.projected_crs)
                flood_proj = to_projected(dissolve_flood_footprint(flood_gdf), self.config.projected_crs)

                # Metric area of each building footprint
                bld_proj["footprint_area_m2"] = bld_proj.geometry.area

                # Perform spatial intersection
                joined = gpd.sjoin(bld_proj, flood_proj, how="inner", predicate="intersects")
                joined = joined.drop(columns=[col for col in ["index_right", "flood_id"] if col in joined.columns])

                if not joined.empty:
                    # Remove potential duplicates
                    joined = joined.drop_duplicates(subset=["building_id"] if "building_id" in joined.columns else None)
                    affected_bld = to_geographic(joined)

                    total_bld_count = len(affected_bld)
                    total_area_m2 = round(float(joined["footprint_area_m2"].sum()), 1)
                    est_occupants = int(joined.get("occupancy_estimate", 4).sum())

                    # Breakdown by building category
                    type_breakdown = {}
                    if "building_type" in joined.columns:
                        for b_type, grp in joined.groupby("building_type"):
                            type_breakdown[b_type] = {
                                "count": len(grp),
                                "total_area_m2": round(float(grp["footprint_area_m2"].sum()), 1),
                                "estimated_occupants": int(grp.get("occupancy_estimate", 4).sum()),
                            }

                    building_stats = {
                        "total_buildings_flooded": total_bld_count,
                        "total_building_area_m2": total_area_m2,
                        "estimated_occupants_affected": est_occupants,
                        "by_building_type": type_breakdown,
                    }

            # ── 2. Village / Settlement Center Analysis ──────────────────────
            affected_settlements = gpd.GeoDataFrame(columns=["name", "geometry"], crs=DEFAULT_GEOGRAPHIC_CRS)
            settlement_records = []

            if settlements_gdf is not None and not settlements_gdf.empty and flood_gdf is not None and not flood_gdf.empty:
                # Check settlements within 500m of flood or directly flooded
                settlements_proj = to_projected(fix_invalid_geometries(settlements_gdf), self.config.projected_crs)
                flood_proj = to_projected(dissolve_flood_footprint(flood_gdf), self.config.projected_crs)

                # Buffer 500m for settlement exposure zone
                buffer_500m = flood_proj.copy()
                buffer_500m["geometry"] = buffer_500m.geometry.buffer(500.0)

                joined_settle = gpd.sjoin(settlements_proj, buffer_500m, how="inner", predicate="intersects")
                joined_settle = joined_settle.drop(columns=[col for col in ["index_right", "flood_id"] if col in joined_settle.columns])

                if not joined_settle.empty:
                    joined_settle = joined_settle.drop_duplicates(subset=["settlement_id"] if "settlement_id" in joined_settle.columns else None)
                    affected_settlements = to_geographic(joined_settle)

                    for _, s_row in affected_settlements.iterrows():
                        s_name = s_row.get("name", "Unknown Village")
                        # Count flooded buildings associated with this settlement
                        b_count = 0
                        if not affected_bld.empty and "settlement_name" in affected_bld.columns:
                            b_count = int((affected_bld["settlement_name"] == s_name).sum())

                        settlement_records.append({
                            "settlement_id": str(s_row.get("settlement_id", "")),
                            "settlement_name": s_name,
                            "settlement_type": str(s_row.get("type", "Village")),
                            "population": int(s_row.get("pop", 0)),
                            "flooded_buildings_count": b_count,
                        })

            summary = {
                "settlements_affected_count": len(settlement_records),
                "affected_settlements": settlement_records,
                "building_damage_summary": building_stats,
            }

            logger.info(
                "Settlement analysis complete: %d village(s) and %d building(s) flooded (%.1f m² total footprint).",
                len(settlement_records),
                building_stats["total_buildings_flooded"],
                building_stats["total_building_area_m2"],
            )

            return affected_settlements, affected_bld, summary
