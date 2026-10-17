"""
admin_impact.py — Administrative Boundary Impact Assessment
============================================================

Module 1 of Stage 3: Evaluates flood inundation across the national
administrative hierarchy (Provinces, Districts, Municipalities, Wards).
"""

from __future__ import annotations

from typing import Dict, Any, Tuple
import geopandas as gpd
import pandas as pd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.overlay.intersection import SpatialIntersectionEngine
from SettlementImpactEngine.utils.crs import to_geographic, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class AdministrativeImpactAnalyzer:
    """
    Evaluates flood exposure against national administrative boundaries.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config
        self.intersection_engine = SpatialIntersectionEngine(config.projected_crs)

    def analyze(
        self,
        admin_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
    ) -> Tuple[gpd.GeoDataFrame, gpd.GeoDataFrame, Dict[str, Any]]:
        """
        Execute administrative boundary overlay.

        Parameters
        ----------
        admin_gdf : gpd.GeoDataFrame
            Administrative units (Provinces / Districts / Municipalities).
        flood_gdf : gpd.GeoDataFrame
            Dissolved or raw flood polygon vectors.

        Returns
        -------
        tuple[gpd.GeoDataFrame, gpd.GeoDataFrame, dict]
            - ``affected_municipalities_gdf``
            - ``affected_districts_gdf``
            - ``summary_statistics``
        """
        with LogTimer("Administrative Boundary Analysis", logger):
            empty_summary = {
                "total_provinces_affected": 0,
                "total_districts_affected": 0,
                "total_municipalities_affected": 0,
                "affected_provinces": [],
                "affected_districts": [],
                "affected_municipalities": [],
                "total_administrative_flooded_km2": 0.0,
            }

            if admin_gdf is None or admin_gdf.empty or flood_gdf is None or flood_gdf.empty:
                empty_gdf = gpd.GeoDataFrame(columns=["municipality_name", "geometry"], crs=DEFAULT_GEOGRAPHIC_CRS)
                return empty_gdf, empty_gdf, empty_summary

            # 1. Overlay Municipalities with Flood Footprint
            inter_muni = self.intersection_engine.intersect_polygons(
                base_gdf=admin_gdf,
                flood_gdf=flood_gdf,
                id_col="municipality_id",
            )

            if inter_muni.empty:
                logger.info("No administrative units intersect the flood polygon.")
                empty_gdf = gpd.GeoDataFrame(columns=admin_gdf.columns, crs=DEFAULT_GEOGRAPHIC_CRS)
                return empty_gdf, empty_gdf, empty_summary

            # Classify severity per municipality
            def classify_severity(pct: float) -> str:
                if pct >= 30.0:
                    return "Extreme"
                elif pct >= 15.0:
                    return "High"
                elif pct >= 5.0:
                    return "Moderate"
                return "Low"

            inter_muni["severity_level"] = inter_muni["flood_pct"].apply(classify_severity)

            # 2. Aggregate to District Level
            district_records = []
            if "district_name" in inter_muni.columns:
                for dist_name, group in inter_muni.groupby("district_name"):
                    prov_name = group["province_name"].iloc[0] if "province_name" in group.columns else "Unknown"
                    flooded_km2 = round(group["flooded_area_km2"].sum(), 2)
                    total_km2 = round(group["total_area_km2"].sum(), 2)
                    flood_pct = round((flooded_km2 / max(1e-6, total_km2)) * 100.0, 2)
                    # Dissolve geometries to district flood extent
                    dissolved_geom = group.union_all() if hasattr(group, "union_all") else group.unary_union

                    district_records.append({
                        "district_name": dist_name,
                        "province_name": prov_name,
                        "flooded_area_km2": flooded_km2,
                        "total_area_km2": total_km2,
                        "flood_pct": min(100.0, flood_pct),
                        "municipalities_affected_count": len(group),
                        "severity_level": classify_severity(flood_pct),
                        "geometry": dissolved_geom,
                    })

            districts_gdf = gpd.GeoDataFrame(district_records, crs=DEFAULT_GEOGRAPHIC_CRS) if district_records else gpd.GeoDataFrame()

            # 3. Compile Structured Summary Statistics
            affected_provinces = sorted(list(inter_muni["province_name"].unique())) if "province_name" in inter_muni.columns else []
            affected_districts = sorted(list(inter_muni["district_name"].unique())) if "district_name" in inter_muni.columns else []
            affected_munis = []

            for _, row in inter_muni.iterrows():
                affected_munis.append({
                    "municipality_id": str(row.get("municipality_id", "")),
                    "municipality_name": str(row.get("municipality_name", "Unknown")),
                    "district_name": str(row.get("district_name", "Unknown")),
                    "province_name": str(row.get("province_name", "Unknown")),
                    "type": str(row.get("municipality_type", "Municipality")),
                    "flooded_area_km2": float(row.get("flooded_area_km2", 0.0)),
                    "total_area_km2": float(row.get("total_area_km2", 0.0)),
                    "flood_percentage": float(row.get("flood_pct", 0.0)),
                    "severity": str(row.get("severity_level", "Low")),
                })

            summary = {
                "total_provinces_affected": len(affected_provinces),
                "total_districts_affected": len(affected_districts),
                "total_municipalities_affected": len(inter_muni),
                "affected_provinces": affected_provinces,
                "affected_districts": affected_districts,
                "affected_municipalities": affected_munis,
                "total_administrative_flooded_km2": round(float(inter_muni["flooded_area_km2"].sum()), 2),
            }

            logger.info(
                "Administrative impact identified: %d province(s), %d district(s), %d municipality(ies) affected.",
                len(affected_provinces),
                len(affected_districts),
                len(inter_muni),
            )
            return inter_muni, districts_gdf, summary
