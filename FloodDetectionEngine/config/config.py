"""
config.py — Centralized Engine Configuration
=============================================

Single source of truth for every tuneable parameter in the
FloodDetectionEngine.  All modules import from here rather than
defining their own constants, ensuring consistency and making it
trivial to adjust parameters for new study areas or events.

Sections
--------
1. AOI Presets          – predefined study areas (Nepal Terai, etc.)
2. Date Windows         – before / after event date ranges
3. Sentinel-1 Filters   – instrument mode, orbit, polarization, resolution
4. Preprocessing        – speckle filter, border noise, normalisation
5. Change Detection     – method selection, log-ratio params
6. Thresholding         – Otsu histogram bins
7. Morphology           – kernel sizes, connected-component area thresholds
8. Visualization        – colour palettes, map parameters
9. Export               – output paths, formats, CRS
10. Logging             – log level, log file path
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# 1. AOI Presets
# ---------------------------------------------------------------------------

AOI_PRESETS: Dict[str, List[List[float]]] = {
    # Nepal Terai – Koshi River flood-prone belt
    "nepal_terai_koshi": [
        [86.50, 26.40],
        [87.10, 26.40],
        [87.10, 26.80],
        [86.50, 26.80],
        [86.50, 26.40],
    ],
    # Nepal Terai – Narayani / Chitwan
    "nepal_terai_chitwan": [
        [83.90, 27.30],
        [84.60, 27.30],
        [84.60, 27.70],
        [83.90, 27.70],
        [83.90, 27.30],
    ],
    # Nepal Terai – full belt (broad coverage)
    "nepal_terai_full": [
        [80.00, 26.30],
        [88.20, 26.30],
        [88.20, 27.50],
        [80.00, 27.50],
        [80.00, 26.30],
    ],
}


# ---------------------------------------------------------------------------
# 2–11. Engine Configuration Dataclass
# ---------------------------------------------------------------------------

@dataclass
class EngineConfig:
    """
    Master configuration object consumed by every module.

    Attributes
    ----------
    aoi_name : str
        Key into ``AOI_PRESETS`` **or** ``"custom"`` when ``aoi_coords``
        is supplied directly.
    aoi_coords : list[list[float]] | None
        Explicit polygon coordinates ``[[lon, lat], ...]``.  Takes
        precedence over ``aoi_name`` when not ``None``.
    before_start, before_end : str
        ISO-8601 date strings bounding the *pre-event* image window.
    after_start, after_end : str
        ISO-8601 date strings bounding the *post-event* image window.

    Notes
    -----
    All spatial coordinates follow the **[longitude, latitude]** convention
    used by GeoJSON and Google Earth Engine.
    """

    # -- AOI ------------------------------------------------------------------
    aoi_name: str = "nepal_terai_koshi"
    aoi_coords: Optional[List[List[float]]] = None

    # -- Date windows ---------------------------------------------------------
    before_start: str = "2024-06-01"
    before_end: str = "2024-06-30"
    after_start: str = "2024-09-15"
    after_end: str = "2024-10-15"

    # -- Sentinel-1 filters ---------------------------------------------------
    instrument_mode: str = "IW"
    orbit_pass: str = "DESCENDING"
    polarization: str = "VV"
    resolution_meters: int = 10

    # -- Preprocessing --------------------------------------------------------
    apply_border_noise_removal: bool = True
    border_noise_threshold_db: float = -30.0
    apply_speckle_filter: bool = True
    speckle_filter_type: str = "refined_lee"   # "refined_lee" | "lee" | "gamma_map"
    lee_filter_window_size: int = 7
    lee_filter_enl: float = 4.4                # equivalent number of looks for S1 IW GRD
    apply_radiometric_normalisation: bool = True

    # -- Change detection -----------------------------------------------------
    change_method: str = "log_ratio"           # "difference" | "ratio" | "log_ratio"
    log_ratio_scale: float = 10.0              # multiplier for log-ratio (dB-like)

    # -- Thresholding ---------------------------------------------------------
    otsu_histogram_bins: int = 256
    otsu_histogram_min: float = -30.0
    otsu_histogram_max: float = 10.0

    # -- Morphology -----------------------------------------------------------
    morphology_opening_radius: int = 1         # pixels
    morphology_closing_radius: int = 2         # pixels
    min_mapping_unit_pixels: int = 8           # connected components smaller than this are removed
    fill_holes: bool = True

    # -- Visualization --------------------------------------------------------
    vis_before_after_min: float = -25.0
    vis_before_after_max: float = 0.0
    vis_difference_min: float = -10.0
    vis_difference_max: float = 10.0
    vis_palette_difference: List[str] = field(
        default_factory=lambda: [
            "#2166AC", "#4393C3", "#92C5DE", "#D1E5F0",
            "#F7F7F7",
            "#FDDBC7", "#F4A582", "#D6604D", "#B2182B",
        ]
    )
    vis_flood_color: str = "#0000FF"
    vis_no_flood_color: str = "#FFFFFF"
    map_zoom_level: int = 11
    map_center_lat: float = 26.60
    map_center_lon: float = 86.80

    # -- Export ---------------------------------------------------------------
    output_dir: str = "outputs"
    export_crs: str = "EPSG:4326"
    export_scale: int = 10                     # metres per pixel
    export_flood_mask_filename: str = "FloodMask.tif"
    export_flood_polygon_geojson: str = "FloodPolygon.geojson"
    export_flood_polygon_shp: str = "FloodPolygon.shp"
    export_preview_filename: str = "FloodPreview.png"
    export_statistics_filename: str = "statistics.json"
    gee_export_to_drive: bool = False
    gee_drive_folder: str = "FloodGuardAI_Exports"

    # -- GEE project ----------------------------------------------------------
    gee_project: Optional[str] = None          # e.g. "ee-floodguardai"
    gee_service_account_key: Optional[str] = None

    # -- Logging --------------------------------------------------------------
    log_level: str = "INFO"                    # DEBUG | INFO | WARNING | ERROR
    log_file: Optional[str] = "floodguard.log"

    # --------------------------------------------------------------------- #
    # Derived helpers
    # --------------------------------------------------------------------- #

    def get_aoi_coordinates(self) -> List[List[float]]:
        """
        Resolve AOI coordinates from either explicit coords or a preset.

        Returns
        -------
        list[list[float]]
            Polygon ring as ``[[lon, lat], ...]``.

        Raises
        ------
        ValueError
            If ``aoi_name`` is not found in ``AOI_PRESETS`` and no
            explicit ``aoi_coords`` were provided.
        """
        if self.aoi_coords is not None:
            return self.aoi_coords
        if self.aoi_name in AOI_PRESETS:
            return AOI_PRESETS[self.aoi_name]
        raise ValueError(
            f"AOI preset '{self.aoi_name}' not found. "
            f"Available presets: {list(AOI_PRESETS.keys())}. "
            f"Alternatively, provide explicit coordinates via 'aoi_coords'."
        )

    def get_output_path(self, filename: str) -> str:
        """
        Build an absolute path inside the configured output directory.

        Parameters
        ----------
        filename : str
            The file basename (e.g. ``"FloodMask.tif"``).

        Returns
        -------
        str
            Full path, e.g. ``"outputs/FloodMask.tif"``.
        """
        os.makedirs(self.output_dir, exist_ok=True)
        return os.path.join(self.output_dir, filename)

    def to_dict(self) -> Dict:
        """Serialise the config to a plain dictionary (for JSON export)."""
        from dataclasses import asdict
        return asdict(self)
