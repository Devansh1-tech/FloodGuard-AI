# FloodGuard AI — Settlement Impact Assessment Engine (Stage 3)

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![GeoPandas](https://img.shields.io/badge/GeoPandas-1.2.0-green.svg)](https://geopandas.org/)
[![NetworkX](https://img.shields.io/badge/NetworkX-3.6+-orange.svg)](https://networkx.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An enterprise-grade geospatial disaster intelligence engine designed for rapid settlement damage assessment, transportation network severance analysis, population exposure modeling, and critical infrastructure triage across the Nepal Terai.

---

## Key Capabilities

1. **Administrative Boundary Analysis (Module 1)**:
   - Automated spatial overlay across national hierarchy (Provinces, Districts, Municipalities, Wards).
   - Computes physical inundation area ($km^2$), submersion percentage, and severity categorization.

2. **Settlement & Building Footprint Damage (Module 2)**:
   - Inundation modeling across village centers and building polygons.
   - Classification breakdown: Residential, Commercial, Industrial, Agricultural, and Public.
   - Estimated occupant displacement modeling.

3. **Transportation Impact & Network Graph Severance (Module 3)**:
   - Linear submersion by highway classification (Highways, Primary, Secondary, Tertiary, Bridges).
   - Topological graph modeling via NetworkX to detect network fragmentation and severed components.
   - Identification of completely isolated settlements lacking overland emergency access.

4. **Critical Infrastructure Assessment & Nearest Safe Facility Routing (Module 4)**:
   - Direct inundation and 250m perimeter encroachment analysis for Hospitals, Schools, Police, and Shelters.
   - High-speed 2D metric `STRtree` nearest-neighbor search for emergency triage routing to operational alternates.

5. **Human Population Exposure & Demographic Vulnerability (Module 5)**:
   - Area-weighted proportional zonal statistics using WorldPop / Census surfaces.
   - Stratified vulnerability modeling: Children (<5), Elderly (65+), Female Population, and Displaced Households.

6. **Multi-Criteria Disaster Risk Scoring (Module 6)**:
   - Computes normalized Disaster Severity Index (0–100 DSI) per municipality based on human life exposure, physical flooding, lifeline loss, and transport severance.
   - Direct serialization of `DamageStatistics.json`, `DashboardData.json`, and `ImpactReport.json` (UN-OCHA format).

7. **Publication Cartography Suite (Module 7)**:
   - Produces 200 DPI situational maps with north arrows, metric scale bars, and standard legends:
     - `Flood_Administrative_Map.png`
     - `Road_Impact_Map.png`
     - `Critical_Infrastructure_Map.png`
     - `Population_Exposure_Heatmap.png`

8. **Multi-Format Vector & Tabular Exporter (Module 8)**:
   - Simultaneous exports to GeoJSON, ESRI Shapefile, OGC GeoPackage (`.gpkg`), and CSV.

---

## Project Structure

```text
SettlementImpactEngine/
├── config/                  # Master configuration dataclass & parameters
├── datasets/                # Data ingestion, loaders, & Nepal Terai mock generator
├── overlay/                 # Spatial indexing, polygon/line clipping, & zonal stats
├── analysis/                # Admin impact, settlement damage, infrastructure, & DSI scoring
├── network/                 # Road inundation, NetworkX graph severance, & accessibility
├── population/              # Human exposure modeling & demographic vulnerability
├── statistics/              # Consolidated disaster telemetry & CSV aggregators
├── visualization/           # Cartographic map builder & styling tokens
├── export/                  # Multi-format vector, tabular, & JSON exporters
├── utils/                   # CRS management (UTM 45N), geometry repairs, & logger
├── tests/                   # Comprehensive pytest unit and integration test suite
├── docs/                    # Architecture, methodology, & API reference documentation
├── pipeline.py              # End-to-end pipeline orchestrator
├── main.py                  # CLI entry point
├── requirements.txt         # Python dependencies
└── README.md                # Project documentation
```

---

## Quick Start

### 1. Installation
Ensure your virtual environment is active:
```bash
pip install -r SettlementImpactEngine/requirements.txt
```

### 2. Run via CLI
Run with automatic Stage 2 output discovery (or zero-dependency Nepal Terai simulation):
```bash
python SettlementImpactEngine/main.py
```

Run with custom flood polygons and output directory:
```bash
python SettlementImpactEngine/main.py --flood-polygon outputs/FloodPolygon.geojson --output-dir outputs/impact
```

Run in headless/fast batch mode (skipping map image rendering):
```bash
python SettlementImpactEngine/main.py --no-viz
```

### 3. Programmatic Python Usage
```python
from SettlementImpactEngine import ImpactConfig, SettlementImpactPipeline

# Configure engine
config = ImpactConfig(
    flood_polygon_path="outputs/FloodPolygon.geojson",
    output_dir="outputs/impact",
    aoi_name="nepal_terai_koshi",
    generate_visualizations=True,
    enable_network_analysis=True,
)

# Run pipeline
pipeline = SettlementImpactPipeline(config)
result = pipeline.run()

print(f"Flooded Area: {result.total_flood_area_km2} km²")
print(f"Affected Population: {result.affected_population:,} persons")
print(f"Flooded Buildings: {result.flooded_buildings_count:,}")
print(f"Submerged Roads: {result.flooded_roads_km:.2f} km")
```

---

## Generated Deliverables

| Deliverable | Format | Description |
| :--- | :--- | :--- |
| `AffectedDistricts.geojson` | GeoJSON | Flooded extents aggregated by District |
| `AffectedMunicipalities.geojson` | GeoJSON | Inundation area and severity by Municipality |
| `AffectedVillages.geojson` | GeoJSON | Affected settlement center points |
| `AffectedBuildings.geojson` | GeoJSON | Submerged building footprint polygons with occupancy |
| `AffectedRoads.geojson` | GeoJSON | Flooded road lines classified by highway type |
| `AffectedHospitals.geojson` | GeoJSON | Impacted health facilities with nearest safe alternates |
| `AffectedSchools.geojson` | GeoJSON | Impacted educational facilities |
| `AffectedPolice.geojson` | GeoJSON | Impacted security installations |
| `SettlementImpactLayers.gpkg` | GeoPackage | All spatial layers combined into an OGC GeoPackage |
| `DamageStatistics.json` | JSON | Complete multi-sectoral disaster telemetry |
| `DashboardData.json` | JSON | Frontend-optimized KPI cards, charts, and rankings |
| `ImpactReport.json` | JSON | Formal situation report (UN-OCHA / NDRRMA standard) |
| `AffectedPopulation.json` | JSON | Human exposure and demographic vulnerability metrics |
| `InfrastructureSummary.csv` | CSV | Tabular matrix of all impacted facilities |
| `MunicipalityImpactSummary.csv`| CSV | Tabular ranking of municipalities by Disaster Severity Index |
| `Flood_Administrative_Map.png`| PNG | 200 DPI administrative inundation context map |
| `Road_Impact_Map.png` | PNG | 200 DPI transportation severance advisory map |
| `Critical_Infrastructure_Map.png`| PNG | 200 DPI lifeline status and triage map |
| `Population_Exposure_Heatmap.png`| PNG | 200 DPI gridded population exposure map |

---

## Running the Automated Test Suite

Run the full pytest suite:
```bash
pytest SettlementImpactEngine/tests -v
```

All 16 unit and integration tests validate geometry sanitization, CRS conversions, proportional areal calculations, NetworkX topological graph severance, nearest-facility queries, and end-to-end pipeline execution.
