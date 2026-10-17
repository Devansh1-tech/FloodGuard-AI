"""
infrastructure_impact.py — Critical Infrastructure Impact Assessment
=====================================================================

Module 4 of Stage 3: Evaluates lifeline disruption across hospitals, schools,
security posts, and emergency shelters. Calculates nearest safe facility distances.
"""

from __future__ import annotations

from typing import Dict, Any, Tuple, List
import geopandas as gpd
import pandas as pd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.overlay.intersection import SpatialIntersectionEngine
from SettlementImpactEngine.overlay.spatial_index import SpatialIndexQuery
from SettlementImpactEngine.utils.crs import to_projected, to_geographic, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries, dissolve_flood_footprint
from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class InfrastructureImpactAnalyzer:
    """
    Assesses flood impacts on critical community lifelines and emergency facilities.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config
        self.intersection_engine = SpatialIntersectionEngine(config.projected_crs)

    def analyze(
        self,
        infrastructure_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
    ) -> Tuple[Dict[str, gpd.GeoDataFrame], Dict[str, Any]]:
        """
        Execute critical infrastructure exposure and emergency routing analysis.

        Parameters
        ----------
        infrastructure_gdf : gpd.GeoDataFrame
            Critical facility point assets.
        flood_gdf : gpd.GeoDataFrame
            Flood extent polygon.

        Returns
        -------
        tuple[dict[str, gpd.GeoDataFrame], dict]
            - Dictionary of categorized GeoDataFrames:
              'all', 'hospitals', 'schools', 'police', 'shelters'
            - Comprehensive infrastructure damage report dictionary
        """
        with LogTimer("Critical Infrastructure Assessment", logger):
            empty_gdf = gpd.GeoDataFrame(columns=["facility_name", "geometry"], crs=DEFAULT_GEOGRAPHIC_CRS)
            category_layers = {
                "all": empty_gdf,
                "hospitals": empty_gdf,
                "schools": empty_gdf,
                "police": empty_gdf,
                "shelters": empty_gdf,
            }

            if infrastructure_gdf is None or infrastructure_gdf.empty or flood_gdf is None or flood_gdf.empty:
                return category_layers, {
                    "total_facilities_flooded": 0,
                    "total_facilities_encroached": 0,
                    "by_category": {},
                    "facilities_list": [],
                }

            # 1. Project layers for metric spatial operations
            infra_proj = to_projected(fix_invalid_geometries(infrastructure_gdf), self.config.projected_crs)
            flood_proj = to_projected(dissolve_flood_footprint(flood_gdf), self.config.projected_crs)

            # Direct flooding test
            direct_joined = gpd.sjoin(infra_proj, flood_proj, how="inner", predicate="intersects")
            direct_ids = set(direct_joined["facility_id"]) if "facility_id" in direct_joined.columns else set()

            # Buffer encroachment test (e.g. 250m buffer)
            buffer_dist = self.config.infrastructure_buffer_meters
            flood_buffered = flood_proj.copy()
            flood_buffered["geometry"] = flood_buffered.geometry.buffer(buffer_dist)
            buffer_joined = gpd.sjoin(infra_proj, flood_buffered, how="inner", predicate="intersects")
            encroached_ids = set(buffer_joined["facility_id"]) if "facility_id" in buffer_joined.columns else set()

            # Tag operational status and flood risk
            infra_analyzed = infra_proj.copy()
            infra_analyzed["is_flooded"] = infra_analyzed["facility_id"].isin(direct_ids)
            infra_analyzed["is_encroached_250m"] = infra_analyzed["facility_id"].isin(encroached_ids)
            infra_analyzed["operational_status"] = infra_analyzed["is_flooded"].apply(
                lambda x: "SUBMERGED / INOPERABLE" if x else "OPERATIONAL"
            )

            # 2. Nearest Safe Facility Routing
            # Build spatial index on strictly OPERATIONAL facilities
            operational_facilities = infra_analyzed[~infra_analyzed["is_flooded"]]
            spatial_index = SpatialIndexQuery(operational_facilities, self.config.projected_crs)

            # Route flooded facilities to nearest safe alternate
            flooded_facilities = infra_analyzed[infra_analyzed["is_flooded"]].copy()
            if not flooded_facilities.empty:
                routed = spatial_index.query_nearest_facility(flooded_facilities)
                for idx in routed.index:
                    infra_analyzed.loc[idx, "nearest_safe_facility"] = routed.loc[idx, "nearest_facility_name"]
                    infra_analyzed.loc[idx, "nearest_safe_distance_km"] = routed.loc[idx, "nearest_distance_km"]
            else:
                infra_analyzed["nearest_safe_facility"] = "N/A (No flooding)"
                infra_analyzed["nearest_safe_distance_km"] = 0.0

            # 3. Categorize into specific output GeoDataFrames
            impacted_all = infra_analyzed[infra_analyzed["is_flooded"] | infra_analyzed["is_encroached_250m"]]
            category_layers["all"] = to_geographic(impacted_all)

            # Health
            hospitals = impacted_all[impacted_all["category"].isin(["health", "hospital", "clinic"])]
            category_layers["hospitals"] = to_geographic(hospitals)

            # Education
            schools = impacted_all[impacted_all["category"].isin(["education", "school", "college"])]
            category_layers["schools"] = to_geographic(schools)

            # Security
            police = impacted_all[impacted_all["category"].isin(["security", "police", "fire_station"])]
            category_layers["police"] = to_geographic(police)

            # Shelters
            shelters = impacted_all[impacted_all["category"].isin(["shelter", "emergency_shelter"])]
            category_layers["shelters"] = to_geographic(shelters)

            # 4. Generate Structured Telemetry
            facility_records = []
            for _, row in impacted_all.iterrows():
                facility_records.append({
                    "facility_id": str(row.get("facility_id", "")),
                    "name": str(row.get("facility_name", "Unknown Facility")),
                    "category": str(row.get("category", "General")),
                    "sub_type": str(row.get("sub_type", "Public")),
                    "capacity": int(row.get("capacity", 0)),
                    "is_flooded": bool(row.get("is_flooded", False)),
                    "is_encroached": bool(row.get("is_encroached_250m", False)),
                    "status": str(row.get("operational_status", "OPERATIONAL")),
                    "nearest_safe_facility": str(row.get("nearest_safe_facility", "None")),
                    "nearest_safe_distance_km": float(row.get("nearest_safe_distance_km", 0.0)),
                })

            summary = {
                "total_facilities_impacted": len(impacted_all),
                "total_facilities_flooded": len(direct_ids),
                "total_facilities_encroached_buffer": len(encroached_ids),
                "by_category": {
                    "health": len(hospitals),
                    "education": len(schools),
                    "security": len(police),
                    "shelters": len(shelters),
                },
                "facility_details": facility_records,
            }

            logger.info(
                "Critical infrastructure assessment complete: %d facility(ies) flooded, "
                "%d within 250m perimeter.",
                len(direct_ids),
                len(encroached_ids),
            )
            return category_layers, summary
