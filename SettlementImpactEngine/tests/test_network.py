"""
test_network.py — NetworkX Graph Topology and Accessibility Unit Tests
======================================================================
"""

import networkx as nx
from SettlementImpactEngine.network.connectivity import RoadConnectivityGraph
from SettlementImpactEngine.network.accessibility import AccessibilityAnalyzer


def test_graph_construction_and_severance(sample_bundle):
    builder = RoadConnectivityGraph()
    G = builder.build_graph_from_geodataframe(sample_bundle["roads"])

    assert isinstance(G, nx.Graph)
    assert G.number_of_nodes() > 0
    assert G.number_of_edges() > 0

    severance = builder.evaluate_flood_severance(
        baseline_roads_gdf=sample_bundle["roads"],
        flood_gdf=sample_bundle["flood"],
    )

    assert "baseline_connected_components" in severance
    assert "post_flood_connected_components" in severance
    assert "network_fragmentation_ratio" in severance
    assert severance["network_fragmentation_ratio"] >= 1.0


def test_settlement_isolation_analysis(sample_bundle):
    accessibility_analyzer = AccessibilityAnalyzer()
    summary = accessibility_analyzer.evaluate_settlement_isolation(
        settlements_gdf=sample_bundle["settlements"],
        roads_gdf=sample_bundle["roads"],
        emergency_facilities_gdf=sample_bundle["infrastructure"],
        flood_gdf=sample_bundle["flood"],
    )

    assert "total_settlements_evaluated" in summary
    assert "isolated_settlements_count" in summary
    assert "accessibility_loss_percentage" in summary
    assert summary["total_settlements_evaluated"] == len(sample_bundle["settlements"])
