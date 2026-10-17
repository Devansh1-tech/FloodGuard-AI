"""
test_infrastructure.py — Critical Infrastructure Impact Unit Tests
===================================================================
"""

from SettlementImpactEngine.analysis.infrastructure_impact import InfrastructureImpactAnalyzer


def test_critical_infrastructure_assessment(sample_config, sample_bundle):
    analyzer = InfrastructureImpactAnalyzer(sample_config)
    category_layers, summary = analyzer.analyze(
        infrastructure_gdf=sample_bundle["infrastructure"],
        flood_gdf=sample_bundle["flood"],
    )

    assert "all" in category_layers
    assert "hospitals" in category_layers
    assert "schools" in category_layers
    assert "police" in category_layers
    assert "shelters" in category_layers

    assert "total_facilities_flooded" in summary
    assert "total_facilities_encroached_buffer" in summary
    assert "by_category" in summary

    # Verify nearest safe facility routing column exists if facilities are impacted
    all_impacted = category_layers["all"]
    if not all_impacted.empty:
        assert "is_flooded" in all_impacted.columns
        assert "nearest_safe_facility" in all_impacted.columns
        assert "nearest_safe_distance_km" in all_impacted.columns
