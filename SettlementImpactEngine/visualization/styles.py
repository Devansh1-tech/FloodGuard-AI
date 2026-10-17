"""
styles.py — Publication Cartography Color Palettes & Map Elements
=================================================================

Curated cartographic styles, symbology tokens, and standard map decorations
(North Arrow, Scale Bar, Agency Header) for Disaster Management products.
"""

from __future__ import annotations

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.axes import Axes


class CartoStyle:
    """Design tokens and palettes for high-impact humanitarian cartography."""

    # Primary Layers
    FLOOD_FILL = "#0284c7"         # Ocean blue
    FLOOD_EDGE = "#0369a1"
    FLOOD_ALPHA = 0.65

    ADMIN_BOUNDARY = "#475569"     # Slate gray
    DISTRICT_BOUNDARY = "#0f172a"  # Dark navy
    MUNICIPALITY_FILL = "#f8fafc"

    # Roads
    ROAD_BASELINE = "#94a3b8"      # Light slate
    ROAD_FLOODED = "#dc2626"       # Bright crimson alert
    ROAD_HIGHWAY = "#ea580c"       # Orange arterial
    ROAD_BRIDGE = "#7c3aed"        # Violet bridge

    # Critical Infrastructure
    FACILITY_OPERATIONAL = "#059669" # Emerald green
    FACILITY_FLOODED = "#b91c1c"     # Dark red warning
    FACILITY_ENCROACHED = "#d97706"  # Amber warning

    # Population
    POP_CMAP = "YlOrRd"

    # Canvas & Typography
    BACKGROUND_COLOR = "#ffffff"
    NEATLINE_COLOR = "#cbd5e1"
    FONT_FAMILY = "sans-serif"
    TITLE_COLOR = "#0f172a"
    SUBTITLE_COLOR = "#64748b"


def draw_north_arrow(ax: Axes, x: float = 0.95, y: float = 0.90, arrow_size: float = 0.05) -> None:
    """
    Render a clean cartographic North Arrow in axes coordinates.
    """
    ax.annotate(
        "N",
        xy=(x, y),
        xytext=(x, y - arrow_size),
        arrowprops=dict(facecolor="#0f172a", edgecolor="#0f172a", width=2, headwidth=8),
        ha="center",
        va="center",
        fontsize=12,
        fontweight="bold",
        color="#0f172a",
        xycoords="axes fraction",
    )


def draw_scale_bar(ax: Axes, length_km: float = 10.0, location: tuple[float, float] = (0.05, 0.05)) -> None:
    """
    Draw a metric scale indicator bar on the cartographic canvas.
    """
    # 10 km in degrees at ~26.5° latitude is approx 0.092 degrees lon
    deg_length = length_km / 111.0 / 0.895
    x0, y0 = location

    # Convert axes fraction to data coordinates
    xlim = ax.get_xlim()
    ylim = ax.get_ylim()
    data_x0 = xlim[0] + x0 * (xlim[1] - xlim[0])
    data_y0 = ylim[0] + y0 * (ylim[1] - ylim[0])

    ax.plot([data_x0, data_x0 + deg_length], [data_y0, data_y0], color="#0f172a", linewidth=3)
    ax.text(
        data_x0 + deg_length / 2.0,
        data_y0 + (ylim[1] - ylim[0]) * 0.015,
        f"{int(length_km)} km",
        ha="center",
        va="bottom",
        fontsize=9,
        fontweight="bold",
        color="#0f172a",
    )
