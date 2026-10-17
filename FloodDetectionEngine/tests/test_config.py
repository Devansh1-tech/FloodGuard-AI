"""
test_config.py — Unit Tests for Configuration Module
======================================================

Tests the ``EngineConfig`` dataclass, AOI preset resolution,
output path generation, and serialisation.
"""

from __future__ import annotations

import os
import pytest

from FloodDetectionEngine.config.config import EngineConfig, AOI_PRESETS


class TestAOIPresets:
    """Verify that AOI presets are well-formed."""

    def test_presets_exist(self) -> None:
        """At least one preset must be defined."""
        assert len(AOI_PRESETS) > 0

    @pytest.mark.parametrize("name", list(AOI_PRESETS.keys()))
    def test_preset_is_closed_polygon(self, name: str) -> None:
        """Each preset polygon must be a closed ring (first == last)."""
        coords = AOI_PRESETS[name]
        assert len(coords) >= 4, "Polygon must have at least 4 vertices"
        assert coords[0] == coords[-1], "Polygon ring must be closed"

    @pytest.mark.parametrize("name", list(AOI_PRESETS.keys()))
    def test_preset_coords_are_lon_lat(self, name: str) -> None:
        """Coordinates must be [lon, lat] with valid ranges."""
        for coord in AOI_PRESETS[name]:
            lon, lat = coord
            assert -180 <= lon <= 180, f"Invalid longitude: {lon}"
            assert -90 <= lat <= 90, f"Invalid latitude: {lat}"


class TestEngineConfig:
    """Verify EngineConfig defaults and derived helpers."""

    def test_default_config_instantiates(self) -> None:
        """Default config should instantiate without errors."""
        config = EngineConfig()
        assert config.aoi_name == "nepal_terai_koshi"
        assert config.instrument_mode == "IW"
        assert config.orbit_pass == "DESCENDING"
        assert config.polarization == "VV"

    def test_get_aoi_coordinates_preset(self) -> None:
        """Preset name must resolve to coordinates."""
        config = EngineConfig(aoi_name="nepal_terai_koshi")
        coords = config.get_aoi_coordinates()
        assert len(coords) >= 4
        assert coords[0] == coords[-1]

    def test_get_aoi_coordinates_custom(self) -> None:
        """Explicit aoi_coords must override preset."""
        custom = [[80.0, 26.0], [81.0, 26.0], [81.0, 27.0], [80.0, 27.0], [80.0, 26.0]]
        config = EngineConfig(aoi_name="nonexistent", aoi_coords=custom)
        assert config.get_aoi_coordinates() == custom

    def test_get_aoi_coordinates_invalid_preset_raises(self) -> None:
        """Unknown preset without custom coords must raise ValueError."""
        config = EngineConfig(aoi_name="does_not_exist")
        with pytest.raises(ValueError, match="not found"):
            config.get_aoi_coordinates()

    def test_get_output_path(self, tmp_path) -> None:
        """Output path should combine output_dir and filename."""
        config = EngineConfig(output_dir=str(tmp_path))
        path = config.get_output_path("FloodMask.tif")
        assert path == os.path.join(str(tmp_path), "FloodMask.tif")

    def test_to_dict(self) -> None:
        """Config must serialise to a dict."""
        config = EngineConfig()
        d = config.to_dict()
        assert isinstance(d, dict)
        assert d["aoi_name"] == "nepal_terai_koshi"
        assert d["instrument_mode"] == "IW"

    def test_change_method_validation_values(self) -> None:
        """Verify valid change method options."""
        for method in ("difference", "ratio", "log_ratio"):
            config = EngineConfig(change_method=method)
            assert config.change_method == method

    def test_morphology_defaults(self) -> None:
        """Verify morphology parameter defaults are sensible."""
        config = EngineConfig()
        assert config.morphology_opening_radius >= 0
        assert config.morphology_closing_radius >= 0
        assert config.min_mapping_unit_pixels > 0
        assert config.fill_holes is True

    def test_visualization_palette_has_entries(self) -> None:
        """Diverging palette must have multiple entries."""
        config = EngineConfig()
        assert len(config.vis_palette_difference) >= 5
