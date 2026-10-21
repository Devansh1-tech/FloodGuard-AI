"""
pipeline.py — Master Settlement Impact Pipeline Orchestrator
============================================================

The single end-to-end entry point that coordinates all stages of the
SettlementImpactEngine, transforming flood extents into actionable disaster intelligence.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Any, Optional

import geopandas as gpd
import pandas as pd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.datasets.loader import DatasetLoader, ImpactDatasetBundle
from SettlementImpactEngine.analysis.admin_impact import AdministrativeImpactAnalyzer
from SettlementImpactEngine.analysis.settlement_impact import SettlementImpactAnalyzer
from SettlementImpactEngine.analysis.infrastructure_impact import InfrastructureImpactAnalyzer
from SettlementImpactEngine.analysis.risk_scorer import DisasterRiskScorer
from SettlementImpactEngine.network.road_impact import RoadImpactAnalyzer
from SettlementImpactEngine.network.connectivity import RoadConnectivityGraph
from SettlementImpactEngine.network.accessibility import AccessibilityAnalyzer
from SettlementImpactEngine.population.exposure import PopulationExposureAnalyzer
from SettlementImpactEngine.population.density import PopulationDensityAnalyzer
from SettlementImpactEngine.statistics.damage_summary import DamageSummaryEngine
from SettlementImpactEngine.statistics.aggregator import TabularAggregator
from SettlementImpactEngine.visualization.map_builder import CartographicMapBuilder
from SettlementImpactEngine.export.vector_exporter import VectorExporter
from SettlementImpactEngine.export.tabular_exporter import TabularExporter
from SettlementImpactEngine.export.report_exporter import ReportExporter
from SettlementImpactEngine.utils.geometry import calculate_precise_area_km2, dissolve_flood_footprint
from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


@dataclass
class ImpactPipelineResult:
    """
    Structured container holding all generated paths and disaster metrics.
    """
    total_flood_area_km2: float = 0.0
    affected_population: int = 0
    flooded_buildings_count: int = 0
    flooded_roads_km: float = 0.0
    flooded_facilities_count: int = 0
    affected_districts_count: int = 0
    affected_municipalities_count: int = 0
    isolated_settlements_count: int = 0

    # Exported Artifact Paths
    vector_paths: Dict[str, str] = field(default_factory=dict)
    table_paths: Dict[str, str] = field(default_factory=dict)
    report_paths: Dict[str, str] = field(default_factory=dict)
    map_paths: Dict[str, str] = field(default_factory=dict)

    # Core Telemetry Payloads
    damage_statistics: Dict[str, Any] = field(default_factory=dict)
    dashboard_data: Dict[str, Any] = field(default_factory=dict)
    impact_report: Dict[str, Any] = field(default_factory=dict)
    elapsed_seconds: float = 0.0


class SettlementImpactPipeline:
    """
    Master pipeline orchestrator for FloodGuard AI Stage 3.
    """

    def __init__(self, config: Optional[ImpactConfig] = None) -> None:
        self.config = config or ImpactConfig()
        self.dataset_loader = DatasetLoader(self.config)
        self.admin_analyzer = AdministrativeImpactAnalyzer(self.config)
        self.settlement_analyzer = SettlementImpactAnalyzer(self.config)
        self.road_analyzer = RoadImpactAnalyzer(self.config)
        self.connectivity_graph = RoadConnectivityGraph(self.config.projected_crs)
        self.accessibility_analyzer = AccessibilityAnalyzer(self.config.projected_crs)
        self.infra_analyzer = InfrastructureImpactAnalyzer(self.config)
        self.pop_analyzer = PopulationExposureAnalyzer(self.config)
        self.density_analyzer = PopulationDensityAnalyzer(self.config.projected_crs)
        self.risk_scorer = DisasterRiskScorer()
        self.summary_engine = DamageSummaryEngine(self.config)
        self.vector_exporter = VectorExporter(self.config)
        self.tabular_exporter = TabularExporter(self.config)
        self.report_exporter = ReportExporter(self.config)
        self.map_builder = CartographicMapBuilder(self.config)

    def run(self) -> ImpactPipelineResult:
        """
        Execute the end-to-end settlement impact assessment pipeline.

        Returns
        -------
        ImpactPipelineResult
            Complete results object containing artifact paths and statistics.
        """
        start_time = time.perf_counter()
        logger.info("=" * 70)
        logger.info("STARTING SETTLEMENT IMPACT ASSESSMENT PIPELINE (STAGE 3)")
        logger.info("Target AOI: %s | Output Dir: %s", self.config.aoi_name, self.config.output_dir)
        logger.info("=" * 70)

        result = ImpactPipelineResult()

        # ── 1. Load All Spatial Datasets ────────────────────────────────────
        bundle: ImpactDatasetBundle = self.dataset_loader.load_all()

        # Compute accurate total flood area
        dissolved_flood = dissolve_flood_footprint(bundle.flood_polygon)
        area_series = calculate_precise_area_km2(dissolved_flood, self.config.projected_crs)
        total_flood_area_km2 = float(area_series.sum()) if not area_series.empty else 0.0
        result.total_flood_area_km2 = round(total_flood_area_km2, 2)
        logger.info("Total active flood footprint: %.2f km².", result.total_flood_area_km2)

        # ── 2. Administrative Boundary Assessment ───────────────────────────
        affected_munis_gdf, affected_districts_gdf, admin_summary = self.admin_analyzer.analyze(
            admin_gdf=bundle.admin_boundaries,
            flood_gdf=dissolved_flood,
        )
        result.affected_districts_count = admin_summary.get("total_districts_affected", 0)
        result.affected_municipalities_count = admin_summary.get("total_municipalities_affected", 0)

        # ── 3. Settlement & Building Inundation Assessment ───────────────────
        affected_settlements_gdf, affected_buildings_gdf, settlement_summary = self.settlement_analyzer.analyze(
            settlements_gdf=bundle.settlements,
            buildings_gdf=bundle.buildings,
            flood_gdf=dissolved_flood,
        )
        bld_stats = settlement_summary.get("building_damage_summary", {})
        result.flooded_buildings_count = bld_stats.get("total_buildings_flooded", 0)

        # ── 4. Transportation Impact Assessment ─────────────────────────────
        affected_roads_gdf, transport_summary = self.road_analyzer.analyze(
            roads_gdf=bundle.roads,
            flood_gdf=dissolved_flood,
        )
        result.flooded_roads_km = transport_summary.get("total_flooded_length_km", 0.0)

        # ── 5. Network Connectivity & Graph Severance ───────────────────────
        network_summary = {}
        if self.config.enable_network_analysis:
            network_summary = self.connectivity_graph.evaluate_flood_severance(
                baseline_roads_gdf=bundle.roads,
                flood_gdf=dissolved_flood,
            )

        # ── 6. Critical Infrastructure Assessment & Routing ─────────────────
        infra_category_layers, infra_summary = self.infra_analyzer.analyze(
            infrastructure_gdf=bundle.infrastructure,
            flood_gdf=dissolved_flood,
        )
        result.flooded_facilities_count = infra_summary.get("total_facilities_flooded", 0)

        # ── 7. Settlement Isolation & Emergency Accessibility ───────────────
        accessibility_summary = {}
        if self.config.enable_network_analysis and not bundle.infrastructure.empty:
            operational_hubs = bundle.infrastructure
            accessibility_summary = self.accessibility_analyzer.evaluate_settlement_isolation(
                settlements_gdf=bundle.settlements,
                roads_gdf=bundle.roads,
                emergency_facilities_gdf=operational_hubs,
                flood_gdf=dissolved_flood,
            )
            result.isolated_settlements_count = accessibility_summary.get("isolated_settlements_count", 0)

        # ── 8. Population Exposure Modeling ─────────────────────────────────
        population_summary = self.pop_analyzer.analyze(
            population_grid_gdf=bundle.population_grid,
            flood_gdf=dissolved_flood,
            admin_gdf=bundle.admin_boundaries,
            raster_path=bundle.population_raster_path,
        )
        result.affected_population = population_summary.get("total_affected_population", 0)

        # ── 9. Multi-Criteria Disaster Risk Scoring ─────────────────────────
        pop_breakdown = population_summary.get("population_by_municipality", {})
        risk_rankings = self.risk_scorer.compute_municipality_risk_scores(
            municipalities_summary=admin_summary.get("affected_municipalities", []),
            pop_breakdown=pop_breakdown,
        )

        # ── 10. Assemble Consolidated Statistics & Reports ──────────────────
        damage_stats = self.summary_engine.compile_damage_statistics(
            total_flood_area_km2=result.total_flood_area_km2,
            admin_summary=admin_summary,
            settlement_summary=settlement_summary,
            transport_summary=transport_summary,
            network_summary={**network_summary, **accessibility_summary},
            infrastructure_summary=infra_summary,
            population_summary=population_summary,
            risk_rankings=risk_rankings,
        )
        dashboard_data = self.summary_engine.compile_dashboard_data(damage_stats)
        impact_report = self.summary_engine.compile_humanitarian_impact_report(damage_stats)

        result.damage_statistics = damage_stats
        result.dashboard_data = dashboard_data
        result.impact_report = impact_report

        # ── 11. Export Vector Artifacts ─────────────────────────────────────
        with LogTimer("Exporting Vector Layers (GeoJSON & GeoPackage)", logger):
            result.vector_paths = self.vector_exporter.export_all_layers(
                districts_gdf=affected_districts_gdf,
                municipalities_gdf=affected_munis_gdf,
                villages_gdf=affected_settlements_gdf,
                buildings_gdf=affected_buildings_gdf,
                roads_gdf=affected_roads_gdf,
                infra_categories=infra_category_layers,
            )

        # ── 12. Export Tabular Summaries (CSV) ───────────────────────────────
        with LogTimer("Exporting Tabular Artifacts (CSV)", logger):
            infra_table = TabularAggregator.build_infrastructure_table(infra_summary)
            result.table_paths["infrastructure_csv"] = self.tabular_exporter.export_infrastructure_summary(
                infra_table, "InfrastructureSummary.csv"
            )
            muni_table = TabularAggregator.build_municipality_table(risk_rankings)
            result.table_paths["municipality_csv"] = self.tabular_exporter.export_dataframe(
                muni_table, "MunicipalityImpactSummary.csv"
            )
            # Export AffectedSettlements_Report.csv (Problem Statement 01 requirement)
            settlement_records = settlement_summary.get("affected_settlements", [])
            if settlement_records:
                settle_df = pd.DataFrame(settlement_records)
                result.table_paths["settlement_report_csv"] = self.tabular_exporter.export_dataframe(
                    settle_df, "AffectedSettlements_Report.csv"
                )

        # ── 13. Export JSON Reports ─────────────────────────────────────────
        with LogTimer("Exporting JSON Reports", logger):
            result.report_paths = self.report_exporter.export_all_reports(
                damage_statistics=damage_stats,
                dashboard_data=dashboard_data,
                impact_report=impact_report,
                population_report=population_summary,
                settlement_report=settlement_summary,
            )

        # ── 14. Render Cartographic Visualization Maps ──────────────────────
        if self.config.generate_visualizations:
            result.map_paths = self.map_builder.render_all_maps(
                flood_gdf=dissolved_flood,
                admin_gdf=bundle.admin_boundaries,
                roads_gdf=bundle.roads,
                flooded_roads_gdf=affected_roads_gdf,
                infra_gdf=infra_category_layers.get("all", bundle.infrastructure),
                population_gdf=bundle.population_grid,
            )

        result.elapsed_seconds = round(time.perf_counter() - start_time, 2)
        logger.info("=" * 70)
        logger.info("SETTLEMENT IMPACT PIPELINE COMPLETED IN %.2f s", result.elapsed_seconds)
        logger.info(
            "Impact Summary: %.1f km² flooded | %d people affected | %d buildings flooded | "
            "%.1f km roads submerged | %d facilities flooded | %d isolated settlements",
            result.total_flood_area_km2,
            result.affected_population,
            result.flooded_buildings_count,
            result.flooded_roads_km,
            result.flooded_facilities_count,
            result.isolated_settlements_count,
        )
        logger.info("=" * 70)

        return result
