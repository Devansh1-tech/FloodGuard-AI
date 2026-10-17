"""
mock_data_generator.py — Authentic Nepal Terai Synthetic Geospatial Generator
=============================================================================

Generates high-fidelity, topologically valid geospatial layers for the
Nepal Terai (Koshi Basin, Sunsari, and Saptari districts).

Provides zero-dependency fallback datasets for offline operation, unit testing,
and instant end-to-end pipeline validation.
"""

from __future__ import annotations

import numpy as np
import geopandas as gpd
from shapely.geometry import Point, LineString, Polygon, MultiPolygon, box
from typing import Dict, List, Tuple

from SettlementImpactEngine.utils.crs import DEFAULT_GEOGRAPHIC_CRS
from SettlementImpactEngine.utils.geometry import fix_invalid_geometries
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class MockNepalDataGenerator:
    """
    Synthesizes authentic Nepal geospatial datasets for disaster simulation.
    """

    def __init__(self, bounds: Tuple[float, float, float, float] = (86.50, 26.40, 87.10, 26.80)) -> None:
        """
        Parameters
        ----------
        bounds : tuple
            (min_lon, min_lat, max_lon, max_lat) in WGS 84.
            Default covers the Koshi River flood belt in Sunsari and Saptari.
        """
        self.minx, self.miny, self.maxx, self.maxy = bounds
        self.crs = DEFAULT_GEOGRAPHIC_CRS

    def generate_administrative_boundaries(self) -> gpd.GeoDataFrame:
        """
        Create realistic administrative boundaries for Sunsari and Saptari districts.
        """
        logger.info("Generating authentic administrative boundaries for Nepal Terai...")

        # Sub-divide the bounding box into realistic municipalities
        # Dividing roughly along Koshi River (~86.85 lon)
        mid_x = (self.minx + self.maxx) / 2.0
        mid_y = (self.miny + self.maxy) / 2.0

        records = [
            # Sunsari District (East of Koshi)
            {
                "province_id": 1,
                "province_name": "Koshi Province",
                "district_id": "SUN",
                "district_name": "Sunsari",
                "municipality_id": "SUN_01",
                "municipality_name": "Barahachhetra",
                "municipality_type": "Municipality",
                "total_population": 85000,
                "geometry": Polygon([
                    (mid_x, mid_y), (self.maxx, mid_y),
                    (self.maxx, self.maxy), (mid_x, self.maxy),
                    (mid_x, mid_y)
                ]),
            },
            {
                "province_id": 1,
                "province_name": "Koshi Province",
                "district_id": "SUN",
                "district_name": "Sunsari",
                "municipality_id": "SUN_02",
                "municipality_name": "Inaruwa",
                "municipality_type": "Municipality",
                "total_population": 72000,
                "geometry": Polygon([
                    (mid_x + 0.1, self.miny), (self.maxx, self.miny),
                    (self.maxx, mid_y), (mid_x + 0.1, mid_y),
                    (mid_x + 0.1, self.miny)
                ]),
            },
            {
                "province_id": 1,
                "province_name": "Koshi Province",
                "district_id": "SUN",
                "district_name": "Sunsari",
                "municipality_id": "SUN_03",
                "municipality_name": "Koshi Rural Municipality",
                "municipality_type": "Rural Municipality",
                "total_population": 48000,
                "geometry": Polygon([
                    (mid_x, self.miny), (mid_x + 0.1, self.miny),
                    (mid_x + 0.1, mid_y), (mid_x, mid_y),
                    (mid_x, self.miny)
                ]),
            },
            # Saptari District (West of Koshi)
            {
                "province_id": 2,
                "province_name": "Madhesh Province",
                "district_id": "SAP",
                "district_name": "Saptari",
                "municipality_id": "SAP_01",
                "municipality_name": "Rajbiraj",
                "municipality_type": "Municipality",
                "total_population": 69000,
                "geometry": Polygon([
                    (self.minx, self.miny), (mid_x - 0.1, self.miny),
                    (mid_x - 0.1, mid_y), (self.minx, mid_y),
                    (self.minx, self.miny)
                ]),
            },
            {
                "province_id": 2,
                "province_name": "Madhesh Province",
                "district_id": "SAP",
                "district_name": "Saptari",
                "municipality_id": "SAP_02",
                "municipality_name": "Hanumannagar Kankalini",
                "municipality_type": "Municipality",
                "total_population": 52000,
                "geometry": Polygon([
                    (mid_x - 0.1, self.miny), (mid_x, self.miny),
                    (mid_x, mid_y), (mid_x - 0.1, mid_y),
                    (mid_x - 0.1, self.miny)
                ]),
            },
            {
                "province_id": 2,
                "province_name": "Madhesh Province",
                "district_id": "SAP",
                "district_name": "Saptari",
                "municipality_id": "SAP_03",
                "municipality_name": "Kanchanrup",
                "municipality_type": "Municipality",
                "total_population": 58000,
                "geometry": Polygon([
                    (self.minx, mid_y), (mid_x, mid_y),
                    (mid_x, self.maxy), (self.minx, self.maxy),
                    (self.minx, mid_y)
                ]),
            },
        ]

        gdf = gpd.GeoDataFrame(records, crs=self.crs)
        return fix_invalid_geometries(gdf)

    def generate_road_network(self) -> gpd.GeoDataFrame:
        """
        Create a representative road network including the Mahendra Highway (NH01),
        Koshi Barrage crossing, and regional feeder networks.
        """
        logger.info("Generating realistic transportation road network...")
        mid_y = (self.miny + self.maxy) * 0.45  # Near Koshi Barrage latitude (~26.52)

        roads = [
            # East-West National Highway (Mahendra Highway NH01)
            {
                "road_id": "RD_NH01_01",
                "road_name": "Mahendra Highway (NH01 West)",
                "highway_type": "highway",
                "surface": "paved",
                "lanes": 2,
                "is_bridge": False,
                "geometry": LineString([
                    (self.minx, mid_y), (86.70, mid_y), (86.84, mid_y)
                ]),
            },
            # Koshi Barrage Bridge Segment
            {
                "road_id": "RD_BRG_01",
                "road_name": "Koshi Barrage Bridge Road",
                "highway_type": "trunk",
                "surface": "paved",
                "lanes": 2,
                "is_bridge": True,
                "geometry": LineString([
                    (86.84, mid_y), (86.86, mid_y + 0.01), (86.88, mid_y)
                ]),
            },
            # Mahendra Highway East towards Inaruwa & Itahari
            {
                "road_id": "RD_NH01_02",
                "road_name": "Mahendra Highway (NH01 East)",
                "highway_type": "highway",
                "surface": "paved",
                "lanes": 2,
                "is_bridge": False,
                "geometry": LineString([
                    (86.88, mid_y), (87.00, mid_y + 0.04), (self.maxx, mid_y + 0.06)
                ]),
            },
            # North-South Feeder Road to Barahachhetra / Chatara
            {
                "road_id": "RD_FEEDER_01",
                "road_name": "Chatara-Koshi Feeder Road",
                "highway_type": "primary",
                "surface": "paved",
                "lanes": 2,
                "is_bridge": False,
                "geometry": LineString([
                    (86.88, mid_y), (86.92, mid_y + 0.15), (87.02, self.maxy)
                ]),
            },
            # Southward Road to Rajbiraj Center
            {
                "road_id": "RD_FEEDER_02",
                "road_name": "Rajbiraj-Hanumannagar Link",
                "highway_type": "secondary",
                "surface": "paved",
                "lanes": 1,
                "is_bridge": False,
                "geometry": LineString([
                    (86.84, mid_y), (86.75, self.miny + 0.05), (86.60, self.miny + 0.02)
                ]),
            },
            # Local River Embankment Road (Vulnerable to Flooding)
            {
                "road_id": "RD_LOCAL_RIVER",
                "road_name": "East Embankment Agricultural Track",
                "highway_type": "tertiary",
                "surface": "unpaved",
                "lanes": 1,
                "is_bridge": False,
                "geometry": LineString([
                    (86.85, mid_y - 0.08), (86.86, mid_y), (86.87, mid_y + 0.12)
                ]),
            },
            # Inaruwa Bypass
            {
                "road_id": "RD_LOCAL_INARUWA",
                "road_name": "Inaruwa Southern Ring Road",
                "highway_type": "secondary",
                "surface": "paved",
                "lanes": 1,
                "is_bridge": False,
                "geometry": LineString([
                    (86.98, mid_y + 0.02), (87.05, mid_y + 0.01), (self.maxx, mid_y + 0.03)
                ]),
            },
        ]

        gdf = gpd.GeoDataFrame(roads, crs=self.crs)
        return fix_invalid_geometries(gdf)

    def generate_critical_infrastructure(self) -> gpd.GeoDataFrame:
        """
        Create critical facility locations (Hospitals, Schools, Police, Shelters).
        """
        logger.info("Generating critical infrastructure facilities...")

        facilities = [
            # Hospitals & Health Posts
            {
                "facility_id": "HOSP_01",
                "facility_name": "Koshi Zonal Hospital Satellite Clinic",
                "category": "health",
                "sub_type": "hospital",
                "capacity": 150,
                "geometry": Point(87.01, 26.60),
            },
            {
                "facility_id": "HOSP_02",
                "facility_name": "Hanumannagar Primary Health Center",
                "category": "health",
                "sub_type": "health_post",
                "capacity": 30,
                "geometry": Point(86.82, 26.54),
            },
            {
                "facility_id": "HOSP_03",
                "facility_name": "Gajendra Narayan Singh Hospital",
                "category": "health",
                "sub_type": "hospital",
                "capacity": 200,
                "geometry": Point(86.62, 26.46),
            },
            {
                "facility_id": "HOSP_04",
                "facility_name": "Bhantabari Border Health Post",
                "category": "health",
                "sub_type": "health_post",
                "capacity": 20,
                "geometry": Point(86.86, 26.49),
            },
            # Schools & Educational Facilities
            {
                "facility_id": "SCH_01",
                "facility_name": "Inaruwa Secondary Model School",
                "category": "education",
                "sub_type": "school",
                "capacity": 850,
                "geometry": Point(87.03, 26.61),
            },
            {
                "facility_id": "SCH_02",
                "facility_name": "Shree Janata Secondary School Bhantabari",
                "category": "education",
                "sub_type": "school",
                "capacity": 420,
                "geometry": Point(86.85, 26.51),
            },
            {
                "facility_id": "SCH_03",
                "facility_name": "Koshi Riverbank Public School",
                "category": "education",
                "sub_type": "school",
                "capacity": 310,
                "geometry": Point(86.865, 26.55),
            },
            {
                "facility_id": "SCH_04",
                "facility_name": "Hanumannagar Higher Secondary School",
                "category": "education",
                "sub_type": "school",
                "capacity": 600,
                "geometry": Point(86.80, 26.53),
            },
            # Security: Police & Emergency Rescue
            {
                "facility_id": "SEC_01",
                "facility_name": "District Police Office Sunsari",
                "category": "security",
                "sub_type": "police",
                "capacity": 120,
                "geometry": Point(87.02, 26.62),
            },
            {
                "facility_id": "SEC_02",
                "facility_name": "Area Police Post Bhantabari",
                "category": "security",
                "sub_type": "police",
                "capacity": 45,
                "geometry": Point(86.87, 26.50),
            },
            {
                "facility_id": "SEC_03",
                "facility_name": "Armed Police Force (APF) Border Outpost",
                "category": "security",
                "sub_type": "police",
                "capacity": 60,
                "geometry": Point(86.855, 26.52),
            },
            # Emergency Shelters
            {
                "facility_id": "SHEL_01",
                "facility_name": "Koshi Barrage Emergency Relief Camp",
                "category": "shelter",
                "sub_type": "emergency_shelter",
                "capacity": 1200,
                "geometry": Point(86.89, 26.53),
            },
            {
                "facility_id": "SHEL_02",
                "facility_name": "Inaruwa Covered Hall Disaster Center",
                "category": "shelter",
                "sub_type": "emergency_shelter",
                "capacity": 2500,
                "geometry": Point(87.04, 26.63),
            },
        ]

        gdf = gpd.GeoDataFrame(facilities, crs=self.crs)
        return fix_invalid_geometries(gdf)

    def generate_settlements_and_buildings(self, num_buildings: int = 150) -> Tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
        """
        Create representative settlement clusters and individual building footprints.
        """
        logger.info("Generating settlement clusters and %d building footprints...", num_buildings)

        settlements = [
            {"settlement_id": "SET_01", "name": "Inaruwa Town", "type": "Urban Center", "pop": 32000, "geometry": Point(87.03, 26.61)},
            {"settlement_id": "SET_02", "name": "Bhantabari", "type": "Border Market", "pop": 12000, "geometry": Point(86.86, 26.50)},
            {"settlement_id": "SET_03", "name": "Koshi Tappu Riverbank", "type": "Agricultural Village", "pop": 8500, "geometry": Point(86.86, 26.56)},
            {"settlement_id": "SET_04", "name": "Hanumannagar", "type": "Municipal Core", "pop": 18000, "geometry": Point(86.81, 26.53)},
            {"settlement_id": "SET_05", "name": "Prakashpur", "type": "Riverine Settlement", "pop": 9200, "geometry": Point(86.95, 26.68)},
        ]
        settlements_gdf = gpd.GeoDataFrame(settlements, crs=self.crs)

        # Generate building polygon footprints scattered around settlements
        np.random.seed(42)
        building_records = []
        b_types = ["residential", "commercial", "public", "agricultural", "industrial"]
        b_probs = [0.70, 0.15, 0.05, 0.08, 0.02]

        for s in settlements:
            center_x, center_y = s["geometry"].x, s["geometry"].y
            # Allocate buildings per settlement
            b_count = num_buildings // len(settlements)
            for i in range(b_count):
                dx = np.random.normal(0, 0.015)
                dy = np.random.normal(0, 0.015)
                bx, by = center_x + dx, center_y + dy
                # Building footprint (~15m to 30m in degrees ~ 0.00015 to 0.0003)
                size_x = np.random.uniform(0.00015, 0.00035)
                size_y = np.random.uniform(0.00015, 0.00035)

                b_type = np.random.choice(b_types, p=b_probs)
                floors = 1 if b_type == "agricultural" else int(np.random.choice([1, 2, 3], p=[0.6, 0.3, 0.1]))

                poly = box(bx, by, bx + size_x, by + size_y)
                building_records.append({
                    "building_id": f"BLD_{s['settlement_id']}_{i:03d}",
                    "settlement_name": s["name"],
                    "building_type": b_type,
                    "floors": floors,
                    "occupancy_estimate": floors * (4 if b_type == "residential" else 8),
                    "geometry": poly,
                })

        buildings_gdf = gpd.GeoDataFrame(building_records, crs=self.crs)
        return fix_invalid_geometries(settlements_gdf), fix_invalid_geometries(buildings_gdf)

    def generate_flood_extent(self) -> gpd.GeoDataFrame:
        """
        Synthesize a realistic flood polygon along the Koshi River flood corridor.
        """
        logger.info("Generating realistic Koshi river flood extent polygon...")
        # A multi-lobe flood extent running from North to South along the Koshi
        flood_polys = [
            # Main river corridor & Koshi Tappu inundation
            Polygon([
                (86.82, 26.70), (86.90, 26.70),
                (86.89, 26.58), (86.88, 26.48),
                (86.84, 26.48), (86.83, 26.58),
                (86.82, 26.70),
            ]),
            # Embankment breach overflow pocket into Sunsari agricultural plain
            Polygon([
                (86.87, 26.54), (86.92, 26.55),
                (86.93, 26.51), (86.87, 26.49),
                (86.87, 26.54),
            ]),
            # Hanumannagar western backwater spill
            Polygon([
                (86.81, 26.56), (86.84, 26.56),
                (86.83, 26.52), (86.80, 26.52),
                (86.81, 26.56),
            ]),
        ]

        gdf = gpd.GeoDataFrame(
            {"flood_id": [1, 2, 3], "event": ["Monsoon Flood 2024"] * 3, "geometry": flood_polys},
            crs=self.crs,
        )
        return fix_invalid_geometries(gdf)

    def generate_population_grid(self, grid_size: int = 25) -> gpd.GeoDataFrame:
        """
        Generate a gridded population density surface (simulating WorldPop).
        """
        logger.info("Generating gridded population density surface (%dx%d)...", grid_size, grid_size)
        x_bins = np.linspace(self.minx, self.maxx, grid_size + 1)
        y_bins = np.linspace(self.miny, self.maxy, grid_size + 1)

        grid_cells = []
        cell_id = 1
        np.random.seed(101)

        for i in range(grid_size):
            for j in range(grid_size):
                b = box(x_bins[i], y_bins[j], x_bins[i + 1], y_bins[j + 1])
                # Higher density near Inaruwa (east) and Rajbiraj (west)
                center_lon = (x_bins[i] + x_bins[i + 1]) / 2.0
                center_lat = (y_bins[j] + y_bins[j + 1]) / 2.0

                base_pop = np.random.uniform(150, 400)
                # Distance to Inaruwa (87.03, 26.61)
                dist_inaruwa = np.hypot(center_lon - 87.03, center_lat - 26.61)
                if dist_inaruwa < 0.05:
                    base_pop += 1200
                elif dist_inaruwa < 0.10:
                    base_pop += 600

                grid_cells.append({
                    "cell_id": f"CELL_{cell_id:04d}",
                    "population": round(base_pop),
                    "density_per_km2": round(base_pop * 12.5),  # approximate cell area
                    "geometry": b,
                })
                cell_id += 1

        gdf = gpd.GeoDataFrame(grid_cells, crs=self.crs)
        return fix_invalid_geometries(gdf)
