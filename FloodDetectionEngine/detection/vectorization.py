"""
vectorization.py — Raster-to-Vector Flood Polygon Generation
==============================================================

Converts the server-side binary flood mask (``ee.Image``) into
client-side vector polygons using two complementary strategies:

1. **EE-native vectorization** — ``ee.Image.reduceToVectors()`` runs
   on Google's servers and returns ``ee.FeatureCollection``.  Best
   for moderate-area exports.
2. **Local rasterio/shapely vectorization** — for post-processing
   flexibility (e.g., topology repair, simplification, area/perimeter
   statistics) after a GeoTIFF has been downloaded.

Both paths produce GeoJSON-compatible features with area, perimeter,
and polygon-level statistics attached as properties.

Output Artefacts
----------------
- ``FloodPolygon.geojson``
- ``FloodPolygon.shp`` (via GeoPandas / Fiona)
- ``statistics.json``
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional, Tuple

import ee
import geopandas as gpd
import numpy as np
from shapely.geometry import mapping, shape

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.helper import (
    calculate_polygon_area_km2,
    calculate_polygon_perimeter_km,
    ensure_directory,
    save_json,
)
from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class Vectorizer:
    """
    Raster flood mask → vector polygon converter.

    Parameters
    ----------
    config : EngineConfig
        Engine configuration.
    """

    def __init__(self, config: EngineConfig) -> None:
        self.config = config
        logger.info("Vectorizer initialised.")

    # ── EE-native vectorization ─────────────────────────────────────────

    def vectorize_ee(
        self,
        flood_mask: ee.Image,
        aoi: ee.Geometry,
        scale: Optional[int] = None,
    ) -> ee.FeatureCollection:
        """
        Convert a binary flood mask to an ``ee.FeatureCollection``
        using ``reduceToVectors`` server-side.

        Only pixels with value ``1`` (flooded) are vectorised.

        Parameters
        ----------
        flood_mask : ee.Image
            Clean binary mask (band ``"flood_mask"``).
        aoi : ee.Geometry
            Region to vectorise within.
        scale : int | None
            Resolution in metres (defaults to config.export_scale).

        Returns
        -------
        ee.FeatureCollection
            Flood polygons.
        """
        eff_scale = scale or self.config.export_scale
        with LogTimer("EE vectorization", logger):
            vectors = flood_mask.selfMask().reduceToVectors(
                geometry=aoi,
                scale=eff_scale,
                geometryType="polygon",
                eightConnected=True,
                bestEffort=True,
                maxPixels=1e10,
                labelProperty="flood",
            )
            count = vectors.size().getInfo()
            logger.info("EE vectorization produced %d polygon(s) at scale %dm.", count, eff_scale)
            return vectors

    # ── Local (post-download) vectorization ─────────────────────────────

    def vectorize_local(
        self,
        flood_mask_array: np.ndarray,
        transform: Any,
        crs: str,
    ) -> gpd.GeoDataFrame:
        """
        Vectorize a local NumPy flood mask array into a GeoDataFrame.

        Uses ``rasterio.features.shapes`` for raster→polygon conversion
        and attaches area / perimeter statistics to each feature.

        Parameters
        ----------
        flood_mask_array : np.ndarray
            2-D binary array (0 / 1), dtype ``uint8``.
        transform : affine.Affine
            Rasterio-style affine transform for georeferencing.
        crs : str
            Coordinate reference system (e.g. ``"EPSG:4326"``).

        Returns
        -------
        geopandas.GeoDataFrame
            Flood polygons with columns:
            ``geometry``, ``flood``, ``area_km2``, ``perimeter_km``.
        """
        import rasterio.features

        with LogTimer("Local vectorization", logger):
            mask_uint8 = flood_mask_array.astype(np.uint8)

            shapes_gen = rasterio.features.shapes(
                mask_uint8,
                mask=mask_uint8 == 1,
                connectivity=8,
                transform=transform,
            )

            records = []
            for geom, value in shapes_gen:
                if value == 1:
                    area_km2 = calculate_polygon_area_km2(geom)
                    perimeter_km = calculate_polygon_perimeter_km(geom)
                    records.append({
                        "geometry": shape(geom),
                        "flood": int(value),
                        "area_km2": round(area_km2, 6),
                        "perimeter_km": round(perimeter_km, 6),
                    })

            if not records:
                logger.warning("No flood polygons generated from raster mask.")
                return gpd.GeoDataFrame(
                    columns=["geometry", "flood", "area_km2", "perimeter_km"],
                    crs=crs,
                )

            gdf = gpd.GeoDataFrame(records, crs=crs)
            logger.info(
                "Local vectorization: %d polygon(s), total area = %.4f km².",
                len(gdf),
                gdf["area_km2"].sum(),
            )
            return gdf

    # ── Export helpers ──────────────────────────────────────────────────

    def save_geojson(
        self,
        gdf: gpd.GeoDataFrame,
        output_path: Optional[str] = None,
    ) -> str:
        """
        Save a GeoDataFrame to GeoJSON.

        Parameters
        ----------
        gdf : geopandas.GeoDataFrame
            Flood polygons.
        output_path : str | None
            Destination file.  Defaults to config-based path.

        Returns
        -------
        str
            Path to the saved file.
        """
        if output_path is None:
            output_path = self.config.get_output_path(
                self.config.export_flood_polygon_geojson
            )
        ensure_directory(os.path.dirname(output_path) if os.path.dirname(output_path) else ".")
        gdf.to_file(output_path, driver="GeoJSON")
        logger.info("GeoJSON saved: %s", output_path)
        return output_path

    def save_shapefile(
        self,
        gdf: gpd.GeoDataFrame,
        output_path: Optional[str] = None,
    ) -> str:
        """
        Save a GeoDataFrame to ESRI Shapefile.

        Parameters
        ----------
        gdf : geopandas.GeoDataFrame
            Flood polygons.
        output_path : str | None
            Destination file.  Defaults to config-based path.

        Returns
        -------
        str
            Path to the saved file.
        """
        if output_path is None:
            output_path = self.config.get_output_path(
                self.config.export_flood_polygon_shp
            )
        ensure_directory(os.path.dirname(output_path) if os.path.dirname(output_path) else ".")
        # ESRI Shapefile field names must be <= 10 characters
        shp_gdf = gdf.copy()
        rename_map = {col: col[:10] for col in shp_gdf.columns if len(col) > 10 and col != "geometry"}
        if rename_map:
            shp_gdf = shp_gdf.rename(columns=rename_map)
        shp_gdf.to_file(output_path, driver="ESRI Shapefile")
        logger.info("Shapefile saved: %s", output_path)
        return output_path

    def compute_statistics(
        self,
        gdf: gpd.GeoDataFrame,
        threshold_value: float,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Compute and save summary statistics for the flood polygons.

        Parameters
        ----------
        gdf : geopandas.GeoDataFrame
            Flood polygons with ``area_km2`` and ``perimeter_km`` columns.
        threshold_value : float
            The Otsu threshold used.
        output_path : str | None
            Destination JSON file.

        Returns
        -------
        dict
            Statistics dictionary (also saved to disk).
        """
        if output_path is None:
            output_path = self.config.get_output_path(
                self.config.export_statistics_filename
            )

        total_area_km2 = float(gdf["area_km2"].sum()) if not gdf.empty else 0.0
        total_perimeter_km = float(gdf["perimeter_km"].sum()) if not gdf.empty else 0.0
        num_polygons = len(gdf)

        stats: Dict[str, Any] = {
            "flood_detection_summary": {
                "total_flooded_area_km2": round(total_area_km2, 4),
                "total_perimeter_km": round(total_perimeter_km, 4),
                "number_of_flood_polygons": num_polygons,
                "otsu_threshold": round(threshold_value, 6),
                "change_method": self.config.change_method,
                "aoi_name": self.config.aoi_name,
                "before_window": f"{self.config.before_start} → {self.config.before_end}",
                "after_window": f"{self.config.after_start} → {self.config.after_end}",
            },
            "polygon_statistics": [],
        }

        if not gdf.empty:
            stats["polygon_statistics"] = [
                {
                    "id": idx,
                    "area_km2": round(row["area_km2"], 6),
                    "perimeter_km": round(row["perimeter_km"], 6),
                    "centroid_lon": round(row.geometry.centroid.x, 6),
                    "centroid_lat": round(row.geometry.centroid.y, 6),
                }
                for idx, row in gdf.iterrows()
            ]

            # Aggregate stats
            stats["flood_detection_summary"]["largest_polygon_km2"] = round(
                float(gdf["area_km2"].max()), 6
            )
            stats["flood_detection_summary"]["smallest_polygon_km2"] = round(
                float(gdf["area_km2"].min()), 6
            )
            stats["flood_detection_summary"]["mean_polygon_km2"] = round(
                float(gdf["area_km2"].mean()), 6
            )

        save_json(stats, output_path)
        logger.info("Statistics saved: %s", output_path)
        return stats
