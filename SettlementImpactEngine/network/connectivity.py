"""
connectivity.py — NetworkX Graph Topology & Road Severance Analysis
===================================================================

Builds mathematical graph representations of transportation networks to evaluate
structural fragmentation, bridge loss, and topological severance.
"""

from __future__ import annotations

from typing import Dict, Any, List, Set, Tuple
import geopandas as gpd
import networkx as nx
from shapely.geometry import LineString, Point

from SettlementImpactEngine.utils.crs import to_projected, DEFAULT_PROJECTED_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries, dissolve_flood_footprint
from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class RoadConnectivityGraph:
    """
    Constructs and analyzes topological road network graphs using NetworkX.
    """

    def __init__(self, projected_crs: str = DEFAULT_PROJECTED_CRS) -> None:
        self.projected_crs = projected_crs

    def build_graph_from_geodataframe(self, roads_gdf: gpd.GeoDataFrame) -> nx.Graph:
        """
        Convert road LineStrings into an undirected NetworkX weighted graph.

        Nodes represent intersection endpoints (rounded to 1m metric precision).
        Edges represent road segments weighted by length.
        """
        G = nx.Graph()
        if roads_gdf is None or roads_gdf.empty:
            return G

        proj_roads = to_projected(fix_invalid_geometries(roads_gdf), self.projected_crs)

        for _, row in proj_roads.iterrows():
            geom = row.geometry
            if geom is None or geom.is_empty:
                continue

            lines = [geom] if geom.geom_type == "LineString" else list(geom.geoms)
            for line in lines:
                coords = list(line.coords)
                if len(coords) < 2:
                    continue

                # Quantize coordinates to nearest meter to guarantee topology snap
                u = (round(coords[0][0], 1), round(coords[0][1], 1))
                v = (round(coords[-1][0], 1), round(coords[-1][1], 1))

                length_m = line.length
                road_id = row.get("road_id", "RD_UNKNOWN")
                h_type = row.get("highway_type", "unclassified")
                is_bridge = bool(row.get("is_bridge", False))

                G.add_edge(
                    u, v,
                    weight=length_m,
                    road_id=road_id,
                    highway_type=h_type,
                    is_bridge=is_bridge,
                    geometry=line,
                )

        logger.debug("Constructed road network graph: %d nodes, %d edges.", G.number_of_nodes(), G.number_of_edges())
        return G

    def evaluate_flood_severance(
        self,
        baseline_roads_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
    ) -> Dict[str, Any]:
        """
        Evaluate road network fragmentation by comparing the baseline network
        against the flood-severed network.

        Parameters
        ----------
        baseline_roads_gdf : gpd.GeoDataFrame
            Complete road network.
        flood_gdf : gpd.GeoDataFrame
            Flood polygon extent.

        Returns
        -------
        dict
            Topological network connectivity metrics:
            - baseline_components
            - post_flood_components
            - network_fragmentation_ratio
            - disconnected_isolated_subgraphs_count
            - severed_edges_count
        """
        with LogTimer("Road Network Graph Severance Analysis", logger):
            if baseline_roads_gdf is None or baseline_roads_gdf.empty or flood_gdf is None or flood_gdf.empty:
                return {
                    "baseline_components": 1,
                    "post_flood_components": 1,
                    "network_fragmentation_ratio": 1.0,
                    "severed_edges_count": 0,
                    "isolated_clusters_count": 0,
                }

            # 1. Build Baseline Graph
            G_base = self.build_graph_from_geodataframe(baseline_roads_gdf)
            base_nodes = G_base.number_of_nodes()
            base_edges = G_base.number_of_edges()
            base_components = nx.number_connected_components(G_base) if base_nodes > 0 else 1

            # 2. Identify Severed Segments
            proj_roads = to_projected(fix_invalid_geometries(baseline_roads_gdf), self.projected_crs)
            proj_flood = to_projected(dissolve_flood_footprint(flood_gdf), self.config_or_crs())

            flooded_joined = gpd.sjoin(proj_roads, proj_flood, how="inner", predicate="intersects")
            severed_road_ids = set(flooded_joined["road_id"]) if "road_id" in flooded_joined.columns else set()

            # 3. Build Post-Flood Graph (removing submerged edges)
            G_post = G_base.copy()
            edges_to_remove = [
                (u, v) for u, v, data in G_post.edges(data=True)
                if data.get("road_id") in severed_road_ids
            ]
            G_post.remove_edges_from(edges_to_remove)

            post_components = nx.number_connected_components(G_post) if G_post.number_of_nodes() > 0 else 1
            fragmentation_ratio = round(post_components / max(1, base_components), 2)

            # Isolated small components (< 5 nodes)
            small_clusters = [
                c for c in nx.connected_components(G_post)
                if len(c) < 5 and len(c) > 0
            ]

            summary = {
                "baseline_nodes": base_nodes,
                "baseline_edges": base_edges,
                "baseline_connected_components": base_components,
                "severed_edges_count": len(edges_to_remove),
                "post_flood_connected_components": post_components,
                "network_fragmentation_ratio": fragmentation_ratio,
                "isolated_clusters_count": len(small_clusters),
                "is_network_fractured": post_components > base_components,
            }

            logger.info(
                "Graph severance evaluated: %d baseline components -> %d post-flood components "
                "(%d edges severed, fragmentation ratio: %.2f).",
                base_components,
                post_components,
                len(edges_to_remove),
                fragmentation_ratio,
            )

            return summary

    def config_or_crs(self) -> str:
        return self.projected_crs
