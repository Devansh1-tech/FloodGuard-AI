"""
test_utils.py — Unit Tests for Utility Modules
================================================

Tests the pure-Python helpers in ``utils.helper`` and the logger
factory in ``utils.logger``.  These tests do **not** require
Google Earth Engine credentials.
"""

from __future__ import annotations

import json
import os
import logging

import pytest
import numpy as np

from FloodDetectionEngine.utils.helper import (
    validate_date_string,
    elapsed_str,
    ensure_directory,
    coords_to_geojson_polygon,
    calculate_polygon_area_km2,
    calculate_polygon_perimeter_km,
    save_json,
    load_json,
)
from FloodDetectionEngine.utils.logger import get_logger, LogTimer


# ── Date validation ─────────────────────────────────────────────────────────

class TestDateValidation:
    """Tests for ``validate_date_string``."""

    def test_valid_date(self) -> None:
        assert validate_date_string("2024-06-15") == "2024-06-15"

    def test_valid_date_edge(self) -> None:
        assert validate_date_string("2000-01-01") == "2000-01-01"

    def test_invalid_format_raises(self) -> None:
        with pytest.raises(ValueError, match="Invalid"):
            validate_date_string("15-06-2024")

    def test_invalid_month_raises(self) -> None:
        with pytest.raises(ValueError):
            validate_date_string("2024-13-01")

    def test_empty_string_raises(self) -> None:
        with pytest.raises(ValueError):
            validate_date_string("")


# ── Elapsed time formatting ─────────────────────────────────────────────────

class TestElapsedStr:
    """Tests for ``elapsed_str``."""

    def test_seconds_only(self) -> None:
        result = elapsed_str(45.123)
        assert "45.12 s" in result

    def test_minutes_and_seconds(self) -> None:
        result = elapsed_str(125.5)
        assert "2 m" in result

    def test_zero(self) -> None:
        result = elapsed_str(0)
        assert "0.00 s" in result


# ── Directory creation ──────────────────────────────────────────────────────

class TestEnsureDirectory:
    """Tests for ``ensure_directory``."""

    def test_creates_directory(self, tmp_path) -> None:
        target = os.path.join(str(tmp_path), "sub", "dir")
        result = ensure_directory(target)
        assert os.path.isdir(target)
        assert result == target

    def test_existing_directory_is_noop(self, tmp_path) -> None:
        result = ensure_directory(str(tmp_path))
        assert os.path.isdir(str(tmp_path))
        assert result == str(tmp_path)


# ── GeoJSON helpers ─────────────────────────────────────────────────────────

class TestGeoJSONHelpers:
    """Tests for GeoJSON construction and geodesic calculations."""

    SQUARE_COORDS = [
        [86.50, 26.40],
        [86.60, 26.40],
        [86.60, 26.50],
        [86.50, 26.50],
        [86.50, 26.40],
    ]

    def test_coords_to_geojson_polygon(self) -> None:
        feature = coords_to_geojson_polygon(self.SQUARE_COORDS)
        assert feature["type"] == "Feature"
        assert feature["geometry"]["type"] == "Polygon"
        assert feature["geometry"]["coordinates"] == [self.SQUARE_COORDS]

    def test_coords_to_geojson_with_properties(self) -> None:
        props = {"name": "test_area", "status": "flooded"}
        feature = coords_to_geojson_polygon(self.SQUARE_COORDS, properties=props)
        assert feature["properties"] == props

    def test_calculate_area_is_positive(self) -> None:
        geom = {"type": "Polygon", "coordinates": [self.SQUARE_COORDS]}
        area = calculate_polygon_area_km2(geom)
        assert area > 0
        # ~0.1° × ~0.1° at lat 26° ≈ roughly 100 km² (order of magnitude)
        assert 50 < area < 200

    def test_calculate_perimeter_is_positive(self) -> None:
        geom = {"type": "Polygon", "coordinates": [self.SQUARE_COORDS]}
        perimeter = calculate_polygon_perimeter_km(geom)
        assert perimeter > 0
        # ~0.1° square ≈ ~40 km perimeter
        assert 20 < perimeter < 80


# ── JSON I/O ────────────────────────────────────────────────────────────────

class TestJsonIO:
    """Tests for ``save_json`` and ``load_json``."""

    def test_roundtrip(self, tmp_path) -> None:
        data = {"key": "value", "number": 42, "nested": {"a": [1, 2, 3]}}
        path = os.path.join(str(tmp_path), "test.json")
        save_json(data, path)
        loaded = load_json(path)
        assert loaded == data


# ── Logger ──────────────────────────────────────────────────────────────────

class TestLogger:
    """Tests for the logger factory and LogTimer."""

    def test_get_logger_returns_logger(self) -> None:
        log = get_logger("test_module", log_file=None)
        assert isinstance(log, logging.Logger)
        assert "FloodDetectionEngine.test_module" in log.name

    def test_log_timer_records_elapsed(self) -> None:
        log = get_logger("test_timer", log_file=None)
        import time
        with LogTimer("test_block", log) as timer:
            time.sleep(0.05)
        assert timer.elapsed >= 0.04  # allow small timing variance
