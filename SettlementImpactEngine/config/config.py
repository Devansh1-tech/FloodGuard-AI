"""
config.py — Centralized Settlement Impact Configuration
=======================================================

Single source of truth for the SettlementImpactEngine. Manages input/output paths,
geospatial projections, analysis thresholds, critical infrastructure classifications,
and export parameters.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class ImpactConfig:
    """
    Master configuration dataclass for the Settlement Impact Assessment Engine.

    Parameters
    ----------
    flood_polygon_path : str
        Path to the primary input flood polygon vector (GeoJSON or SHP).
    flood_mask_path : str | None
        Path to the binary or continuous flood raster GeoTIFF.
    output_dir : str
        Directory where all impact assessment outputs will be exported.
    aoi_name : str
        Target study area (e.g. ``"nepal_terai_koshi"``, ``"nepal_terai_chitwan"``).
    projected_crs : str
        Metric planar coordinate system for surface area & length calculations (UTM 45N).
    geographic_crs : str
        Standard geographic coordinate reference system (WGS 84).
    infrastructure_buffer_meters : float
        Proximity buffer for identifying infrastructure at risk of flood encroachment.
    generate_visualizations : bool
        Whether to generate publication-grade cartographic maps.
    enable_network_analysis : bool
        Whether to build and evaluate the road connectivity graph using NetworkX.
    """

    # ── Input Data Paths ──────────────────────────────────────────────────
    flood_polygon_path: Optional[str] = None
    flood_mask_path: Optional[str] = None
    detection_statistics_path: Optional[str] = None

    admin_boundaries_path: Optional[str] = None
    roads_path: Optional[str] = None
    buildings_path: Optional[str] = None
    infrastructure_path: Optional[str] = None
    population_raster_path: Optional[str] = None

    # ── Study Area & Projections ──────────────────────────────────────────
    aoi_name: str = "nepal_terai_koshi"
    projected_crs: str = "EPSG:32645"  # UTM Zone 45N (Nepal)
    geographic_crs: str = "EPSG:4326"   # WGS 84

    # ── Output Directory ──────────────────────────────────────────────────
    output_dir: str = "outputs"

    # ── Impact Assessment Parameters ──────────────────────────────────────
    infrastructure_buffer_meters: float = 250.0  # High-risk encroachment zone
    building_buffer_meters: float = 30.0
    settlement_density_radius_km: float = 2.0
    disconnected_cluster_min_nodes: int = 2

    # ── Feature Categorization ────────────────────────────────────────────
    road_classes: List[str] = field(
        default_factory=lambda: [
            "highway",
            "trunk",
            "primary",
            "secondary",
            "tertiary",
            "residential",
            "unclassified",
            "bridge",
        ]
    )

    facility_categories: Dict[str, List[str]] = field(
        default_factory=lambda: {
            "health": ["hospital", "clinic", "health_post", "pharmacy", "medical_center"],
            "education": ["school", "college", "university", "kindergarten"],
            "security": ["police", "fire_station", "army_post", "apf_post"],
            "governance": ["municipality_office", "ward_office", "post_office", "court"],
            "shelter": ["emergency_shelter", "community_hall", "stadium"],
        }
    )

    # ── Execution Flags ───────────────────────────────────────────────────
    generate_visualizations: bool = True
    enable_network_analysis: bool = True
    enable_population_zonal: bool = True
    export_geopackage: bool = True
    export_shapefile: bool = True
    export_geojson: bool = True

    def __post_init__(self) -> None:
        """Resolve dynamic default paths if not explicitly supplied."""
        # Auto-detect flood polygon from standard Stage 2 output locations
        if not self.flood_polygon_path:
            candidates = [
                "outputs/FloodPolygon.geojson",
                "ValidationApp/outputs/Validation_FloodPolygon.geojson",
                "FloodDetectionEngine/outputs/FloodPolygon.geojson",
                "outputs/flood_maps/FloodPolygon.geojson",
            ]
            for candidate in candidates:
                if os.path.exists(candidate):
                    self.flood_polygon_path = candidate
                    break
            if not self.flood_polygon_path:
                self.flood_polygon_path = "outputs/FloodPolygon.geojson"

        if not self.detection_statistics_path:
            candidates = [
                "outputs/statistics.json",
                "ValidationApp/outputs/Validation_statistics.json",
                "FloodDetectionEngine/outputs/statistics.json",
            ]
            for candidate in candidates:
                if os.path.exists(candidate):
                    self.detection_statistics_path = candidate
                    break

        # Ensure output directory path exists
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)

    def get_output_path(self, filename: str) -> str:
        """Helper to get a full path inside the configured output directory."""
        return str(Path(self.output_dir) / filename)
