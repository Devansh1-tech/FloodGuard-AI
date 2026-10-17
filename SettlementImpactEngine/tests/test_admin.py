"""
test_admin.py — Administrative Impact Analyzer Unit Tests
=========================================================
"""

import geopandas as gpd
from SettlementImpactEngine.analysis.admin_impact import AdministrativeImpactAnalyzer


def test_administrative_impact_analysis(sample_config, sample_bundle):
    analyzer = AdministrativeImpactAnalyzer(sample_config)
    munis_gdf, districts_gdf, summary = analyzer.analyze(
        admin_gdf=sample_bundle["admin"],
        flood_gdf=sample_bundle["flood"],
    )

    assert not munis_gdf.empty
    assert "flooded_area_km2" in munis_gdf.columns
    assert "flood_pct" in munis_gdf.columns
    assert "severity_level" in munis_gdf.columns

    assert summary["total_provinces_affected"] >= 1
    assert summary["total_districts_affected"] >= 1
    assert summary["total_municipalities_affected"] >= 1
    assert summary["total_administrative_flooded_km2"] > 0.0

    # Ensure flood_pct is <= 100%
    assert (munis_gdf["flood_pct"] <= 100.0).all()
    assert (munis_gdf["flood_pct"] >= 0.0).all()


def test_administrative_impact_empty_inputs(sample_config):
    analyzer = AdministrativeImpactAnalyzer(sample_config)
    empty_admin = gpd.GeoDataFrame()
    empty_flood = gpd.GeoDataFrame()

    munis_gdf, districts_gdf, summary = analyzer.analyze(empty_admin, empty_flood)
    assert munis_gdf.empty
    assert districts_gdf.empty
    assert summary["total_municipalities_affected"] == 0
