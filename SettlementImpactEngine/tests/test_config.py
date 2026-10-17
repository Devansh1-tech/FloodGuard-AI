"""
test_config.py — ImpactConfig Unit Tests
========================================
"""

from pathlib import Path
from SettlementImpactEngine.config.config import ImpactConfig


def test_default_config_initialization():
    config = ImpactConfig()
    assert config.aoi_name == "nepal_terai_koshi"
    assert config.projected_crs == "EPSG:32645"
    assert config.geographic_crs == "EPSG:4326"
    assert config.infrastructure_buffer_meters == 250.0
    assert config.generate_visualizations is True
    assert config.enable_network_analysis is True


def test_custom_output_directory(temp_output_dir):
    config = ImpactConfig(output_dir=temp_output_dir)
    assert Path(config.output_dir).exists()
    assert config.get_output_path("test.geojson") == str(Path(temp_output_dir) / "test.geojson")


def test_road_classes_and_facilities():
    config = ImpactConfig()
    assert "highway" in config.road_classes
    assert "trunk" in config.road_classes
    assert "health" in config.facility_categories
    assert "education" in config.facility_categories
    assert "security" in config.facility_categories
