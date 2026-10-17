"""
accessibility.py — Emergency Routing & Settlement Isolation Assessment
=======================================================================

Evaluates path reachability between affected villages and operational emergency
facilities across severed transportation graphs.
"""

from __future__ import annotations

from typing import Dict, Any, List
import geopandas as gpd
import networkx as nx
from shapely.geometry import Point

from SettlementImpactEngine.network.connectivity import RoadConnectivityGraph
from SettlementImpactEngine.utils.crs import to_projected, DEFAULT_PROJECTED_CRS
from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class AccessibilityAnalyzer:
    """
    Evaluates topological reachability and detects isolated settlements.
    """

    def __init__(self, projected_crs: str = DEFAULT_PROJECTED_CRS) -> None:
        self.projected_crs = projected_crs
        self.graph_builder = RoadConnectivityGraph(projected_crs)

    def evaluate_settlement_isolation(
        self,
        settlements_gdf: gpd.GeoDataFrame,
        roads_gdf: gpd.GeoDataFrame,
        emergency_facilities_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
    ) -> Dict[str, Any]:
        """
        Determine which settlements have lost all road access to emergency
        hospitals, police stations, or evacuation shelters due to road flooding.

        Parameters
        ----------
        settlements_gdf : gpd.GeoDataFrame
            Village points.
        roads_gdf : gpd.GeoDataFrame
            Road network lines.
        emergency_facilities_gdf : gpd.GeoDataFrame
            Operational hospitals and emergency shelters.
        flood_gdf : gpd.GeoDataFrame
            Flood polygon.

        Returns
        -------
        dict
            Accessibility assessment with isolated settlement list and metrics.
        """
        with LogTimer("Settlement Emergency Accessibility Assessment", logger):
            if (
                settlements_gdf is None or settlements_gdf.empty
                or roads_gdf is None or roads_gdf.empty
                or emergency_facilities_gdf is None or emergency_facilities_gdf.empty
            ):
                return {
                    "isolated_settlements_count": 0,
                    "isolated_settlements": [],
                    "accessibility_loss_percentage": 0.0,
                }

            # Build severed graph
            G = self.graph_builder.build_graph_from_geodataframe(roads_gdf)
            if G.number_of_nodes() == 0:
                return {
                    "isolated_settlements_count": 0,
                    "isolated_settlements": [],
                    "accessibility_loss_percentage": 0.0,
                }

            # Sever flooded edges
            severance_info = self.graph_builder.evaluate_flood_severance(roads_gdf, flood_gdf)

            # Snap emergency facilities to nearest graph nodes
            infra_proj = to_projected(emergency_facilities_gdf, self.projected_crs)
            graph_nodes = list(G.nodes())

            def snap_point(pt: Point) -> tuple[float, float]:
                px, py = pt.x, pt.y
                best_node = graph_nodes[0]
                min_dist = float("inf")
                for nx_coord in graph_nodes:
                    d = (px - nx_coord[0]) ** 2 + (py - nx_coord[1]) ** 2
                    if d < min_dist:
                        min_dist = d
                        best_node = nx_coord
                return best_node

            safe_hub_nodes = set()
            for geom in infra_proj.geometry:
                safe_hub_nodes.add(snap_point(geom))

            # Test reachability for each settlement
            settle_proj = to_projected(settlements_gdf, self.projected_crs)
            isolated_settlements = []
            connected_count = 0

            for _, s_row in settle_proj.iterrows():
                s_name = s_row.get("name", "Unknown Village")
                s_node = snap_point(s_row.geometry)

                # Check if reachable to ANY safe hub node in G
                is_reachable = False
                for hub_node in safe_hub_nodes:
                    if nx.has_path(G, s_node, hub_node):
                        is_reachable = True
                        break

                if is_reachable:
                    connected_count += 1
                else:
                    isolated_settlements.append({
                        "settlement_id": str(s_row.get("settlement_id", "")),
                        "settlement_name": s_name,
                        "population": int(s_row.get("pop", 0)),
                        "status": "DISCONNECTED (No Road Route to Emergency Hub)",
                    })

            total_settlements = len(settlements_gdf)
            isolated_count = len(isolated_settlements)
            loss_pct = round((isolated_count / max(1, total_settlements)) * 100.0, 1)

            summary = {
                "total_settlements_evaluated": total_settlements,
                "connected_settlements_count": connected_count,
                "isolated_settlements_count": isolated_count,
                "accessibility_loss_percentage": loss_pct,
                "isolated_settlements": isolated_settlements,
            }

            logger.info(
                "Accessibility analysis complete: %d / %d settlement(s) isolated from emergency hubs (%.1f%% loss).",
                isolated_count,
                total_settlements,
                loss_pct,
            )

            return summary
