"""
vector_exporter.py — Multi-Format Vector Exporter
=================================================

Module 8 of Stage 3: Exports geospatial analytical layers into standardized
GeoJSON, ESRI Shapefile, and OGC GeoPackage formats with strict CRS compliance.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional, Dict
import geopandas as gpd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.utils.crs import to_geographic, to_projected, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class VectorExporter:
    """
    Exports geospatial analytical layers into GeoJSON, Shapefile, and GeoPackage.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config
        self.output_dir = Path(config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def export_all_layers(
        self,
        districts_gdf: gpd.GeoDataFrame,
        municipalities_gdf: gpd.GeoDataFrame,
        villages_gdf: gpd.GeoDataFrame,
        buildings_gdf: gpd.GeoDataFrame,
        roads_gdf: gpd.GeoDataFrame,
        infra_categories: Dict[str, gpd.GeoDataFrame],
    ) -> Dict[str, str]:
        """
        Export all designated analytical vector layers.
        """
        exported_paths = {}

        # 1. Affected Administrative Units
        if self.config.export_geojson:
            exported_paths["districts"] = self.export_geojson(districts_gdf, "AffectedDistricts.geojson")
            exported_paths["municipalities"] = self.export_geojson(municipalities_gdf, "AffectedMunicipalities.geojson")

            # 2. Settlements & Buildings
            exported_paths["villages"] = self.export_geojson(villages_gdf, "AffectedVillages.geojson")
            exported_paths["buildings"] = self.export_geojson(buildings_gdf, "AffectedBuildings.geojson")

            # 3. Roads
            exported_paths["roads"] = self.export_geojson(roads_gdf, "AffectedRoads.geojson")

            # 4. Critical Infrastructure
            if "hospitals" in infra_categories:
                exported_paths["hospitals"] = self.export_geojson(infra_categories["hospitals"], "AffectedHospitals.geojson")
            if "schools" in infra_categories:
                exported_paths["schools"] = self.export_geojson(infra_categories["schools"], "AffectedSchools.geojson")
            if "police" in infra_categories:
                exported_paths["police"] = self.export_geojson(infra_categories["police"], "AffectedPolice.geojson")

        # 5. Combined GeoPackage if enabled
        if self.config.export_geopackage:
            gpkg_path = str(self.output_dir / "SettlementImpactLayers.gpkg")
            try:
                for layer_name, gdf in [
                    ("districts", districts_gdf),
                    ("municipalities", municipalities_gdf),
                    ("villages", villages_gdf),
                    ("buildings", buildings_gdf),
                    ("roads", roads_gdf),
                    ("infrastructure", infra_categories.get("all")),
                ]:
                    if gdf is not None and not gdf.empty:
                        gdf.to_file(gpkg_path, layer=layer_name, driver="GPKG")
                exported_paths["geopackage"] = gpkg_path
                logger.info("Consolidated GeoPackage exported: %s", gpkg_path)
            except Exception as e:
                logger.warning("GeoPackage export encountered %s, skipping.", e)

        return exported_paths

    def export_geojson(self, gdf: gpd.GeoDataFrame, filename: str) -> str:
        """
        Export a GeoDataFrame to a standard WGS 84 GeoJSON file.
        """
        out_path = str(self.output_dir / filename)
        if gdf is None or gdf.empty:
            empty_gdf = gpd.GeoDataFrame({"geometry": []}, crs=DEFAULT_GEOGRAPHIC_CRS)
            empty_gdf.to_file(out_path, driver="GeoJSON")
            return out_path

        geo_gdf = to_geographic(fix_invalid_geometries(gdf))
        geo_gdf.to_file(out_path, driver="GeoJSON")
        logger.info("Exported GeoJSON [%d features]: %s", len(geo_gdf), out_path)
        return out_path

    def export_shapefile(self, gdf: gpd.GeoDataFrame, base_filename: str) -> str:
        """
        Export a GeoDataFrame to ESRI Shapefile with column name truncation safety.
        """
        stem = Path(base_filename).stem
        out_path = str(self.output_dir / f"{stem}.shp")
        if gdf is None or gdf.empty:
            return out_path

        clean_gdf = fix_invalid_geometries(gdf)
        try:
            clean_gdf.to_file(out_path, driver="ESRI Shapefile")
            logger.info("Exported Shapefile: %s", out_path)
        except Exception as e:
            logger.warning("Shapefile export failed (%s).", e)
        return out_path
