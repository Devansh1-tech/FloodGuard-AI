# FloodGuard-AI — Flood Detection Engine

<p align="center">
  <b>Production-grade Sentinel-1 SAR Rapid Flood Extent Mapping & Settlement Impact Analytics</b><br>
  <i>Designed for Nepal Terai (Koshi, Chitwan, Narayani Basins) & Disaster Response Operations</i>
</p>

---

## Overview

**FloodGuard-AI Flood Detection Engine** is an Earth Observation and Computer Vision system designed to automate rapid, all-weather flood inundation mapping using European Space Agency (ESA) Sentinel-1 Synthetic Aperture Radar (SAR) imagery.

During severe monsoon floods, dense cloud cover renders optical satellites (Sentinel-2, Landsat) ineffective. FloodGuard-AI leverages C-band SAR microwave penetration, directional Refined Lee speckle filtering, server-side scaled log-ratio change detection, and automatic Otsu thresholding to produce sub-hectare flood maps and vector polygons in minutes.

---

## Key Features

- **All-Weather 24/7 Remote Sensing:** Penetrates clouds, heavy precipitation, and nighttime conditions using Sentinel-1 C-band SAR ($\sim 5.4\text{ GHz}$).
- **State-of-the-Art Preprocessing:** Implements the **Refined Lee Filter** with 8 directional sub-windows to preserve narrow flood channels, levees, and embankments while suppressing multiplicative speckle.
- **Robust Change Detection:** Scaled Log-Ratio operator transforms multiplicative speckle into a symmetric, additive distribution ideal for statistical separation.
- **Fully Automatic Otsu Thresholding:** Calculates the global optimal inundation threshold server-side via between-class variance maximization on Earth Engine array histograms—zero manual calibration required.
- **Mathematical Morphology Cleaning:** Eliminates isolated false-positive pixels via opening, bridges micro-gaps via closing, fills interior holes, and applies an 8-pixel Minimum Mapping Unit (MMU).
- **Sub-Meter Geodesic Accuracy:** Automatically resolves optimal local UTM zones (e.g. UTM 45N / EPSG:32645 for Eastern Nepal) for planar area ($\text{km}^2$) and perimeter ($\text{km}$) computations.
- **Multi-Format Geospatial Exports:** Automatically outputs GeoTIFF raster masks, GeoJSON vector layers, ESRI Shapefiles, high-resolution preview graphics, and structured JSON telemetry.
- **Production Architecture:** Decoupled, modular, fully typed with Python 3.10+ type hints, PEP8 compliant, and 100% test-covered without live network dependencies.

---

## Repository Structure

```text
FloodDetectionEngine/
├── config/
│   ├── __init__.py
│   └── config.py               # Central configuration (dates, AOI, thresholds, exports)
│
├── gee/
│   ├── __init__.py
│   ├── initialize.py           # Earth Engine authentication & project management
│   ├── sentinel_loader.py      # Sentinel-1 GRD loading, filtering & median compositing
│   ├── preprocessing.py        # Border noise removal, dB conversion & Refined Lee filter
│   ├── filters.py              # Spatial kernels & directional edge templates
│   └── visualization.py        # Color ramps, basemaps & multi-panel preview rendering
│
├── detection/
│   ├── __init__.py
│   ├── change_detection.py     # Simple Difference, Ratio, and Scaled Log-Ratio operators
│   ├── otsu.py                 # Server-side automatic Otsu thresholding algorithm
│   ├── flood_mask.py           # Pipeline tying change detection to thresholding
│   ├── morphology.py           # Opening, closing, hole filling, and MMU component filter
│   └── vectorization.py        # Raster-to-vector polygonization, area/perimeter stats
│
├── export/
│   ├── __init__.py
│   ├── export_geotiff.py       # GeoTIFF export (Cloud Drive tasks and local LZW downloads)
│   └── export_geojson.py       # GeoJSON vector export
│
├── utils/
│   ├── __init__.py
│   ├── logger.py               # Structured logging with file rotation & stage timer
│   └── helper.py               # Geodesic UTM reprojection, date validation & JSON I/O
│
├── tests/
│   ├── __init__.py
│   ├── test_config.py          # Unit tests for configuration and AOI resolution
│   ├── test_utils.py           # Unit tests for math, geometry, and utility functions
│   ├── test_detection.py       # Unit tests for detection, morphology, and vectorization
│   ├── test_export.py          # Unit tests for GeoTIFF array writing & compression
│   └── test_pipeline.py       # Mock integration tests for full 10-stage pipeline
│
├── docs/
│   ├── architecture.md         # System design, data flow, and future integrations
│   ├── algorithms.md           # Mathematical derivations, SAR physics, and equations
│   └── api_reference.md        # Comprehensive class, method, and parameter catalogue
│
├── README.md                   # This documentation
└── requirements.txt            # Python dependencies
```

---

## 10-Stage Processing Pipeline

```text
  1. GEE Initialization
     Authenticate, connect to Google Earth Engine project, verify quotas.
         │
         ▼
  2. Sentinel-1 SAR Loader
     Filter COPERNICUS/S1_GRD by AOI, date range, IW mode, VV polarization, descending orbit.
     Generate temporal median composites for pre-event and post-event windows.
         │
         ▼
  3. Professional Preprocessing
     Remove border noise (-30 dB floor), calibrate backscatter, apply Refined Lee filter
     using 8 directional sub-windows to suppress speckle while preserving hydraulic edges.
         │
         ▼
  4. SAR Change Detection
     Compute Scaled Log-Ratio: LR = 10 * log10(Before / After) = Before(dB) - After(dB).
     Generates symmetric, bimodal distribution separating dry land from inundation.
         │
         ▼
  5. Automatic Otsu Thresholding
     Server-side histogram computation and between-class variance maximization.
     Extracts optimal threshold t* dividing water from non-water.
         │
         ▼
  6. Morphological Cleaning
     Focal opening (remove isolated speckle) + closing (fill micro-voids) +
     hole filling + 8-pixel Minimum Mapping Unit (MMU) connected-component filtering.
         │
         ▼
  7. GeoTIFF Export
     Download and write compressed GeoTIFFs (FloodMask.tif, Before_SAR.tif,
     After_SAR.tif, Change_Image.tif) with LZW compression and georeferencing.
         │
         ▼
  8. Vectorization
     Convert binary raster mask to polygon geometries (rasterio.features.shapes).
     Auto-reproject to local UTM zone and compute geodesic area (km²) and perimeter (km).
         │
         ▼
  9. Vector & Statistics Export
     Save clean vector layers to FloodPolygon.geojson and FloodPolygon.shp.
     Serialize aggregated summary metrics and per-polygon attributes to statistics.json.
         │
         ▼
 10. Multi-Panel Visualization
     Render FloodPreview.png showing 4-panel visual comparison:
     [Before SAR] [After SAR] [Log-Ratio Change] [Flood Mask Overlay].
```

---

## Installation

### Prerequisites
- Python 3.10+
- Google Earth Engine account with an active Cloud Project ([sign up here](https://earthengine.google.com/))

### Setup
```bash
# Clone the repository
git clone https://github.com/Devansh1-tech/FloodGuard-AI.git
cd FloodGuard-AI/FloodDetectionEngine

# Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Authenticate Earth Engine (one-time setup)
earthengine authenticate
```

---

## Usage

### 1. Command-Line Interface (CLI)

Run the full pipeline using the integrated CLI:

```bash
# Run for preset Nepal Terai Koshi basin
python pipeline.py --aoi nepal_terai_koshi \
                   --before-start 2024-06-01 \
                   --before-end 2024-06-30 \
                   --after-start 2024-09-15 \
                   --after-end 2024-10-15 \
                   --method log_ratio \
                   --project ee-floodguardai \
                   --output-dir outputs

# Run with custom output directory and debug logging
python pipeline.py --aoi nepal_terai_chitwan \
                   --log-level DEBUG \
                   --output-dir my_flood_study
```

### 2. Python API

Integrate directly into Python applications, notebooks, or backend workers:

```python
from FloodDetectionEngine.config import EngineConfig
from FloodDetectionEngine.pipeline import FloodDetectionPipeline

# 1. Define configuration
config = EngineConfig(
    aoi_name="nepal_terai_koshi",
    before_start="2024-06-01",
    before_end="2024-06-30",
    after_start="2024-09-15",
    after_end="2024-10-15",
    change_method="log_ratio",
    gee_project="ee-floodguardai",
    output_dir="outputs",
)

# 2. Instantiate and execute pipeline
pipeline = FloodDetectionPipeline(config)
result = pipeline.run()

# 3. Access results
print(f"Total Flooded Area : {result.total_flooded_area_km2:.2f} km²")
print(f"Number of Polygons : {result.num_polygons}")
print(f"Otsu Threshold     : {result.otsu_threshold:.4f}")
print(f"Flood Mask GeoTIFF : {result.flood_mask_path}")
print(f"GeoJSON Layer      : {result.geojson_path}")
print(f"Shapefile Layer    : {result.shapefile_path}")
print(f"Visual Preview     : {result.preview_path}")
print(f"Summary Statistics : {result.statistics_path}")
```

---

## Output Artefacts

All outputs are saved to the configured `output_dir` (default: `outputs/`):

| File | Format | Description |
|---|---|---|
| `FloodMask.tif` | Cloud-compatible GeoTIFF | Single-band binary raster mask ($1 = \text{flooded}, 0 = \text{non-flooded}$), $10\text{m}$ resolution, LZW compressed. |
| `FloodPolygon.geojson` | GeoJSON (RFC 7946) | Vector polygons containing `area_km2`, `perimeter_km`, and `flood` properties. |
| `FloodPolygon.shp` | ESRI Shapefile | Complete ESRI shapefile bundle (`.shp`, `.shx`, `.dbf`, `.prj`) for QGIS / ArcGIS. |
| `FloodPreview.png` | 300 DPI PNG | Professional 4-panel visual graphic showing Before SAR, After SAR, Change Map, and Classified Inundation. |
| `statistics.json` | JSON | Machine-readable quantitative analytics report for backend microservices and dashboards. |
| `floodguard.log` | Text Log | Structured execution log with millisecond timing per stage. |

### Sample `statistics.json` Output:
```json
{
  "flood_detection_summary": {
    "total_flooded_area_km2": 42.1856,
    "total_perimeter_km": 184.2312,
    "number_of_flood_polygons": 28,
    "otsu_threshold": 1.4182,
    "change_method": "log_ratio",
    "aoi_name": "nepal_terai_koshi",
    "before_window": "2024-06-01 → 2024-06-30",
    "after_window": "2024-09-15 → 2024-10-15",
    "largest_polygon_km2": 18.412,
    "smallest_polygon_km2": 0.0084,
    "mean_polygon_km2": 1.5066
  },
  "polygon_statistics": [
    {
      "id": 0,
      "area_km2": 18.412,
      "perimeter_km": 54.21,
      "centroid_lon": 87.12456,
      "centroid_lat": 26.68912
    }
  ]
}
```

---

## Future Compatibility & Architecture

The engine is engineered for direct plug-and-play integration into the complete FloodGuard-AI ecosystem:

1. **FastAPI Microservice:** Run detection jobs asynchronously inside background tasks (`BackgroundTasks` or Celery queues) responding to crisis trigger events.
2. **PostgreSQL / PostGIS:** Store flood event boundaries using `gdf.to_postgis()` and execute rapid spatial queries (`ST_Intersects`) against OpenStreetMap settlement and population layers.
3. **React + Leaflet Dashboard:** Render `FloodPolygon.geojson` in real-time with choropleth flood depths and interactive popups.
4. **Google Gemini AI Multimodal Reporting:** Feed `statistics.json` and `FloodPreview.png` into Gemini 1.5 Pro to automatically draft executive disaster response briefs for UN-SPIDER and national disaster agencies.

See [`docs/architecture.md`](docs/architecture.md) for detailed architectural specifications.

---

## Testing & Quality Assurance

The test suite contains 52 comprehensive unit and integration tests covering configuration, utility functions, detection algorithms, export drivers, and pipeline orchestration. All tests run offline with zero external network dependencies:

```bash
# Run the complete test suite
pytest tests/ -v

# Run with test coverage report
pytest tests/ --cov=FloodDetectionEngine
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](../LICENSE) file for details.
