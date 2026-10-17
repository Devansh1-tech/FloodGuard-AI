"""
test_population.py — Population Exposure Modeling Unit Tests
============================================================
"""

from SettlementImpactEngine.population.exposure import PopulationExposureAnalyzer
from SettlementImpactEngine.population.density import PopulationDensityAnalyzer


def test_population_exposure_modeling(sample_config, sample_bundle):
    analyzer = PopulationExposureAnalyzer(sample_config)
    report = analyzer.analyze(
        population_grid_gdf=sample_bundle["population"],
        flood_gdf=sample_bundle["flood"],
        admin_gdf=sample_bundle["admin"],
    )

    assert "total_affected_population" in report
    assert "total_baseline_population" in report
    assert "exposure_percentage" in report
    assert "demographic_vulnerability" in report

    vulnerability = report["demographic_vulnerability"]
    assert "estimated_displaced_households" in vulnerability
    assert "children_under_5" in vulnerability
    assert "elderly_65_plus" in vulnerability

    assert report["total_affected_population"] > 0
    assert report["exposure_percentage"] > 0.0


def test_population_density_analyzer(sample_bundle):
    density_analyzer = PopulationDensityAnalyzer()
    density = density_analyzer.compute_flood_zone_density(
        population_grid_gdf=sample_bundle["population"],
        flood_gdf=sample_bundle["flood"],
    )
    assert isinstance(density, float)
    assert density >= 0.0
