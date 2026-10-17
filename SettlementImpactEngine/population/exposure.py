"""
exposure.py — Population Exposure & Demographic Vulnerability Modeling
======================================================================

Module 5 of Stage 3: Models human flood exposure, vulnerable sub-demographics
(children, elderly, displaced households), and spatial breakdowns.
"""

from __future__ import annotations

from typing import Dict, Any, Optional
import geopandas as gpd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.overlay.zonal import ZonalStatisticsEngine
from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class PopulationExposureAnalyzer:
    """
    Quantifies exposed populations and models vulnerable demographics.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config
        self.zonal_engine = ZonalStatisticsEngine(config.projected_crs)

    def analyze(
        self,
        population_grid_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
        admin_gdf: Optional[gpd.GeoDataFrame] = None,
        raster_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute population exposure modeling.

        Parameters
        ----------
        population_grid_gdf : gpd.GeoDataFrame
            Gridded population polygon surface.
        flood_gdf : gpd.GeoDataFrame
            Flood footprint vector.
        admin_gdf : gpd.GeoDataFrame | None
            Administrative boundaries for territorial attribution.
        raster_path : str | None
            Optional WorldPop GeoTIFF path.

        Returns
        -------
        dict
            Human exposure report matching humanitarian standards (OCHA / NDRRMA).
        """
        with LogTimer("Human Population Exposure Modeling", logger):
            # Compute vector proportional exposure
            vector_stats = self.zonal_engine.compute_vector_population_exposure(
                pop_grid_gdf=population_grid_gdf,
                flood_gdf=flood_gdf,
                admin_gdf=admin_gdf,
            )

            total_affected = vector_stats.get("total_exposed_population", 0)
            baseline_pop = vector_stats.get("total_baseline_population", 1)
            exposure_pct = vector_stats.get("exposure_percentage", 0.0)
            admin_breakdown = vector_stats.get("admin_breakdown", {})

            # Demographic vulnerabilities based on Nepal Census averages
            # Average household size in Nepal Terai ~ 4.6 persons
            avg_hh_size = 4.6
            displaced_hh = int(round(total_affected / avg_hh_size))
            children_under_5 = int(round(total_affected * 0.115))  # ~11.5%
            elderly_65_plus = int(round(total_affected * 0.070))   # ~7.0%
            female_population = int(round(total_affected * 0.515)) # ~51.5%

            report = {
                "total_affected_population": total_affected,
                "total_baseline_population": baseline_pop,
                "exposure_percentage": exposure_pct,
                "demographic_vulnerability": {
                    "estimated_displaced_households": displaced_hh,
                    "children_under_5": children_under_5,
                    "elderly_65_plus": elderly_65_plus,
                    "female_population": female_population,
                    "average_household_size": avg_hh_size,
                },
                "population_by_municipality": admin_breakdown,
                "humanitarian_needs_index": "HIGH" if total_affected > 20000 else ("MODERATE" if total_affected > 5000 else "LOW"),
            }

            logger.info(
                "Population exposure complete: %d persons exposed (est. %d households displaced, %d children under 5).",
                total_affected,
                displaced_hh,
                children_under_5,
            )

            return report
