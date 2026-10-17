# SettlementImpactEngine — API Reference

## Table of Contents
1. [Core Configuration](#core-configuration)
2. [Pipeline Orchestrator](#pipeline-orchestrator)
3. [Dataset Ingestion & Generation](#dataset-ingestion--generation)
4. [Analytical Assessment Engines](#analytical-assessment-engines)
5. [Transportation & Network Analysis](#transportation--network-analysis)
6. [Population Exposure Modeling](#population-exposure-modeling)
7. [Damage Statistics & Reporting](#damage-statistics--reporting)
8. [Cartographic Visualization](#cartographic-visualization)
9. [Multi-Format Exporters](#multi-format-exporters)

---

## Core Configuration

### `SettlementImpactEngine.config.ImpactConfig`
Centralized configuration dataclass consumed across the entire lifecycle.

```python
@dataclass
class ImpactConfig:
    flood_polygon_path: Optional[str] = None
    flood_mask_path: Optional[str] = None
    detection_statistics_path: Optional[str] = None
    admin_boundaries_path: Optional[str] = None
    roads_path: Optional[str] = None
    buildings_path: Optional[str] = None
    infrastructure_path: Optional[str] = None
    population_raster_path: Optional[str] = None
    aoi_name: str = "nepal_terai_koshi"
    projected_crs: str = "EPSG:32645"
    geographic_crs: str = "EPSG:4326"
    output_dir: str = "outputs"
    infrastructure_buffer_meters: float = 250.0
    generate_visualizations: bool = True
    enable_network_analysis: bool = True
```

**Methods:**
- `get_output_path(filename: str) -> str`: Returns resolved absolute/relative path inside `output_dir`.

---

## Pipeline Orchestrator

### `SettlementImpactEngine.pipeline.SettlementImpactPipeline`
Master coordinator executing all Stage 3 modules sequentially.

```python
class SettlementImpactPipeline:
    def __init__(self, config: Optional[ImpactConfig] = None) -> None: ...
    def run(self) -> ImpactPipelineResult: ...
```

### `SettlementImpactEngine.pipeline.ImpactPipelineResult`
Dataclass holding all output metrics and generated file paths.

- `total_flood_area_km2`: float
- `affected_population`: int
- `flooded_buildings_count`: int
- `flooded_roads_km`: float
- `flooded_facilities_count`: int
- `affected_districts_count`: int
- `affected_municipalities_count`: int
- `isolated_settlements_count`: int
- `vector_paths`: dict[str, str]
- `table_paths`: dict[str, str]
- `report_paths`: dict[str, str]
- `map_paths`: dict[str, str]
- `damage_statistics`: dict
- `dashboard_data`: dict
- `impact_report`: dict
- `elapsed_seconds`: float

---

## Dataset Ingestion & Generation

### `SettlementImpactEngine.datasets.DatasetLoader`
```python
class DatasetLoader:
    def __init__(self, config: ImpactConfig) -> None: ...
    def load_all(self) -> ImpactDatasetBundle: ...
```

### `SettlementImpactEngine.datasets.MockNepalDataGenerator`
Synthesizes topologically valid geospatial datasets for Koshi and Saptari.

- `generate_administrative_boundaries() -> gpd.GeoDataFrame`
- `generate_road_network() -> gpd.GeoDataFrame`
- `generate_critical_infrastructure() -> gpd.GeoDataFrame`
- `generate_settlements_and_buildings(num_buildings: int = 150) -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]`
- `generate_flood_extent() -> gpd.GeoDataFrame`
- `generate_population_grid(grid_size: int = 25) -> gpd.GeoDataFrame`

---

## Analytical Assessment Engines

### `SettlementImpactEngine.analysis.AdministrativeImpactAnalyzer`
```python
class AdministrativeImpactAnalyzer:
    def __init__(self, config: ImpactConfig) -> None: ...
    def analyze(self, admin_gdf: gpd.GeoDataFrame, flood_gdf: gpd.GeoDataFrame) -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame, dict]: ...
```

### `SettlementImpactEngine.analysis.SettlementImpactAnalyzer`
```python
class SettlementImpactAnalyzer:
    def __init__(self, config: ImpactConfig) -> None: ...
    def analyze(self, settlements_gdf: gpd.GeoDataFrame, buildings_gdf: gpd.GeoDataFrame, flood_gdf: gpd.GeoDataFrame) -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame, dict]: ...
```

### `SettlementImpactEngine.analysis.InfrastructureImpactAnalyzer`
```python
class InfrastructureImpactAnalyzer:
    def __init__(self, config: ImpactConfig) -> None: ...
    def analyze(self, infrastructure_gdf: gpd.GeoDataFrame, flood_gdf: gpd.GeoDataFrame) -> tuple[dict[str, gpd.GeoDataFrame], dict]: ...
```

### `SettlementImpactEngine.analysis.DisasterRiskScorer`
```python
class DisasterRiskScorer:
    def compute_municipality_risk_scores(
        self,
        municipalities_summary: list[dict],
        pop_breakdown: dict[str, int],
        roads_flooded_km_by_muni: dict[str, float] = None,
        infra_flooded_by_muni: dict[str, int] = None,
    ) -> list[dict]: ...
```

---

## Transportation & Network Analysis

### `SettlementImpactEngine.network.RoadImpactAnalyzer`
```python
class RoadImpactAnalyzer:
    def analyze(self, roads_gdf: gpd.GeoDataFrame, flood_gdf: gpd.GeoDataFrame) -> tuple[gpd.GeoDataFrame, dict]: ...
```

### `SettlementImpactEngine.network.RoadConnectivityGraph`
```python
class RoadConnectivityGraph:
    def build_graph_from_geodataframe(self, roads_gdf: gpd.GeoDataFrame) -> nx.Graph: ...
    def evaluate_flood_severance(self, baseline_roads_gdf: gpd.GeoDataFrame, flood_gdf: gpd.GeoDataFrame) -> dict: ...
```

### `SettlementImpactEngine.network.AccessibilityAnalyzer`
```python
class AccessibilityAnalyzer:
    def evaluate_settlement_isolation(
        self,
        settlements_gdf: gpd.GeoDataFrame,
        roads_gdf: gpd.GeoDataFrame,
        emergency_facilities_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
    ) -> dict: ...
```

---

## Population Exposure Modeling

### `SettlementImpactEngine.population.PopulationExposureAnalyzer`
```python
class PopulationExposureAnalyzer:
    def analyze(
        self,
        population_grid_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
        admin_gdf: Optional[gpd.GeoDataFrame] = None,
        raster_path: Optional[str] = None,
    ) -> dict: ...
```

---

## Damage Statistics & Reporting

### `SettlementImpactEngine.statistics.DamageSummaryEngine`
- `compile_damage_statistics(...) -> dict`
- `compile_dashboard_data(...) -> dict`
- `compile_humanitarian_impact_report(...) -> dict`

---

## Cartographic Visualization

### `SettlementImpactEngine.visualization.CartographicMapBuilder`
- `render_all_maps(...) -> dict[str, str]`
- `render_administrative_flood_map(flood_gdf, admin_gdf) -> str`
- `render_road_impact_map(roads_gdf, flooded_roads_gdf, flood_gdf) -> str`
- `render_critical_infrastructure_map(infra_gdf, flood_gdf, admin_gdf) -> str`
- `render_population_exposure_map(population_gdf, flood_gdf, admin_gdf) -> str`

---

## Multi-Format Exporters

### `SettlementImpactEngine.export.VectorExporter`
- `export_all_layers(...) -> dict[str, str]`
- `export_geojson(gdf, filename) -> str`
- `export_shapefile(gdf, base_filename) -> str`

### `SettlementImpactEngine.export.TabularExporter`
- `export_infrastructure_summary(df, filename) -> str`
- `export_dataframe(df, filename) -> str`

### `SettlementImpactEngine.export.ReportExporter`
- `export_all_reports(...) -> dict[str, str]`
- `export_json(data, filename) -> str`
