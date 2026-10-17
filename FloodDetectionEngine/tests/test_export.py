"""
test_export.py — Unit Tests for Export Module
=============================================

Tests the GeoTIFFExporter and GeoJSONExporter classes, including
local GeoTIFF array writing, rasterio georeferencing, NoData handling,
compression, and GeoJSON directory management.
"""

from __future__ import annotations

import os
import numpy as np
import pytest
import affine
import rasterio

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.export.export_geotiff import GeoTIFFExporter
from FloodDetectionEngine.export.export_geojson import GeoJSONExporter


@pytest.fixture
def test_config(tmp_path) -> EngineConfig:
    return EngineConfig(
        aoi_name="nepal_terai_koshi",
        output_dir=str(tmp_path / "exports"),
    )


class TestGeoTIFFExporter:
    """Tests for GeoTIFFExporter."""

    def test_write_array_geotiff_float32(self, test_config, tmp_path):
        exporter = GeoTIFFExporter(test_config)
        out_path = str(tmp_path / "test_float.tif")

        # Synthetic 50x50 float array
        data = np.random.uniform(-25.0, 5.0, size=(50, 50)).astype(np.float32)
        transform = affine.Affine(0.0001, 0.0, 87.0, 0.0, -0.0001, 26.5)
        crs = "EPSG:4326"

        written = exporter.write_array_geotiff(
            array=data,
            output_path=out_path,
            transform=transform,
            crs=crs,
            dtype="float32",
            nodata=-9999.0,
        )

        assert os.path.exists(written)
        with rasterio.open(written) as src:
            assert src.count == 1
            assert src.width == 50
            assert src.height == 50
            assert src.crs.to_string() == crs
            assert src.nodata == -9999.0
            assert src.compression == rasterio.enums.Compression.lzw
            read_data = src.read(1)
            np.testing.assert_allclose(read_data, data, rtol=1e-5)

    def test_write_array_geotiff_uint8(self, test_config, tmp_path):
        exporter = GeoTIFFExporter(test_config)
        out_path = str(tmp_path / "nested" / "dir" / "test_mask.tif")

        # Synthetic 30x40 binary mask
        data = np.zeros((30, 40), dtype=np.uint8)
        data[5:15, 10:25] = 1
        transform = affine.Affine(0.0001, 0.0, 85.0, 0.0, -0.0001, 27.0)
        crs = "EPSG:4326"

        written = exporter.write_array_geotiff(
            array=data,
            output_path=out_path,
            transform=transform,
            crs=crs,
            dtype="uint8",
            nodata=255,
        )

        assert os.path.exists(written)
        with rasterio.open(written) as src:
            assert src.count == 1
            assert src.width == 40
            assert src.height == 30
            assert src.nodata == 255
            read_data = src.read(1)
            assert np.array_equal(read_data, data)


class TestGeoJSONExporter:
    """Tests for GeoJSONExporter."""

    def test_init(self, test_config):
        exporter = GeoJSONExporter(test_config)
        assert exporter.config == test_config
