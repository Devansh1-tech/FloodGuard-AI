"""
test_settlement.py — Settlement and Building Impact Unit Tests
==============================================================
"""

from SettlementImpactEngine.analysis.settlement_impact import SettlementImpactAnalyzer


def test_settlement_and_building_analysis(sample_config, sample_bundle):
    analyzer = SettlementImpactAnalyzer(sample_config)
    settlements_gdf, buildings_gdf, summary = analyzer.analyze(
        settlements_gdf=sample_bundle["settlements"],
        buildings_gdf=sample_bundle["buildings"],
        flood_gdf=sample_bundle["flood"],
    )

    bld_summary = summary["building_damage_summary"]
    assert bld_summary["total_buildings_flooded"] >= 0
    assert bld_summary["total_building_area_m2"] >= 0.0

    if bld_summary["total_buildings_flooded"] > 0:
        assert not buildings_gdf.empty
        assert "building_id" in buildings_gdf.columns
        assert "footprint_area_m2" in buildings_gdf.columns
        assert bld_summary["estimated_occupants_affected"] > 0
