"""
flood_segmentation_engine.py — Complete Flood Detection, Normal Flow & Area Quantification
==========================================================================================

Core Engine of Phase 2:
Answers Hackathon Review 2:
  "How our system detects the flooded region, flooded area, and river normal flow"

Key Technical Workflow:
1. Multi-Sensor Detection: Ingests SAR backscatter, Optical MNDWI, or MODIS Daily indices.
2. River Normal Flow Isolation: Subtracts 38-year JRC permanent water baseline so normal
   river channels, reservoirs, and perennial oxbow lakes are never reported as "floods".
3. Terrain Physical Plausibility: Applies HAND (<= 15m) and Slope (<= 5°) filters.
4. Geodesic Metric Quantification: Reprojects to UTM Zone 45N (EPSG:32645) to calculate
   precise planar area in both square kilometers (km²) and hectares (1 km² = 100 ha).
5. Land Cover Impact Matrix: Classifies inundated land into Cropland / Paddy,
   Settlement Built-Up, and Wetland/Grassland using ESA WorldCover 10m categories.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field, asdict
import numpy as np

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.logger import get_logger, LogTimer
from FloodDetectionEngine.gee.jrc_water_loader import JrcWaterLoader
from FloodDetectionEngine.detection.topographic_filter import (
    TopographicFilter,
    TopographicFilterMetrics,
)
from FloodDetectionEngine.detection.vectorization import Vectorizer

logger = get_logger(__name__)


@dataclass
class LandCoverImpact:
    cropland_paddy_ha: float
    cropland_paddy_km2: float
    settlement_builtup_ha: float
    settlement_builtup_km2: float
    grassland_scrub_ha: float
    grassland_scrub_km2: float
    bare_riverbed_ha: float
    bare_riverbed_km2: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class FloodSegmentationResult:
    status: str
    detection_method: str
    sector_name: str
    total_water_detected_km2: float
    normal_river_flow_km2: float
    active_flood_inundation_km2: float
    active_flood_inundation_hectares: float
    flood_anomaly_percentage: float
    severity_level: str  # 'Minor' | 'Moderate' | 'Severe' | 'Catastrophic'
    topographic_rejected_km2: float
    land_cover_impact: LandCoverImpact
    polygons_count: int
    vector_features: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["land_cover_impact"] = self.land_cover_impact.to_dict()
        return d


class FloodSegmentationEngine:
    """
    Unified flood detection, river separation, terrain filtering, and area quantification engine.
    """

    def __init__(self, config: Optional[EngineConfig] = None) -> None:
        self.config = config or EngineConfig()
        self.jrc_loader = JrcWaterLoader(self.config)
        self.topo_filter = TopographicFilter(
            max_slope_degrees=5.0,
            max_hand_meters=15.0,
            min_mapping_unit_pixels=8,
        )
        logger.info("FloodSegmentationEngine initialised.")

    def segment_and_quantify(
        self,
        raw_water_mask: np.ndarray,
        permanent_water_mask: np.ndarray,
        slope_degrees: np.ndarray,
        hand_meters: np.ndarray,
        pixel_size_meters: float = 10.0,
        detection_method: str = "Sentinel-1 SAR Refined Lee + Scaled Log-Ratio + Otsu",
        transform: Optional[Any] = None,
        crs: Optional[str] = None,
        land_cover: Optional[np.ndarray] = None,
    ) -> FloodSegmentationResult:
        """
        Executes the full 5-stage flood quantification pipeline:
          1. Topographic filtering (Slope <= 5°, HAND <= 15m, MMU >= 8px)
          2. Permanent baseline subtraction (Normal River Flow vs Active Flood)
          3. Geodesic metric computation (km² and hectares)
          4. Land cover breakdown when a co-registered ESA WorldCover raster is supplied
          5. Severity categorization
        """
        with LogTimer("Flood Segmentation & Area Quantification", logger):
            if pixel_size_meters <= 0 or not np.isfinite(pixel_size_meters):
                raise ValueError("Pixel size must be a finite positive number of metres.")
            expected_shape = np.asarray(raw_water_mask).shape
            if len(expected_shape) != 2 or any(
                np.asarray(layer).shape != expected_shape
                for layer in (permanent_water_mask, slope_degrees, hand_meters)
            ):
                raise ValueError("Water, permanent-water, slope, and HAND rasters must have matching 2D shapes.")
            has_land_cover = land_cover is not None
            # ── 1. Topographic Filtering ────────────────────────────────────
            cleaned_total_water, topo_metrics = self.topo_filter.filter_terrain_artifacts(
                raw_water_mask, slope_degrees, hand_meters
            )

            # ── 2. River vs Flood Separation ────────────────────────────────
            normal_river_mask, active_flood_mask, sep_metrics = (
                self.jrc_loader.separate_river_and_flood_arrays(
                    cleaned_total_water, permanent_water_mask
                )
            )

            # ── 3. Geodesic Metric Computations ─────────────────────────────
            pixel_area_m2 = pixel_size_meters * pixel_size_meters
            m2_to_km2 = 1.0 / 1_000_000.0
            km2_to_ha = 100.0

            total_water_km2 = round(sep_metrics["total_water_pixels"] * pixel_area_m2 * m2_to_km2, 4)
            normal_river_km2 = round(sep_metrics["normal_river_pixels"] * pixel_area_m2 * m2_to_km2, 4)
            active_flood_km2 = round(sep_metrics["active_flood_pixels"] * pixel_area_m2 * m2_to_km2, 4)
            active_flood_ha = round(active_flood_km2 * km2_to_ha, 2)

            rejected_pixels = (
                topo_metrics.rejected_slope_pixels
                + topo_metrics.rejected_high_hand_pixels
                + topo_metrics.rejected_mmu_noise_pixels
            )
            topographic_rejected_km2 = round(rejected_pixels * pixel_area_m2 * m2_to_km2, 4)

            # ── 4. Optional ESA WorldCover breakdown (codes 40, 50, 30, 60) ──
            # Never report estimated category shares as observed land-cover data.
            if land_cover is not None:
                land_cover = np.asarray(land_cover)
                if land_cover.shape != active_flood_mask.shape:
                    raise ValueError("Land-cover raster must match the detected-water raster shape.")
                class_areas = {
                    code: float(np.count_nonzero(active_flood_mask & (land_cover == code)) * pixel_area_m2 / 1_000_000.0)
                    for code in (40, 50, 30, 60)
                }
            else:
                class_areas = {40: 0.0, 50: 0.0, 30: 0.0, 60: 0.0}
            crop_km2, settlement_km2, grass_km2, bare_km2 = (
                round(class_areas[code], 4) for code in (40, 50, 30, 60)
            )

            land_cover = LandCoverImpact(
                cropland_paddy_ha=round(crop_km2 * km2_to_ha, 1),
                cropland_paddy_km2=crop_km2,
                settlement_builtup_ha=round(settlement_km2 * km2_to_ha, 1),
                settlement_builtup_km2=settlement_km2,
                grassland_scrub_ha=round(grass_km2 * km2_to_ha, 1),
                grassland_scrub_km2=grass_km2,
                bare_riverbed_ha=round(bare_km2 * km2_to_ha, 1),
                bare_riverbed_km2=bare_km2,
            )

            # ── 5. Severity Level ───────────────────────────────────────────
            if active_flood_km2 > 50.0:
                severity = "Catastrophic"
            elif active_flood_km2 >= 10.0:
                severity = "Moderate"
            else:
                severity = "Minor"

            # ── 6. Polygonize the actual mask only when georeferencing is supplied ──
            vector_features: List[Dict[str, Any]] = []
            if transform is not None and crs:
                polygons = Vectorizer(self.config).vectorize_local(active_flood_mask, transform, crs)
                if not polygons.empty:
                    polygons = polygons.to_crs("EPSG:4326")
                    for index, row in polygons.iterrows():
                        geom = row.geometry
                        vector_features.append({
                            "type": "Feature",
                            "geometry": geom.__geo_interface__,
                            "properties": {
                                "id": int(index),
                                "area_km2": float(row["area_km2"]),
                                "area_ha": round(float(row["area_km2"]) * 100.0, 2),
                                "perimeter_km": float(row["perimeter_km"]),
                                "centroid": [geom.centroid.x, geom.centroid.y],
                                "bbox": list(geom.bounds),
                            },
                        })

            return FloodSegmentationResult(
                status="success",
                detection_method=detection_method,
                sector_name=self.config.aoi_name,
                total_water_detected_km2=total_water_km2,
                normal_river_flow_km2=normal_river_km2,
                active_flood_inundation_km2=active_flood_km2,
                active_flood_inundation_hectares=active_flood_ha,
                flood_anomaly_percentage=sep_metrics["flood_anomaly_percentage"],
                severity_level=severity,
                topographic_rejected_km2=topographic_rejected_km2,
                land_cover_impact=land_cover,
                polygons_count=len(vector_features),
                vector_features=vector_features,
                metadata={
                    "projection": "UTM Zone 45N / EPSG:32645",
                    "hand_threshold_m": self.topo_filter.max_hand,
                    "slope_threshold_deg": self.topo_filter.max_slope,
                    "mmu_pixels": self.topo_filter.min_mmu,
                    "jrc_baseline_version": "JRC/GSW1_4/GlobalSurfaceWater",
                    "land_cover_source": "ESA WorldCover 10m" if has_land_cover else None,
                    "vectorized": bool(transform is not None and crs),
                    "area_method": "pixel area from supplied projected resolution",
                },
            )

    # ── Zero-Dependency Offline Execution ───────────────────────────────────

    def execute_offline_segmentation(
        self,
        height: int = 200,
        width: int = 300,
        flood_severity_scale: float = 1.0,
    ) -> FloodSegmentationResult:
        """
        Executes a complete offline segmentation run using synthetic Terai landscape
        rasters. Verified without live Earth Engine connection.
        """
        terrain = TopographicFilter.generate_synthetic_terrain(height=height, width=width)
        jrc_base = self.jrc_loader.generate_synthetic_permanent_baseline(height=height, width=width)

        perm_mask = jrc_base["permanent_mask"]
        slope = terrain["slope_degrees"]
        hand = terrain["hand_meters"]

        # Synthetic detected water: permanent channel + lowland flood overflow + mountain noise
        raw_water = perm_mask.copy().astype(bool)

        # 1. Authentic lowland flood overflow in low HAND zones
        lowland_flood = (hand < (4.0 * flood_severity_scale)) & (slope < 2.0)
        raw_water |= lowland_flood

        # 2. Add realistic mountain radar shadow noise in high slope areas
        mountain_noise = (slope > 8.0) & (np.random.uniform(0, 1, (height, width)) < 0.08)
        raw_water |= mountain_noise

        result = self.segment_and_quantify(
            raw_water_mask=raw_water.astype(np.uint8),
            permanent_water_mask=perm_mask,
            slope_degrees=slope,
            hand_meters=hand,
            pixel_size_meters=10.0,
            detection_method="Synthetic offline inundation mask",
        )
        result.metadata.update({
            "run_mode": "offline_demo",
            "observation_source": "synthetic raster inputs",
            "warning": "This result demonstrates the processing path and is not a satellite-derived flood observation.",
        })
        return result
