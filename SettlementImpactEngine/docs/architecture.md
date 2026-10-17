# SettlementImpactEngine — Software Architecture

## 1. High-Level System Architecture

`SettlementImpactEngine` is the Stage 3 disaster intelligence layer of **FloodGuard AI**. It bridges the gap between raw Sentinel-1 Earth Observation outputs (flood rasters and vectorized polygons) and operational humanitarian response for government agencies (such as Nepal's NDRRMA, UN-SPIDER, and OCHA).

```mermaid
flowchart TD
    subgraph STAGE_2[Stage 2: Earth Observation Engine]
        S1[Sentinel-1 SAR IW GRD] --> PRE[Preprocessing & Refined Lee]
        PRE --> CD[Log-Ratio Change Detection]
        CD --> OTSU[Otsu Thresholding]
        OTSU --> MORPH[Morphological Cleaning]
        MORPH --> VEC[Vectorization]
        VEC --> FP[FloodPolygon.geojson & FloodMask.tif]
    end

    subgraph STAGE_3[Stage 3: Settlement Impact Assessment Engine]
        FP --> DL[DatasetLoader]
        EXT_DATA[(Admin, Roads, Buildings, Lifelines, WorldPop)] --> DL
        
        DL --> OVERLAY[Spatial Overlay & Indexing Core]
        
        OVERLAY --> MOD1[Module 1: Administrative Boundary Analysis]
        OVERLAY --> MOD2[Module 2: Settlement & Building Footprints]
        OVERLAY --> MOD3[Module 3: Transportation & NetworkX Graph]
        OVERLAY --> MOD4[Module 4: Critical Infrastructure & Routing]
        OVERLAY --> MOD5[Module 5: Population Exposure & Demographics]
        
        MOD1 & MOD2 & MOD3 & MOD4 & MOD5 --> SCORER[Multi-Criteria Disaster Risk Scorer]
        SCORER --> STATS[Damage Statistics & Report Engine]
        
        STATS --> EXP_VEC[Vector Exporter: GeoJSON, GPKG, SHP]
        STATS --> EXP_TAB[Tabular Exporter: CSV]
        STATS --> EXP_REP[Report Exporter: JSON SitReps]
        STATS --> VIZ[Cartographic Visualization Builder: PNG]
    end

    subgraph CONSUMERS[Downstream Integration]
        EXP_VEC & EXP_REP --> API[FastAPI Geospatial Microservice]
        API --> DB[(PostgreSQL / PostGIS)]
        API --> WEB[React + Leaflet Dashboard]
    end
```

---

## 2. Component Design & Responsibilities

| Module | Core Classes | Primary Responsibility |
| :--- | :--- | :--- |
| **`config`** | `ImpactConfig` | Single source of truth for study areas, CRS definitions, buffer tolerances, and export paths. |
| **`datasets`** | `DatasetLoader`, `MockNepalDataGenerator` | Harmonizes vector/raster inputs; provides built-in Nepal Terai geometries for offline zero-dependency execution. |
| **`utils`** | `get_logger`, `LogTimer`, `crs`, `geometry` | Metric area/length projections (UTM 45N / EPSG:32645), geometry repairs (`make_valid`), and timing. |
| **`overlay`** | `SpatialIntersectionEngine`, `SpatialIndexQuery`, `ZonalStatisticsEngine` | Fast STRtree nearest-neighbor lookups, planar polygon clipping, line-splitting, and proportional area math. |
| **`analysis`** | `AdministrativeImpactAnalyzer`, `SettlementImpactAnalyzer`, `InfrastructureImpactAnalyzer`, `DisasterRiskScorer` | Sectoral impact evaluations and multi-criteria disaster severity ranking (0–100 DSI). |
| **`network`** | `RoadImpactAnalyzer`, `RoadConnectivityGraph`, `AccessibilityAnalyzer` | Highway/bridge inundation, NetworkX topological graph fragmentation, and isolated settlement detection. |
| **`population`** | `PopulationExposureAnalyzer`, `PopulationDensityAnalyzer` | Proportional area population modeling, demographic vulnerability (children, elderly, displaced households). |
| **`statistics`** | `DamageSummaryEngine`, `TabularAggregator` | Unifies multi-sectoral metrics into `DamageStatistics.json`, `DashboardData.json`, and `ImpactReport.json`. |
| **`visualization`** | `CartographicMapBuilder`, `CartoStyle` | Publication-ready 200 DPI situational maps with north arrows, metric scale bars, and legends. |
| **`export`** | `VectorExporter`, `TabularExporter`, `ReportExporter` | Concurrently serializes GeoJSON, Shapefile, GeoPackage, CSV, and JSON deliverables. |

---

## 3. Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Disaster Analyst / CLI
    participant Pipe as SettlementImpactPipeline
    participant Load as DatasetLoader
    participant Analyzers as Analytical Modules
    participant Stats as DamageSummaryEngine
    participant Exporters as Multi-Format Exporters
    participant Viz as CartographicMapBuilder

    Operator->>Pipe: run()
    Pipe->>Load: load_all()
    Load-->>Pipe: ImpactDatasetBundle
    
    par Spatial Analysis
        Pipe->>Analyzers: Administrative Impact (Admin Units)
        Pipe->>Analyzers: Settlement & Building Footprints
        Pipe->>Analyzers: Road Network Inundation & Graph Severance
        Pipe->>Analyzers: Critical Lifelines & Nearest Facility Routing
        Pipe->>Analyzers: Population Zonal Exposure & Demographics
    end

    Analyzers-->>Pipe: Analytical GeoDataFrames & Summaries
    Pipe->>Analyzers: Compute Disaster Severity Index (DSI)
    Pipe->>Stats: Compile Damage Statistics, Dashboard Data, SitRep
    Stats-->>Pipe: Formatted JSON Payloads

    par Output Generation
        Pipe->>Exporters: Export GeoJSON, GPKG, Shapefiles
        Pipe->>Exporters: Export Infrastructure & Municipality CSVs
        Pipe->>Exporters: Export DamageStatistics.json, ImpactReport.json
        Pipe->>Viz: Render 4-Map Cartography Suite
    end

    Exporters-->>Pipe: Generated File Paths
    Viz-->>Pipe: PNG Map Paths
    Pipe-->>Operator: ImpactPipelineResult
```

---

## 4. Integration with PostgreSQL/PostGIS & FastAPI

All generated spatial datasets are exported in standard WGS 84 (`EPSG:4326`) GeoJSON and OGC GeoPackage formats, allowing direct insertion into PostGIS without reprojection:
```sql
-- Automated PostGIS Ingestion
ALTER TABLE affected_buildings ADD COLUMN geom geometry(Polygon, 4326);
CREATE INDEX idx_affected_buildings_geom ON affected_buildings USING GIST (geom);
```
FastAPI endpoints can serve `DashboardData.json` directly to the frontend for sub-millisecond response times.
