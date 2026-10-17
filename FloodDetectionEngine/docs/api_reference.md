# FloodGuard-AI — Python API Reference

Comprehensive API reference for the `FloodDetectionEngine` package.

---

## 1. `FloodDetectionEngine.config`

### `EngineConfig`
Central dataclass controlling all pipeline parameters and runtime settings.

```python
from FloodDetectionEngine.config import EngineConfig
```

#### Fields:
- `aoi_name : str = "nepal_terai_koshi"` — Name of preset AOI (`nepal_terai_koshi`, `nepal_terai_chitwan`, `nepal_terai_full`, or `custom`).
- `aoi_coords : Optional[List[List[float]]] = None` — Explicit coordinate ring `[[lon, lat], ...]` if `aoi_name="custom"`.
- `before_start : str = "2024-06-01"` — Pre-event window start date (`YYYY-MM-DD`).
- `before_end : str = "2024-06-30"` — Pre-event window end date (`YYYY-MM-DD`).
- `after_start : str = "2024-09-15"` — Post-event window start date (`YYYY-MM-DD`).
- `after_end : str = "2024-10-15"` — Post-event window end date (`YYYY-MM-DD`).
- `s1_polarization : str = "VV"` — SAR polarization band.
- `s1_orbit_pass : str = "DESCENDING"` — Radar orbit direction (`ASCENDING` or `DESCENDING`).
- `s1_instrument_mode : str = "IW"` — Interferometric Wide swath mode.
- `s1_resolution_m : int = 10` — Nominal ground sampling distance in meters.
- `refined_lee_kernel_size : int = 7` — Refined Lee filter window size.
- `refined_lee_num_looks : float = 4.4` — Number of equivalent looks for S1 IW GRD.
- `change_method : str = "log_ratio"` — Change detection operator (`difference`, `ratio`, or `log_ratio`).
- `log_ratio_scale : float = 10.0` — Multiplier for log-ratio calculation.
- `otsu_histogram_bins : int = 256` — Histogram resolution for Otsu thresholding.
- `morphology_opening_radius : int = 1` — Kernel radius for morphological opening.
- `morphology_closing_radius : int = 2` — Kernel radius for morphological closing.
- `min_mapping_unit_pixels : int = 8` — Minimum cluster size in pixels to retain (MMU).
- `fill_holes : bool = True` — Whether to fill enclosed non-water holes in flood polygons.
- `export_scale : int = 10` — Spatial resolution for export in meters.
- `export_crs : str = "EPSG:4326"` — Coordinate reference system.
- `output_dir : str = "outputs"` — Directory path where output files are saved.
- `gee_export_to_drive : bool = False` — If `True`, exports to Google Drive instead of local download.
- `gee_project : Optional[str] = None` — Google Cloud Project ID for Earth Engine.

#### Methods:
- `get_aoi_coordinates() -> List[List[float]]`: Resolves polygon ring coordinates from explicit coordinates or preset.
- `get_output_path(filename: str) -> str`: Returns full filesystem path inside `output_dir`.

---

## 2. `FloodDetectionEngine.gee`

### `initialize_gee(config: EngineConfig) -> None`
Initializes Google Earth Engine Python API with authentication and project selection.

### `SentinelLoader`
Loads and filters raw Sentinel-1 GRD imagery from Earth Engine.

#### Methods:
- `load_pair() -> Tuple[ee.Image, ee.Image]`: Loads pre-event and post-event median composites.
- `load_collection(start_date: str, end_date: str) -> ee.Image`: Loads, filters, and computes median composite for a specific date range.

### `Preprocessor`
Applies border noise removal, dB conversion, and Refined Lee speckle filtering.

#### Methods:
- `preprocess(image: ee.Image) -> ee.Image`: Complete radiometric and speckle filtering workflow.
- `refined_lee_filter(image: ee.Image) -> ee.Image`: Server-side Refined Lee speckle filter with directional sub-windows.

### `Visualizer`
Renders professional color maps, basemaps, and PNG previews.

#### Methods:
- `render_flood_preview(before_array, after_array, difference_array, flood_mask_array, output_path) -> str`: Generates high-resolution multi-panel preview image.

---

## 3. `FloodDetectionEngine.detection`

### `ChangeDetector`
Calculates SAR change image using chosen mathematical operator.

#### Methods:
- `detect(before: ee.Image, after: ee.Image) -> ee.Image`: Computes change image (`difference`, `ratio`, or `log_ratio`).

### `otsu_threshold(image: ee.Image, region: ee.Geometry, config: EngineConfig, band: str = "change") -> ee.Number`
Calculates automatic Otsu threshold server-side via between-class variance maximization.

### `MorphologyCleaner`
Cleans binary flood masks using morphological opening, closing, hole filling, and MMU filtering.

#### Methods:
- `clean(mask: ee.Image) -> ee.Image`: Applies opening, closing, hole filling, and connected component area filtering.

### `FloodMaskGenerator`
Chains change detection, Otsu thresholding, and morphological cleaning.

#### Methods:
- `generate(before: ee.Image, after: ee.Image, aoi: ee.Geometry) -> Tuple[ee.Image, ee.Image, ee.Number]`: Returns `(change_image, clean_flood_mask, otsu_threshold_ee)`.

### `Vectorizer`
Converts binary raster mask into vector polygons and computes geodesic metrics.

#### Methods:
- `vectorize_local(flood_mask_array: np.ndarray, transform: Affine, crs: str) -> gpd.GeoDataFrame`: Vectorizes local numpy array into GeoDataFrame with area and perimeter metrics.
- `save_geojson(gdf: gpd.GeoDataFrame, output_path: Optional[str] = None) -> str`: Exports GeoDataFrame to GeoJSON.
- `save_shapefile(gdf: gpd.GeoDataFrame, output_path: Optional[str] = None) -> str`: Exports GeoDataFrame to ESRI Shapefile.
- `compute_statistics(gdf: gpd.GeoDataFrame, threshold_value: float, output_path: Optional[str] = None) -> Dict[str, Any]`: Computes comprehensive summary and per-polygon statistics and writes `statistics.json`.

---

## 4. `FloodDetectionEngine.export`

### `GeoTIFFExporter`
Exports Earth Engine images or local arrays to GeoTIFF.

#### Methods:
- `download_ee_image(image: ee.Image, region: ee.Geometry, output_path: str) -> Tuple[np.ndarray, dict]`: Downloads EE image to local GeoTIFF and returns array and affine metadata.
- `export_to_drive(image: ee.Image, description: str, region: ee.Geometry) -> ee.batch.Task`: Submits background export task to Google Drive.
- `write_array_geotiff(array: np.ndarray, output_path: str, transform: Affine, crs: str, dtype: str, nodata: float) -> str`: Writes 2D numpy array to compressed GeoTIFF.

### `GeoJSONExporter`
Exports `ee.FeatureCollection` to GeoJSON locally or to Google Drive.

---

## 5. `FloodDetectionEngine.utils`

### `get_logger(name: str) -> logging.Logger`
Returns a thread-safe structured logger with console and file handlers.

### `LogTimer(label: str, logger: logging.Logger)`
Context manager measuring wall-clock execution time of code blocks.

### `calculate_polygon_area_km2(geojson_geometry: dict) -> float`
Calculates geodesic area in $\text{km}^2$ using automatic UTM projection.

### `calculate_polygon_perimeter_km(geojson_geometry: dict) -> float`
Calculates geodesic perimeter in $\text{km}$ using automatic UTM projection.

---

## 6. `FloodDetectionEngine.pipeline`

### `FloodDetectionPipeline`
Main orchestrator that executes all 10 stages end-to-end.

#### Methods:
- `run() -> PipelineResult`: Runs full pipeline and returns paths to all output artefacts and metrics.

### `PipelineResult`
Dataclass containing:
- `flood_mask_path : str`
- `geojson_path : str`
- `shapefile_path : str`
- `preview_path : str`
- `statistics_path : str`
- `statistics : dict`
- `otsu_threshold : float`
- `total_flooded_area_km2 : float`
- `num_polygons : int`
- `elapsed_seconds : float`
