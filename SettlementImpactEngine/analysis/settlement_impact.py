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
            # Evaluate all settlements for the 4-tier impact taxonomy:
            # - CRITICAL_INUNDATED
            # - PARTIALLY_SUBMERGED
            # - ISOLATED_CUTOFF
            # - SECURE_HIGH_GROUND
            settlement_records = []
            settlement_gdf_rows = []

            if settlements_gdf is not None and not settlements_gdf.empty:
                settlements_proj = to_projected(fix_invalid_geometries(settlements_gdf), self.config.projected_crs)
                
                has_flood = flood_gdf is not None and not flood_gdf.empty
                if has_flood:
                    flood_proj = to_projected(dissolve_flood_footprint(flood_gdf), self.config.projected_crs)
                    flood_union = flood_proj.union_all() if hasattr(flood_proj, "union_all") else flood_proj.unary_union
                else:
                    flood_union = None

                for _, s_row in settlements_gdf.iterrows():
                    s_id = str(s_row.get("settlement_id", f"SETTLE_{len(settlement_records)+1:03d}"))
                    s_name = str(s_row.get("name", "Unknown Village"))
                    s_type = str(s_row.get("type", "Village"))
                    s_pop = int(s_row.get("pop", s_row.get("population", 1200)))
                    s_geom = s_row.geometry

                    # Check proximity and building counts
                    b_count = 0
                    if not affected_bld.empty and "settlement_name" in affected_bld.columns:
                        b_count = int((affected_bld["settlement_name"] == s_name).sum())

                    # Distance to active flood in meters
                    dist_to_flood_m = 99999.0
                    is_directly_flooded = False
                    if flood_union is not None and not flood_union.is_empty:
                        pt_proj = settlements_proj.loc[settlements_proj["name"] == s_name].geometry.iloc[0] if (settlements_proj["name"] == s_name).any() else None
                        if pt_proj is not None:
                            dist_to_flood_m = float(pt_proj.distance(flood_union))
                            is_directly_flooded = dist_to_flood_m < 1.0

                    # Calculate footprint inundation percentage estimate
                    inundation_pct = 0.0
                    if is_directly_flooded or b_count > 10:
                        inundation_pct = min(100.0, round(float(20.0 + b_count * 1.5), 1))
                    elif b_count > 0 or dist_to_flood_m <= 500.0:
                        inundation_pct = min(15.0, round(float(b_count * 1.8 + max(0, (500.0 - dist_to_flood_m) / 50.0)), 1))

                    # Assign 4-Tier Rubric Impact Flag
                    if is_directly_flooded or inundation_pct > 15.0 or b_count >= 10:
                        impact_flag = "CRITICAL_INUNDATED"
                        access_status = "SEVERED"
                        recommended_action = "IMMEDIATE_AIRLIFT_EVACUATION"
                    elif inundation_pct >= 1.0 or b_count > 0 or dist_to_flood_m <= 500.0:
                        impact_flag = "PARTIALLY_SUBMERGED"
                        access_status = "PARTIALLY_ACCESSIBLE"
                        recommended_action = "DEPLOY_RESCUE_BOATS_AND_RELIEF"
                    elif s_row.get("is_isolated", False) or s_row.get("status") == "ISOLATED":
                        impact_flag = "ISOLATED_CUTOFF"
                        access_status = "SEVERED"
                        recommended_action = "HELICOPTER_AIRDROP_AND_AMPHIBIOUS_SUPPLY"
                    else:
                        impact_flag = "SECURE_HIGH_GROUND"
                        access_status = "ACCESSIBLE"
                        recommended_action = "DESIGNATE_AS_RELIEF_AND_SHELTER_HUB"

                    record = {
                        "settlement_id": s_id,
                        "settlement_name": s_name,
                        "settlement_type": s_type,
                        "population": s_pop,
                        "impact_flag": impact_flag,
                        "flooded_buildings_count": b_count,
                        "inundation_percentage": inundation_pct,
                        "distance_to_flood_m": round(dist_to_flood_m, 1),
                        "access_status": access_status,
                        "recommended_action": recommended_action,
                    }
                    settlement_records.append(record)

                    # Build geodataframe row
                    row_dict = dict(record)
                    row_dict["geometry"] = s_geom
                    row_dict["name"] = s_name
                    settlement_gdf_rows.append(row_dict)

            if settlement_gdf_rows:
                affected_settlements = gpd.GeoDataFrame(settlement_gdf_rows, crs=DEFAULT_GEOGRAPHIC_CRS)
            else:
                affected_settlements = gpd.GeoDataFrame(columns=["name", "geometry", "impact_flag"], crs=DEFAULT_GEOGRAPHIC_CRS)

            # Summarize by impact flag
            flag_counts = {
                "CRITICAL_INUNDATED": sum(1 for r in settlement_records if r["impact_flag"] == "CRITICAL_INUNDATED"),
                "PARTIALLY_SUBMERGED": sum(1 for r in settlement_records if r["impact_flag"] == "PARTIALLY_SUBMERGED"),
                "ISOLATED_CUTOFF": sum(1 for r in settlement_records if r["impact_flag"] == "ISOLATED_CUTOFF"),
                "SECURE_HIGH_GROUND": sum(1 for r in settlement_records if r["impact_flag"] == "SECURE_HIGH_GROUND"),
            }

            summary = {
                "settlements_total_analyzed": len(settlement_records),
                "settlements_affected_count": flag_counts["CRITICAL_INUNDATED"] + flag_counts["PARTIALLY_SUBMERGED"] + flag_counts["ISOLATED_CUTOFF"],
                "impact_flag_breakdown": flag_counts,
                "affected_settlements": settlement_records,
                "building_damage_summary": building_stats,
            }

            logger.info(
                "Settlement analysis complete: %d critical, %d partially submerged, %d isolated, %d high ground.",
                flag_counts["CRITICAL_INUNDATED"],
                flag_counts["PARTIALLY_SUBMERGED"],
                flag_counts["ISOLATED_CUTOFF"],
                flag_counts["SECURE_HIGH_GROUND"],
            )

            return affected_settlements, affected_bld, summary
