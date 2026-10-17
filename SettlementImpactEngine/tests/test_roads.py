"""
test_roads.py — Transportation Network Inundation Unit Tests
============================================================
"""

from SettlementImpactEngine.network.road_impact import RoadImpactAnalyzer


def test_road_inundation_assessment(sample_config, sample_bundle):
    analyzer = RoadImpactAnalyzer(sample_config)
    flooded_roads_gdf, summary = analyzer.analyze(
        roads_gdf=sample_bundle["roads"],
        flood_gdf=sample_bundle["flood"],
    )

    assert "total_flooded_length_km" in summary
    assert "flooded_bridges_count" in summary
    assert "by_classification" in summary

    if not flooded_roads_gdf.empty:
        assert "flooded_length_km" in flooded_roads_gdf.columns
        assert "flood_pct" in flooded_roads_gdf.columns
        assert (flooded_roads_gdf["flooded_length_km"] > 0).all()
        assert (flooded_roads_gdf["flood_pct"] <= 100.0).all()
