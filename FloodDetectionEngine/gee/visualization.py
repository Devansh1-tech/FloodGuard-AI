"""
visualization.py — Professional SAR & Flood Map Visualization
==============================================================

Provides server-side visualization parameter sets and local
Matplotlib rendering functions for producing publication-quality
maps of:

- Before / after SAR imagery
- Change-detection difference images
- Binary flood masks
- Flood polygons overlaid on imagery

All ``get_*_vis_params`` methods return dictionaries suitable for
``ee.Image.getMapId()`` or ``geemap.Map.addLayer()``.

The local ``render_*`` functions produce Matplotlib figures that
can be saved as PNG for reports / dashboards.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional, Tuple

import ee
import numpy as np

from FloodDetectionEngine.config.config import EngineConfig
from FloodDetectionEngine.utils.logger import get_logger

logger = get_logger(__name__)


class Visualizer:
    """
    Visualization factory bound to an :class:`EngineConfig`.

    Parameters
    ----------
    config : EngineConfig
        Engine configuration (palette, min/max, zoom, center).
    """

    def __init__(self, config: EngineConfig) -> None:
        self.config = config

    # ── EE vis-param dictionaries ───────────────────────────────────────

    def get_sar_vis_params(self) -> Dict[str, Any]:
        """
        Visualization parameters for single-date SAR imagery (dB).

        Returns
        -------
        dict
            ``{"min": ..., "max": ..., "palette": ["black", "white"]}``.
        """
        return {
            "min": self.config.vis_before_after_min,
            "max": self.config.vis_before_after_max,
            "palette": ["000000", "FFFFFF"],
        }

    def get_difference_vis_params(self) -> Dict[str, Any]:
        """
        Visualization parameters for the change-detection difference image.

        Uses a diverging blue → white → red palette:
        - **Blue** = backscatter decrease (potential flooding)
        - **White** = no change
        - **Red** = backscatter increase

        Returns
        -------
        dict
            EE-compatible vis params.
        """
        return {
            "min": self.config.vis_difference_min,
            "max": self.config.vis_difference_max,
            "palette": self.config.vis_palette_difference,
        }

    def get_flood_mask_vis_params(self) -> Dict[str, Any]:
        """
        Visualization parameters for the binary flood mask.

        Returns
        -------
        dict
            ``0`` → transparent/white, ``1`` → flood colour.
        """
        # Strip '#' for EE palettes
        flood_hex = self.config.vis_flood_color.lstrip("#")
        no_flood_hex = self.config.vis_no_flood_color.lstrip("#")
        return {
            "min": 0,
            "max": 1,
            "palette": [no_flood_hex, flood_hex],
        }

    # ── Local Matplotlib rendering ──────────────────────────────────────

    def render_flood_preview(
        self,
        before_array: np.ndarray,
        after_array: np.ndarray,
        difference_array: np.ndarray,
        flood_mask_array: np.ndarray,
        output_path: str,
        dpi: int = 200,
    ) -> str:
        """
        Render a 2 × 2 panel figure showing the full detection pipeline.

        Layout::

            ┌──────────────┬──────────────┐
            │  Before SAR  │  After SAR   │
            ├──────────────┼──────────────┤
            │  Difference  │  Flood Mask  │
            └──────────────┴──────────────┘

        Parameters
        ----------
        before_array, after_array : np.ndarray
            2-D arrays of SAR backscatter (dB).
        difference_array : np.ndarray
            2-D change-detection image.
        flood_mask_array : np.ndarray
            2-D binary mask (0 / 1).
        output_path : str
            Where to save the PNG.
        dpi : int
            Resolution.

        Returns
        -------
        str
            Path to the saved PNG.
        """
        import matplotlib.pyplot as plt
        from matplotlib.colors import LinearSegmentedColormap

        fig, axes = plt.subplots(2, 2, figsize=(14, 12))
        fig.suptitle("FloodGuard-AI — Flood Detection Results", fontsize=16, fontweight="bold")

        # Panel 1: Before
        ax = axes[0, 0]
        im = ax.imshow(
            before_array,
            cmap="gray",
            vmin=self.config.vis_before_after_min,
            vmax=self.config.vis_before_after_max,
        )
        ax.set_title("Before Event (Sentinel-1 VV)", fontsize=12)
        ax.axis("off")
        plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label="dB")

        # Panel 2: After
        ax = axes[0, 1]
        im = ax.imshow(
            after_array,
            cmap="gray",
            vmin=self.config.vis_before_after_min,
            vmax=self.config.vis_before_after_max,
        )
        ax.set_title("After Event (Sentinel-1 VV)", fontsize=12)
        ax.axis("off")
        plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label="dB")

        # Panel 3: Difference
        ax = axes[1, 0]
        # Build diverging colormap from config palette
        palette = self.config.vis_palette_difference
        colors = [
            tuple(int(c.lstrip("#")[i:i + 2], 16) / 255 for i in (0, 2, 4))
            for c in palette
        ]
        div_cmap = LinearSegmentedColormap.from_list("div", colors, N=256)
        im = ax.imshow(
            difference_array,
            cmap=div_cmap,
            vmin=self.config.vis_difference_min,
            vmax=self.config.vis_difference_max,
        )
        ax.set_title("Change Detection", fontsize=12)
        ax.axis("off")
        plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label="Δ dB")

        # Panel 4: Flood mask
        ax = axes[1, 1]
        flood_cmap = LinearSegmentedColormap.from_list(
            "flood",
            [(1, 1, 1, 0), (0, 0, 1, 0.8)],
            N=2,
        )
        ax.imshow(
            flood_mask_array,
            cmap=flood_cmap,
            vmin=0,
            vmax=1,
            interpolation="nearest",
        )
        ax.set_title("Flood Extent Mask", fontsize=12)
        ax.axis("off")

        plt.tight_layout(rect=[0, 0, 1, 0.96])
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
        fig.savefig(output_path, dpi=dpi, bbox_inches="tight", facecolor="white")
        plt.close(fig)
        logger.info("Flood preview saved to %s", output_path)
        return output_path

    def render_flood_polygons_on_image(
        self,
        background_array: np.ndarray,
        polygons_gdf: Any,
        output_path: str,
        title: str = "Flood Polygons Overlay",
        dpi: int = 200,
    ) -> str:
        """
        Overlay flood polygons on a SAR background image.

        Parameters
        ----------
        background_array : np.ndarray
            2-D SAR image (dB) used as background.
        polygons_gdf : geopandas.GeoDataFrame
            Flood polygons to overlay.
        output_path : str
            Destination PNG path.
        title : str
            Figure title.
        dpi : int
            Resolution.

        Returns
        -------
        str
            Path to the saved PNG.
        """
        import matplotlib.pyplot as plt
        from matplotlib.patches import Patch

        fig, ax = plt.subplots(1, 1, figsize=(12, 10))
        ax.imshow(
            background_array,
            cmap="gray",
            vmin=self.config.vis_before_after_min,
            vmax=self.config.vis_before_after_max,
        )

        if polygons_gdf is not None and not polygons_gdf.empty:
            polygons_gdf.plot(
                ax=ax,
                facecolor=(0, 0, 1, 0.35),
                edgecolor="blue",
                linewidth=0.8,
            )

        ax.set_title(title, fontsize=14, fontweight="bold")
        ax.axis("off")
        legend_elements = [
            Patch(facecolor=(0, 0, 1, 0.35), edgecolor="blue", label="Flooded Area"),
        ]
        ax.legend(handles=legend_elements, loc="lower right", fontsize=10)

        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
        fig.savefig(output_path, dpi=dpi, bbox_inches="tight", facecolor="white")
        plt.close(fig)
        logger.info("Polygon overlay saved to %s", output_path)
        return output_path
