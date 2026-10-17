"""
road_impact.py — Transportation Network Inundation Assessment
=============================================================

Module 3 of Stage 3: Evaluates physical road network submersion, bridge
inundation, and classification-specific disruption across transportation corridors.
"""

from __future__ import annotations

from typing import Dict, Any, Tuple
import geopandas as gpd
import pandas as pd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.overlay.intersection import SpatialIntersectionEngine
from SettlementImpactEngine.utils.crs import to_geographic, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries
from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class RoadImpactAnalyzer:
    """
    Evaluates physical flood damage and submersion across transportation corridors.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config
        self.intersection_engine = SpatialIntersectionEngine(config.projected_crs)

    def analyze(
        self,
        roads_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
    ) -> Tuple[gpd.GeoDataFrame, Dict[str, Any]]:
        """
        Execute linear overlay between road network and flood footprint.

        Parameters
        ----------
        roads_gdf : gpd.GeoDataFrame
            Road network lines.
        flood_gdf : gpd.GeoDataFrame
            Dissolved flood extent vector.

        Returns
        -------
        tuple[gpd.GeoDataFrame, dict]
            - ``affected_roads_gdf``
            - ``transportation_summary``
        """
        with LogTimer("Road Network Inundation Analysis", logger):
            if roads_gdf is None or roads_gdf.empty or flood_gdf is None or flood_gdf.empty:
                empty_gdf = gpd.GeoDataFrame(columns=["road_name", "highway_type", "geometry"], crs=DEFAULT_GEOGRAPHIC_CRS)
                return empty_gdf, {
                    "total_flooded_length_km": 0.0,
                    "flooded_bridges_count": 0,
                    "by_classification": {},
                    "flooded_segments_count": 0,
                }

            # Overlay roads with flood
            flooded_roads = self.intersection_engine.intersect_lines(
                roads_gdf=roads_gdf,
                flood_gdf=flood_gdf,
                id_col="road_id",
            )

            if flooded_roads.empty:
                logger.info("No roads intersect the flood polygon.")
                empty_gdf = gpd.GeoDataFrame(columns=roads_gdf.columns, crs=DEFAULT_GEOGRAPHIC_CRS)
                return empty_gdf, {
                    "total_flooded_length_km": 0.0,
                    "flooded_bridges_count": 0,
                    "by_classification": {},
                    "flooded_segments_count": 0,
                }

            total_flooded_km = round(float(flooded_roads["flooded_length_km"].sum()), 2)

            # Bridge analysis
            bridge_mask = flooded_roads.get("is_bridge", False).fillna(False).astype(bool)
            flooded_bridges_count = int(bridge_mask.sum())

            # Breakdown by highway class
            classification_breakdown = {}
            if "highway_type" in flooded_roads.columns:
                for h_type, grp in flooded_roads.groupby("highway_type"):
                    classification_breakdown[h_type] = {
                        "flooded_length_km": round(float(grp["flooded_length_km"].sum()), 2),
                        "segments_count": len(grp),
                        "bridges_count": int(grp.get("is_bridge", False).sum()),
                    }

            summary = {
                "total_flooded_length_km": total_flooded_km,
                "flooded_segments_count": len(flooded_roads),
                "flooded_bridges_count": flooded_bridges_count,
                "by_classification": classification_breakdown,
                "flooded_roads_sample": [
                    {
                        "road_id": str(r.get("road_id", "")),
                        "name": str(r.get("road_name", "Unnamed Road")),
                        "type": str(r.get("highway_type", "unclassified")),
                        "flooded_km": float(r.get("flooded_length_km", 0.0)),
                        "is_bridge": bool(r.get("is_bridge", False)),
                    }
                    for _, r in flooded_roads.head(20).iterrows()
                ],
            }

            logger.info(
                "Transportation analysis complete: %.2f km of road flooded across %d segments (%d bridges submerged).",
                total_flooded_km,
                len(flooded_roads),
                flooded_bridges_count,
            )

            return flooded_roads, summary
