"""
test_pipeline.py — End-to-End Pipeline Integration Tests
=========================================================
"""

from pathlib import Path
from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.pipeline import SettlementImpactPipeline, ImpactPipelineResult


def test_full_pipeline_run(temp_output_dir):
    config = ImpactConfig(
        output_dir=temp_output_dir,
        generate_visualizations=True,
        enable_network_analysis=True,
    )

    pipeline = SettlementImpactPipeline(config)
    result = pipeline.run()

    assert isinstance(result, ImpactPipelineResult)
    assert result.total_flood_area_km2 > 0.0
    assert result.affected_population > 0
    assert result.affected_districts_count > 0
    assert result.affected_municipalities_count > 0
    assert result.elapsed_seconds > 0.0

    # Verify key GeoJSON layers were written
    expected_geojsons = [
        "AffectedDistricts.geojson",
        "AffectedMunicipalities.geojson",
        "AffectedVillages.geojson",
        "AffectedBuildings.geojson",
        "AffectedRoads.geojson",
        "AffectedHospitals.geojson",
        "AffectedSchools.geojson",
        "AffectedPolice.geojson",
    ]
    for filename in expected_geojsons:
        p = Path(temp_output_dir) / filename
        assert p.exists(), f"Expected vector export '{filename}' was not created!"
        assert p.stat().st_size > 0

    # Verify JSON and CSV outputs were written
    expected_reports = [
        "DamageStatistics.json",
        "DashboardData.json",
        "ImpactReport.json",
        "AffectedPopulation.json",
        "InfrastructureSummary.csv",
        "MunicipalityImpactSummary.csv",
    ]
    for filename in expected_reports:
        p = Path(temp_output_dir) / filename
        assert p.exists(), f"Expected report/csv '{filename}' was not created!"
        assert p.stat().st_size > 0

    # Verify cartographic PNG maps were generated
    expected_maps = [
        "Flood_Administrative_Map.png",
        "Road_Impact_Map.png",
        "Critical_Infrastructure_Map.png",
        "Population_Exposure_Heatmap.png",
    ]
    for filename in expected_maps:
        p = Path(temp_output_dir) / filename
        assert p.exists(), f"Expected cartographic map '{filename}' was not created!"
        assert p.stat().st_size > 0
