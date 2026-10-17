"""
conftest.py — Pytest Fixtures for SettlementImpactEngine Tests
==============================================================
"""

import pytest
import shutil
import tempfile
from pathlib import Path
import geopandas as gpd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.datasets.mock_data_generator import MockNepalDataGenerator


@pytest.fixture(scope="session")
def mock_generator():
    """Shared mock generator instance for Koshi Basin."""
    return MockNepalDataGenerator()


@pytest.fixture
def temp_output_dir():
    """Create a temporary directory for test outputs, cleaned up after."""
    tmp = tempfile.mkdtemp(prefix="floodguard_test_")
    yield tmp
    shutil.rmtree(tmp, ignore_errors=True)


@pytest.fixture
def sample_config(temp_output_dir):
    """Config pointing to temporary output directory."""
    return ImpactConfig(
        output_dir=temp_output_dir,
        generate_visualizations=False,  # faster testing
        enable_network_analysis=True,
    )


@pytest.fixture
def sample_bundle(mock_generator):
    """Pre-generated dataset bundle for testing."""
    settlements, buildings = mock_generator.generate_settlements_and_buildings(num_buildings=50)
    return {
        "admin": mock_generator.generate_administrative_boundaries(),
        "roads": mock_generator.generate_road_network(),
        "buildings": buildings,
        "settlements": settlements,
        "infrastructure": mock_generator.generate_critical_infrastructure(),
        "flood": mock_generator.generate_flood_extent(),
        "population": mock_generator.generate_population_grid(grid_size=10),
    }
