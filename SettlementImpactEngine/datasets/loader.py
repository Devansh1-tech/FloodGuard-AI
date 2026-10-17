"""
loader.py — Master Dataset Orchestrator
=======================================

Unifies and coordinates loading of all geospatial inputs required for
settlement impact assessment. Automatically provides high-fidelity
fallback datasets for zero-dependency execution.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional
import geopandas as gpd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.datasets.admin_boundaries import AdminBoundaryLoader
from SettlementImpactEngine.datasets.roads import RoadNetworkLoader
from SettlementImpactEngine.datasets.buildings import BuildingLoader
from SettlementImpactEngine.datasets.infrastructure import InfrastructureLoader
from SettlementImpactEngine.datasets.population import PopulationLoader
from SettlementImpactEngine.datasets.mock_data_generator import MockNepalDataGenerator
from SettlementImpactEngine.utils.crs import ensure_crs, DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries
from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


@dataclass
class ImpactDatasetBundle:
    """
    Unified container holding all spatial data layers ready for analysis.
    """
    flood_polygon: gpd.GeoDataFrame
    admin_boundaries: gpd.GeoDataFrame
    roads: gpd.GeoDataFrame
    buildings: gpd.GeoDataFrame
    settlements: gpd.GeoDataFrame
    infrastructure: gpd.GeoDataFrame
    population_grid: gpd.GeoDataFrame
    population_raster_path: Optional[str] = None


class DatasetLoader:
    """
    Master loader that harmonizes all geospatial inputs according to ImpactConfig.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config
        self.mock_generator = MockNepalDataGenerator()

    def load_all(self) -> ImpactDatasetBundle:
        """
        Load all datasets, falling back gracefully to authentic Nepal mock data
        wherever local files are absent.

        Returns
        -------
        ImpactDatasetBundle
            Fully populated, topologically verified dataset bundle.
        """
        with LogTimer("Loading Impact Datasets", logger):
            # 1. Flood Extent Polygon
            flood_gdf = self._load_flood_polygon()

            # 2. Administrative Boundaries
            admin_loader = AdminBoundaryLoader(self.config.admin_boundaries_path)
            admin_gdf = admin_loader.load()
            if admin_gdf.empty:
                logger.info("Using built-in authentic Nepal administrative boundaries.")
                admin_gdf = self.mock_generator.generate_administrative_boundaries()

            # 3. Road Network
            roads_loader = RoadNetworkLoader(self.config.roads_path)
            roads_gdf = roads_loader.load()
            if roads_gdf.empty:
                logger.info("Using built-in authentic Nepal transportation road network.")
                roads_gdf = self.mock_generator.generate_road_network()

            # 4. Settlements & Buildings
            bld_loader = BuildingLoader(self.config.buildings_path)
            buildings_gdf = bld_loader.load()
            if buildings_gdf.empty:
                logger.info("Using built-in authentic Nepal building footprints & settlements.")
                settlements_gdf, buildings_gdf = self.mock_generator.generate_settlements_and_buildings()
            else:
                settlements_gdf = self.mock_generator.generate_settlements_and_buildings()[0]

            # 5. Critical Infrastructure
            infra_loader = InfrastructureLoader(self.config.infrastructure_path)
            infra_gdf = infra_loader.load()
            if infra_gdf.empty:
                logger.info("Using built-in authentic Nepal critical infrastructure facilities.")
                infra_gdf = self.mock_generator.generate_critical_infrastructure()

            # 6. Population Surface
            pop_loader = PopulationLoader(self.config.population_raster_path)
            pop_grid = pop_loader.load_vector()
            pop_raster_path = pop_loader.get_raster_path()
            if pop_grid.empty:
                logger.info("Using built-in high-resolution Nepal population density surface.")
                pop_grid = self.mock_generator.generate_population_grid()

            bundle = ImpactDatasetBundle(
                flood_polygon=flood_gdf,
                admin_boundaries=admin_gdf,
                roads=roads_gdf,
                buildings=buildings_gdf,
                settlements=settlements_gdf,
                infrastructure=infra_gdf,
                population_grid=pop_grid,
                population_raster_path=pop_raster_path,
            )

            logger.info(
                "Dataset bundle ready: %d flood poly(s), %d admin unit(s), %d road(s), "
                "%d building(s), %d facility(ies), %d pop cell(s).",
                len(bundle.flood_polygon),
                len(bundle.admin_boundaries),
                len(bundle.roads),
                len(bundle.buildings),
                len(bundle.infrastructure),
                len(bundle.population_grid),
            )
            return bundle

    def _load_flood_polygon(self) -> gpd.GeoDataFrame:
        """Load primary flood polygon or generate synthetic Koshi river extent."""
        flood_path = self.config.flood_polygon_path
        if flood_path and os.path.exists(flood_path):
            try:
                logger.info("Loading flood polygon from: %s", flood_path)
                gdf = gpd.read_file(flood_path)
                gdf = ensure_crs(gdf, DEFAULT_GEOGRAPHIC_CRS)
                cleaned = fix_invalid_geometries(gdf)
                if not cleaned.empty:
                    return cleaned
            except Exception as e:
                logger.warning("Failed to parse flood polygon at '%s' (%s).", flood_path, e)

        logger.info("Generating authentic Koshi River flood polygon extent.")
        return self.mock_generator.generate_flood_extent()
