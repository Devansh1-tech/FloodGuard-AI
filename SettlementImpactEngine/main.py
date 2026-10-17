"""
main.py — SettlementImpactEngine CLI Entry Point
================================================

Command-line interface to execute the Settlement Impact Assessment Engine.

Usage
-----
::
    # Standard run using auto-discovered Stage 2 flood outputs or built-in mock:
    python SettlementImpactEngine/main.py

    # Custom flood polygon and output directory:
    python SettlementImpactEngine/main.py --flood-polygon outputs/FloodPolygon.geojson --output-dir outputs/impact

    # Fast batch execution without cartographic rendering:
    python SettlementImpactEngine/main.py --no-viz
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Remove the script directory from sys.path to prevent shadowing Python's standard library 'statistics'
_script_dir = str(Path(__file__).resolve().parent)
while _script_dir in sys.path:
    sys.path.remove(_script_dir)

# Ensure project root is in sys.path
_project_root = str(Path(__file__).resolve().parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.pipeline import SettlementImpactPipeline, ImpactPipelineResult
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger("SettlementImpactCLI")


def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        prog="SettlementImpactEngine",
        description="FloodGuard AI — Stage 3 Settlement Impact Assessment & Disaster Intelligence Engine",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    parser.add_argument(
        "--flood-polygon",
        type=str,
        default=None,
        help="Path to input FloodPolygon.geojson (or SHP). If omitted, auto-discovers from outputs/.",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="outputs",
        help="Target directory for all impact GeoJSONs, CSVs, reports, and maps.",
    )
    parser.add_argument(
        "--aoi",
        type=str,
        default="nepal_terai_koshi",
        help="Study area preset name (nepal_terai_koshi, nepal_terai_chitwan, etc.).",
    )
    parser.add_argument(
        "--no-viz",
        action="store_true",
        help="Disable Matplotlib cartographic map rendering for faster execution.",
    )
    parser.add_argument(
        "--no-network",
        action="store_true",
        help="Disable NetworkX road graph severance evaluation.",
    )

    return parser.parse_args()


def print_executive_summary(result: ImpactPipelineResult, output_dir: str) -> None:
    """Print an executive disaster intelligence briefing to the terminal."""
    print("\n" + "=" * 76)
    print("       FLOODGUARD AI — SETTLEMENT IMPACT ASSESSMENT EXECUTIVE BRIEF")
    print("=" * 76)
    print(f" Total Active Inundation Area : {result.total_flood_area_km2:.2f} km²")
    print(f" Total Affected Population    : {result.affected_population:,} persons")
    print(f" Submerged Building Structures: {result.flooded_buildings_count:,} footprints")
    print(f" Submerged Road Corridors     : {result.flooded_roads_km:.2f} km")
    print(f" Critical Facilities Flooded  : {result.flooded_facilities_count} lifelines")
    print(f" Affected Administrative Units: {result.affected_districts_count} District(s), {result.affected_municipalities_count} Municipality(ies)")
    print(f" Disconnected Settlements     : {result.isolated_settlements_count} isolated village(s)")
    print(f" Pipeline Execution Time      : {result.elapsed_seconds:.2f} seconds")
    print("-" * 76)
    print(" GENERATED GEOJSON LAYERS:")
    for key, path in result.vector_paths.items():
        print(f"   • {key.capitalize():<18}: {path}")
    print("\n GENERATED STATISTICAL REPORTS & TABLES:")
    for key, path in result.report_paths.items():
        print(f"   • {key.capitalize():<18}: {path}")
    for key, path in result.table_paths.items():
        print(f"   • {key.capitalize():<18}: {path}")
    if result.map_paths:
        print("\n GENERATED CARTOGRAPHIC MAPS:")
        for key, path in result.map_paths.items():
            print(f"   • {key.capitalize():<18}: {path}")
    print("=" * 76 + "\n")


def main() -> int:
    """Main CLI execution flow."""
    args = parse_arguments()

    config = ImpactConfig(
        flood_polygon_path=args.flood_polygon,
        output_dir=args.output_dir,
        aoi_name=args.aoi,
        generate_visualizations=not args.no_viz,
        enable_network_analysis=not args.no_network,
    )

    try:
        pipeline = SettlementImpactPipeline(config)
        result = pipeline.run()
        print_executive_summary(result, args.output_dir)
        return 0
    except Exception as exc:
        logger.exception("SettlementImpactPipeline execution terminated with error: %s", exc)
        return 1


if __name__ == "__main__":
    sys.exit(main())
