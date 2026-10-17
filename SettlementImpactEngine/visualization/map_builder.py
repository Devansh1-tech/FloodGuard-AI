"""
map_builder.py — Cartographic Map Generation Engine
===================================================

Module 7 of Stage 3: Produces publication-grade, agency-standard situational
maps for humanitarian relief and emergency command centers.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, Any, Optional
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.lines import Line2D
import geopandas as gpd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.visualization.styles import CartoStyle, draw_north_arrow, draw_scale_bar
from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


class CartographicMapBuilder:
    """
    Renders publication-ready situational disaster maps.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config
        self.output_dir = Path(config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def render_all_maps(
        self,
        flood_gdf: gpd.GeoDataFrame,
        admin_gdf: gpd.GeoDataFrame,
        roads_gdf: gpd.GeoDataFrame,
        flooded_roads_gdf: gpd.GeoDataFrame,
        infra_gdf: gpd.GeoDataFrame,
        population_gdf: gpd.GeoDataFrame,
    ) -> Dict[str, str]:
        """
        Render the full 4-map humanitarian cartography suite.
        """
        with LogTimer("Rendering 4-Map Cartography Suite", logger):
            paths = {}
            paths["administrative_map"] = self.render_administrative_flood_map(flood_gdf, admin_gdf)
            paths["road_impact_map"] = self.render_road_impact_map(roads_gdf, flooded_roads_gdf, flood_gdf)
            paths["infrastructure_map"] = self.render_critical_infrastructure_map(infra_gdf, flood_gdf, admin_gdf)
            paths["population_map"] = self.render_population_exposure_map(population_gdf, flood_gdf, admin_gdf)
            return paths

    def render_administrative_flood_map(
        self,
        flood_gdf: gpd.GeoDataFrame,
        admin_gdf: gpd.GeoDataFrame,
    ) -> str:
        """
        Map 1: Broad administrative inundation overview.
        """
        out_path = str(self.output_dir / "Flood_Administrative_Map.png")
        fig, ax = plt.subplots(figsize=(10, 8), dpi=200, facecolor=CartoStyle.BACKGROUND_COLOR)

        # Baseline administrative polygons
        if admin_gdf is not None and not admin_gdf.empty:
            admin_gdf.plot(
                ax=ax,
                color=CartoStyle.MUNICIPALITY_FILL,
                edgecolor=CartoStyle.ADMIN_BOUNDARY,
                linewidth=1.2,
                alpha=0.9,
            )
            # Add municipality labels
            for _, row in admin_gdf.iterrows():
                centroid = row.geometry.centroid
                name = row.get("municipality_name", "")
                if name:
                    ax.annotate(
                        name,
                        xy=(centroid.x, centroid.y),
                        ha="center",
                        va="center",
                        fontsize=7,
                        fontweight="bold",
                        color="#334155",
                        alpha=0.75,
                    )

        # Flood Inundation Extent
        if flood_gdf is not None and not flood_gdf.empty:
            flood_gdf.plot(
                ax=ax,
                color=CartoStyle.FLOOD_FILL,
                edgecolor=CartoStyle.FLOOD_EDGE,
                linewidth=0.8,
                alpha=CartoStyle.FLOOD_ALPHA,
            )

        # Decorations
        draw_north_arrow(ax)
        draw_scale_bar(ax, length_km=10.0)

        ax.set_title(
            f"Flood Inundation & Administrative Impact — {self.config.aoi_name.upper()}\nFloodGuard AI Disaster Intelligence",
            fontsize=12,
            fontweight="bold",
            color=CartoStyle.TITLE_COLOR,
            pad=15,
        )
        ax.set_xlabel("Longitude (°E)", fontsize=9, color=CartoStyle.SUBTITLE_COLOR)
        ax.set_ylabel("Latitude (°N)", fontsize=9, color=CartoStyle.SUBTITLE_COLOR)
        ax.grid(True, linestyle="--", alpha=0.3, color="#94a3b8")

        # Legend
        legend_handles = [
            mpatches.Patch(facecolor=CartoStyle.FLOOD_FILL, edgecolor=CartoStyle.FLOOD_EDGE, alpha=CartoStyle.FLOOD_ALPHA, label="Active Flood Inundation"),
            mpatches.Patch(facecolor=CartoStyle.MUNICIPALITY_FILL, edgecolor=CartoStyle.ADMIN_BOUNDARY, label="Municipal Boundary"),
        ]
        ax.legend(handles=legend_handles, loc="lower right", framealpha=0.95, fontsize=8)

        plt.tight_layout()
        fig.savefig(out_path, dpi=200, bbox_inches="tight")
        plt.close(fig)
        logger.info("Administrative map rendered: %s", out_path)
        return out_path

    def render_road_impact_map(
        self,
        roads_gdf: gpd.GeoDataFrame,
        flooded_roads_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
    ) -> str:
        """
        Map 2: Transportation network severance & flooded road segments.
        """
        out_path = str(self.output_dir / "Road_Impact_Map.png")
        fig, ax = plt.subplots(figsize=(10, 8), dpi=200, facecolor=CartoStyle.BACKGROUND_COLOR)

        # Flood backdrop
        if flood_gdf is not None and not flood_gdf.empty:
            flood_gdf.plot(ax=ax, color="#bae6fd", edgecolor="#7dd3fc", alpha=0.5, linewidth=0.5)

        # Baseline roads (slate gray)
        if roads_gdf is not None and not roads_gdf.empty:
            roads_gdf.plot(ax=ax, color=CartoStyle.ROAD_BASELINE, linewidth=1.0, alpha=0.8)

        # Flooded road segments (crimson alert)
        if flooded_roads_gdf is not None and not flooded_roads_gdf.empty:
            flooded_roads_gdf.plot(ax=ax, color=CartoStyle.ROAD_FLOODED, linewidth=2.5, alpha=0.95)

        draw_north_arrow(ax)
        draw_scale_bar(ax, length_km=10.0)

        ax.set_title(
            f"Transportation Network Severance & Submerged Corridors\n{self.config.aoi_name.upper()} — Logistics Advisory",
            fontsize=12,
            fontweight="bold",
            color=CartoStyle.TITLE_COLOR,
            pad=15,
        )
        ax.set_xlabel("Longitude (°E)", fontsize=9, color=CartoStyle.SUBTITLE_COLOR)
        ax.set_ylabel("Latitude (°N)", fontsize=9, color=CartoStyle.SUBTITLE_COLOR)
        ax.grid(True, linestyle="--", alpha=0.3, color="#94a3b8")

        legend_handles = [
            Line2D([0], [0], color=CartoStyle.ROAD_FLOODED, lw=2.5, label="Severed / Flooded Road Segment"),
            Line2D([0], [0], color=CartoStyle.ROAD_BASELINE, lw=1.0, label="Operational Road Network"),
            mpatches.Patch(facecolor="#bae6fd", edgecolor="#7dd3fc", alpha=0.5, label="Flood Extent"),
        ]
        ax.legend(handles=legend_handles, loc="lower right", framealpha=0.95, fontsize=8)

        plt.tight_layout()
        fig.savefig(out_path, dpi=200, bbox_inches="tight")
        plt.close(fig)
        logger.info("Road impact map rendered: %s", out_path)
        return out_path

    def render_critical_infrastructure_map(
        self,
        infra_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
        admin_gdf: Optional[gpd.GeoDataFrame] = None,
    ) -> str:
        """
        Map 3: Lifeline infrastructure status (Operational vs Submerged).
        """
        out_path = str(self.output_dir / "Critical_Infrastructure_Map.png")
        fig, ax = plt.subplots(figsize=(10, 8), dpi=200, facecolor=CartoStyle.BACKGROUND_COLOR)

        if admin_gdf is not None and not admin_gdf.empty:
            admin_gdf.plot(ax=ax, color="#f8fafc", edgecolor="#cbd5e1", linewidth=0.8)

        if flood_gdf is not None and not flood_gdf.empty:
            flood_gdf.plot(ax=ax, color=CartoStyle.FLOOD_FILL, edgecolor=CartoStyle.FLOOD_EDGE, alpha=0.4)

        if infra_gdf is not None and not infra_gdf.empty:
            # Operational facilities (green markers)
            op = infra_gdf[~infra_gdf.get("is_flooded", False)]
            if not op.empty:
                op.plot(ax=ax, color=CartoStyle.FACILITY_OPERATIONAL, marker="o", markersize=45, edgecolor="white", lw=1.0)

            # Flooded facilities (red warning markers)
            fl = infra_gdf[infra_gdf.get("is_flooded", False)]
            if not fl.empty:
                fl.plot(ax=ax, color=CartoStyle.FACILITY_FLOODED, marker="X", markersize=80, edgecolor="white", lw=1.5)

            # Labels for key facilities
            for _, r in infra_gdf.iterrows():
                pt = r.geometry
                name = r.get("facility_name", "")
                if r.get("is_flooded", False) and name:
                    ax.annotate(
                        f"! {name}",
                        xy=(pt.x, pt.y),
                        xytext=(5, 5),
                        textcoords="offset points",
                        fontsize=7,
                        fontweight="bold",
                        color=CartoStyle.FACILITY_FLOODED,
                    )

        draw_north_arrow(ax)
        draw_scale_bar(ax, length_km=10.0)

        ax.set_title(
            f"Critical Infrastructure & Lifeline Impact Assessment\nHealth, Education, Security & Emergency Shelters",
            fontsize=12,
            fontweight="bold",
            color=CartoStyle.TITLE_COLOR,
            pad=15,
        )
        ax.set_xlabel("Longitude (°E)", fontsize=9, color=CartoStyle.SUBTITLE_COLOR)
        ax.set_ylabel("Latitude (°N)", fontsize=9, color=CartoStyle.SUBTITLE_COLOR)
        ax.grid(True, linestyle="--", alpha=0.3, color="#94a3b8")

        legend_handles = [
            Line2D([0], [0], marker="X", color="w", markerfacecolor=CartoStyle.FACILITY_FLOODED, markersize=10, label="Submerged Facility (Immediate Evacuation)"),
            Line2D([0], [0], marker="o", color="w", markerfacecolor=CartoStyle.FACILITY_OPERATIONAL, markersize=8, label="Operational Facility"),
            mpatches.Patch(facecolor=CartoStyle.FLOOD_FILL, edgecolor=CartoStyle.FLOOD_EDGE, alpha=0.4, label="Flood Extent"),
        ]
        ax.legend(handles=legend_handles, loc="lower right", framealpha=0.95, fontsize=8)

        plt.tight_layout()
        fig.savefig(out_path, dpi=200, bbox_inches="tight")
        plt.close(fig)
        logger.info("Infrastructure map rendered: %s", out_path)
        return out_path

    def render_population_exposure_map(
        self,
        population_gdf: gpd.GeoDataFrame,
        flood_gdf: gpd.GeoDataFrame,
        admin_gdf: Optional[gpd.GeoDataFrame] = None,
    ) -> str:
        """
        Map 4: Gridded population exposure choropleth / density map.
        """
        out_path = str(self.output_dir / "Population_Exposure_Heatmap.png")
        fig, ax = plt.subplots(figsize=(10, 8), dpi=200, facecolor=CartoStyle.BACKGROUND_COLOR)

        if population_gdf is not None and not population_gdf.empty:
            population_gdf.plot(
                column="population",
                cmap=CartoStyle.POP_CMAP,
                ax=ax,
                legend=True,
                legend_kwds={"label": "Population Count per Cell", "orientation": "horizontal", "shrink": 0.6, "pad": 0.08},
                alpha=0.75,
                edgecolor="none",
            )

        if admin_gdf is not None and not admin_gdf.empty:
            admin_gdf.plot(ax=ax, color="none", edgecolor="#475569", linewidth=0.8, linestyle="--")

        if flood_gdf is not None and not flood_gdf.empty:
            flood_gdf.plot(ax=ax, color="none", edgecolor="#0284c7", linewidth=1.8, label="Flood Boundary")

        draw_north_arrow(ax)
        draw_scale_bar(ax, length_km=10.0)

        ax.set_title(
            f"Human Population Density & Inundation Encroachment\nWorldPop Gridded Surface — Exposure Analytics",
            fontsize=12,
            fontweight="bold",
            color=CartoStyle.TITLE_COLOR,
            pad=15,
        )
        ax.set_xlabel("Longitude (°E)", fontsize=9, color=CartoStyle.SUBTITLE_COLOR)
        ax.set_ylabel("Latitude (°N)", fontsize=9, color=CartoStyle.SUBTITLE_COLOR)
        ax.grid(True, linestyle="--", alpha=0.3, color="#94a3b8")

        plt.tight_layout()
        fig.savefig(out_path, dpi=200, bbox_inches="tight")
        plt.close(fig)
        logger.info("Population exposure map rendered: %s", out_path)
        return out_path
