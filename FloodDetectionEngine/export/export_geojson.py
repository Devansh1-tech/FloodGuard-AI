"""
export_geojson.py — GeoJSON / FeatureCollection Export
========================================================

Handles exporting ``ee.FeatureCollection`` objects to GeoJSON files,
both via Earth Engine Drive export tasks and direct-to-local download.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional

import ee

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.helper import ensure_directory
from FloodDetectionEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class GeoJSONExporter:
    """
    Export ``ee.FeatureCollection`` to GeoJSON.

    Parameters
    ----------
    config : EngineConfig
        Engine configuration.
    """

    def __init__(self, config: EngineConfig) -> None:
        self.config = config

    def export_to_drive(
        self,
        fc: ee.FeatureCollection,
        description: str,
        folder: Optional[str] = None,
    ) -> ee.batch.Task:
        """
        Submit a table export task to Google Drive as GeoJSON.

        Parameters
        ----------
        fc : ee.FeatureCollection
            Feature collection to export.
        description : str
            Task description / filename stem.
        folder : str | None
            Drive folder.

        Returns
        -------
        ee.batch.Task
            The started export task.
        """
        folder = folder or self.config.gee_drive_folder

        with LogTimer(f"Export FC to Drive: {description}", logger):
            task = ee.batch.Export.table.toDrive(
                collection=fc,
                description=description,
                folder=folder,
                fileFormat="GeoJSON",
            )
            task.start()
            logger.info(
                "Table export task started: '%s' → Drive/%s.",
                description,
                folder,
            )
            return task

    def download_fc(
        self,
        fc: ee.FeatureCollection,
        output_path: Optional[str] = None,
    ) -> str:
        """
        Download an ``ee.FeatureCollection`` directly to a local
        GeoJSON file.

        This calls ``.getInfo()`` which serialises the entire collection
        client-side.  Suitable for collections with up to ~5 000 features.

        Parameters
        ----------
        fc : ee.FeatureCollection
            Feature collection to download.
        output_path : str | None
            Destination file path.

        Returns
        -------
        str
            Path to the saved GeoJSON.
        """
        if output_path is None:
            output_path = self.config.get_output_path(
                self.config.export_flood_polygon_geojson
            )

        with LogTimer(f"Download FC → {output_path}", logger):
            geojson_dict = fc.getInfo()

            # Wrap in a FeatureCollection if needed
            if geojson_dict.get("type") != "FeatureCollection":
                geojson_dict = {
                    "type": "FeatureCollection",
                    "features": geojson_dict.get("features", []),
                }

            ensure_directory(os.path.dirname(output_path) if os.path.dirname(output_path) else ".")
            with open(output_path, "w", encoding="utf-8") as fh:
                json.dump(geojson_dict, fh, indent=2)

            num_features = len(geojson_dict.get("features", []))
            logger.info(
                "GeoJSON downloaded: %s (%d features).",
                output_path,
                num_features,
            )
            return output_path
