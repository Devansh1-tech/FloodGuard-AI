# FloodGuard-AI — System Architecture & Design Specification

This document details the architectural principles, component relationships, data flow, and future integration paths for the **FloodGuard-AI Flood Detection Engine**.

---

## 1. Architectural Philosophy

The Flood Detection Engine is engineered to adhere to strict enterprise software and scientific computing standards:

1. **Decoupled Server & Client Computations:** Heavy radar data processing (speckle filtering, change detection, histogram reductions) occurs server-side on Google Earth Engine. Cleaned arrays and vectorized features are processed client-side for rapid local export and analytics.
2. **Stateless & Deterministic:** Pipeline runs are strictly governed by an immutable `EngineConfig` dataclass, ensuring full reproducibility.
3. **No Magic Numbers:** All remote sensing hyperparameters (kernel sizes, thresholds, minimum mapping units, nodata values, export resolutions) are centrally managed and configurable.
4. **Cloud-Native & Production-Ready:** Designed from day one to serve as the core geospatial compute engine for FastAPI microservices, PostGIS analytical databases, and modern interactive web dashboards.

---

## 2. High-Level Component Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FloodGuard-AI Ecosystem                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 FloodDetectionEngine (Core Engine)                     │
│                                                                        │
│   ┌────────────────┐      ┌────────────────┐      ┌────────────────┐   │
│   │     config/    │ ───► │      gee/      │ ───► │   detection/   │   │
│   │  EngineConfig  │      │ SentinelLoader │      │ ChangeDetector │   │
│   │  AOI Presets   │      │ Preprocessor   │      │ OtsuThreshold  │   │
│   └────────────────┘      │ Visualizer     │      │ Morphology     │   │
│                           └────────────────┘      │ Vectorizer     │   │
│                                                   └────────────────┘   │
│                                                           │            │
│                                                           ▼            │
│   ┌────────────────┐      ┌────────────────┐      ┌────────────────┐   │
│   │     tests/     │      │     utils/     │ ◄─── │    export/     │   │
│   │ Unit Tests     │      │ Structured Log │      │ GeoTIFFExporter│   │
│   │ Mock E2E Tests │      │ Geodesic Math  │      │ GeoJSONExporter│   │
│   └────────────────┘      └────────────────┘      └────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│   Backend    │             │   Database   │             │   Frontend   │
│ FastAPI REST │             │  PostgreSQL  │             │ React / Vite │
│ Microservice │             │   PostGIS    │             │   Leaflet    │
└──────────────┘             └──────────────┘             └──────────────┘
```

---

## 3. Module Breakdown

### 3.1 `config/` — Central Configuration Management
- **`config.py`**: Declares `EngineConfig`, a comprehensive dataclass storing:
  - AOI boundaries (coordinates or presets: Koshi, Chitwan, Full Nepal Terai).
  - Temporal windows (pre-event and post-event observation dates).
  - SAR parameters (IW mode, VV polarization, descending orbit).
  - Preprocessing and speckle filter hyperparameters (Refined Lee kernel size, noise floor).
  - Change detection method (`log_ratio`, `difference`, `ratio`).
  - Morphological cleaning parameters (opening radius, closing radius, MMU in pixels).
  - Export specifications (scale, CRS, output directory, file stems).

### 3.2 `gee/` — Earth Engine Ingestion & Preprocessing
- **`initialize.py`**: Handles Google Earth Engine authentication (`ee.Initialize`), project assignment (`ee-floodguardai`), and service account credentials.
- **`sentinel_loader.py`**: Filters `COPERNICUS/S1_GRD` collection by bounds, dates, instrument mode, and orbit; computes temporal median composites to minimize baseline noise.
- **`preprocessing.py`**: Applies border noise removal, dB conversion, and Refined Lee speckle filtering.
- **`filters.py`**: Reusable spatial and directional filter kernels.
- **`visualization.py`**: Color maps, Hillshade basemaps, and PNG preview rendering (`render_flood_preview`).

### 3.3 `detection/` — Inundation Detection & Morphological Cleaning
- **`change_detection.py`**: Server-side SAR change operators (`Simple Difference`, `Ratio`, `Scaled Log-Ratio`).
- **`otsu.py`**: Server-side histogram generation via `ee.Reducer.histogram` and between-class variance maximization to derive the optimal decision threshold.
- **`morphology.py`**: Focal opening, closing, interior hole filling, and connected component area filtering (MMU).
- **`vectorization.py`**: Dual-strategy raster-to-polygon conversion:
  - Earth Engine server-side vectorization (`reduceToVectors`).
  - Local georeferenced vectorization (`rasterio.features.shapes` + `geopandas.GeoDataFrame`).
  - Geodesic area ($\text{km}^2$) and perimeter ($\text{km}$) computation via auto-UTM reprojection.
  - Summary and per-polygon metric aggregation into `statistics.json`.

### 3.4 `export/` — Multi-Format Geospatial Exporters
- **`export_geotiff.py`**: Multi-tiered GeoTIFF export (Cloud Drive tasks, URL streaming, and local rasterio array export with LZW compression).
- **`export_geojson.py`**: GeoJSON serialization of polygon geometries and properties.

### 3.5 `utils/` — Observability & Geodesic Mathematics
- **`logger.py`**: Structured multi-handler logging with file rotation, custom formatting, and `LogTimer` context manager for profiling execution time of every stage.
- **`helper.py`**: Date validation, safe directory creation, UTM projection resolution, geodesic area/perimeter computation, and atomic JSON I/O.

### 3.6 `pipeline.py` — Pipeline Orchestration
- Orchestrates the 10 sequential pipeline stages.
- Returns a structured `PipelineResult` dataclass.
- Exposes a robust CLI interface with full argument parsing.

---

## 4. End-to-End Pipeline Data Flow

```text
[ Pre-event Date Range ]  ──┐
[ Post-event Date Range ] ──┼──► SentinelLoader ──► Raw S1 Pre-event Image
[ Target AOI Geometry ]   ──┘                   ──► Raw S1 Post-event Image
                                                       │
                                                       ▼
                                                 Preprocessor
                                    (Border Noise + Refined Lee Filter)
                                                       │
                                                       ▼
                                                ChangeDetector
                                              (Scaled Log-Ratio)
                                                       │
                                                       ▼
                                                 OtsuThreshold
                                          (Histogram & Variance Max)
                                                       │
                                                       ▼
                                               MorphologyCleaner
                                        (Opening + Closing + MMU Filter)
                                                       │
                                                       ▼
                                                Clean Flood Mask
                                                       │
                                ┌──────────────────────┴──────────────────────┐
                                ▼                                             ▼
                        GeoTIFFExporter                                  Vectorizer
                                │                                             │
                                ▼                                             ▼
                         FloodMask.tif                              FloodPolygon.geojson
                         Before_SAR.tif                             FloodPolygon.shp
                         After_SAR.tif                              statistics.json
                         Change_Image.tif                                     │
                                │                                             │
                                └──────────────────────┬──────────────────────┘
                                                       │
                                                       ▼
                                                  Visualizer
                                                       │
                                                       ▼
                                                FloodPreview.png
```

---

## 5. Future Compatibility & System Integration

The `FloodDetectionEngine` is designed for seamless integration into modern distributed applications:

### 5.1 FastAPI Microservice Integration
Because the engine is fully object-oriented and returns a clean `PipelineResult` dataclass, it plugs directly into FastAPI endpoints and background worker queues (Celery / Redis / RQ):

```python
from fastapi import FastAPI, BackgroundTasks
from FloodDetectionEngine.config import EngineConfig
from FloodDetectionEngine.pipeline import FloodDetectionPipeline

app = FastAPI(title="FloodGuard-AI API")

@app.post("/api/v1/detect")
async def trigger_flood_detection(config_data: dict, background_tasks: BackgroundTasks):
    config = EngineConfig(**config_data)
    pipeline = FloodDetectionPipeline(config)
    # Offload execution to async background worker
    background_tasks.add_task(pipeline.run)
    return {"status": "processing", "aoi": config.aoi_name}
```

### 5.2 PostgreSQL / PostGIS Spatial Database
The vectorizer produces standard GeoPandas GeoDataFrames (`gdf`). These can be written directly to PostGIS spatial tables with spatial indexes:

```python
from sqlalchemy import create_engine

engine = create_engine("postgresql://postgres:password@localhost:5432/floodguard")
# Writes flood polygons directly into PostGIS
gdf.to_postgis("flood_events", engine, if_exists="append", index=True, index_label="geom_idx")
```

PostGIS enables rapid spatial queries such as:
```sql
-- Find all villages intersecting the detected flood extent
SELECT v.name, v.population, ST_Area(ST_Intersection(v.geom, f.geometry)) / 10000.0 AS flooded_hectares
FROM settlements v, flood_events f
WHERE ST_Intersects(v.geom, f.geometry);
```

### 5.3 React & Leaflet Web Dashboard
The engine's output artefacts are immediately consumable by web GIS dashboards:
- `FloodPolygon.geojson`: Rendered directly as a vector layer using `L.geoJSON()` with interactive popups showing flooded area ($\text{km}^2$), perimeter, and severity.
- `FloodMask.tif`: Can be tiled via Cloud Optimized GeoTIFF (COG) servers like TiTiler for sub-second web map zoom and pan.
- `statistics.json`: Powers dashboard cards (Total Flooded Area, Affected Settlements, Number of Inundation Clusters).

### 5.4 Google Gemini AI Multimodal Situation Reports
The engine generates both quantitative telemetry (`statistics.json`) and high-resolution visual previews (`FloodPreview.png`). These can be fed into Google's Gemini Multimodal models to automatically generate natural-language Disaster Impact Reports for humanitarian agencies (UN-SPIDER, Nepal Red Cross):

```python
import google.generativeai as genai
from PIL import Image

genai.configure(api_key="GEMINI_API_KEY")
model = genai.GenerativeModel("gemini-1.5-pro")

image = Image.open("outputs/FloodPreview.png")
with open("outputs/statistics.json") as f:
    stats_text = f.read()

prompt = f"""
Analyze this flood detection satellite preview and the following quantitative statistics:
{stats_text}
Generate an executive UN-SPIDER humanitarian crisis response summary for the Nepal Terai region.
Highlight critical inundation zones, estimated impact severity, and recommended evacuation corridors.
"""

response = model.generate_content([prompt, image])
print(response.text)
```
