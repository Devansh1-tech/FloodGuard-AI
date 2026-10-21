"""
main.py — FloodGuard AI Master CLI Orchestrator
==============================================

Single CLI command to execute the entire FloodGuard AI disaster intelligence workflow.

Usage
-----
::
    # Default Koshi Terai monsoon flood assessment:
    python main.py

    # Custom AOI and dates:
    python main.py --aoi nepal_terai_koshi --before-start 2024-06-01 --before-end 2024-06-30 --after-start 2024-09-15 --after-end 2024-10-15

    # Specify custom output root and project name:
    python main.py --output-dir outputs --project-name "Nepal NDRRMA Flood Response"
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load environment configuration
load_dotenv()

# Ensure root directory is on sys.path
_root = str(Path(__file__).resolve().parent)
if _root not in sys.path:
    sys.path.insert(0, _root)

from pipeline import run_pipeline, PipelineResult, PipelineStage


def parse_arguments() -> argparse.Namespace:
    """Parse unified pipeline command-line arguments."""
    parser = argparse.ArgumentParser(
        prog="FloodGuard AI",
        description="Unified Disaster Intelligence Orchestrator — Sentinel-1 SAR Flood Detection & Settlement Impact",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    parser.add_argument(
        "--aoi",
        type=str,
        default="nepal_terai_koshi",
        help="Area of Interest preset (nepal_terai_koshi, nepal_terai_chitwan, nepal_terai_full).",
    )
    parser.add_argument(
        "--before-start",
        type=str,
        default="2024-06-01",
        help="Pre-flood reference window start date (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--before-end",
        type=str,
        default="2024-06-30",
        help="Pre-flood reference window end date (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--after-start",
        type=str,
        default="2024-09-15",
        help="Post-flood crisis window start date (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--after-end",
        type=str,
        default="2024-10-15",
        help="Post-flood crisis window end date (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--sensor", "--mode",
        dest="sensor",
        type=str,
        default="optical",
        choices=["optical", "sar", "fusion"],
        help="Primary Earth Observation sensor mode (optical: Sentinel-2/Landsat spectral indices, sar: Sentinel-1 backscatter).",
    )
    parser.add_argument(
        "--index",
        type=str,
        default="mndwi",
        choices=["mndwi", "ndwi", "aweinsh", "ensemble"],
        help="Spectral water index for optical flood detection.",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="outputs",
        help="Root output directory. Each run creates an isolated run_YYYYMMDD_HHMMSS/ subdirectory.",
    )
    parser.add_argument(
        "--project-name",
        type=str,
        default="FloodGuard AI",
        help="Human-readable project title for reports and metadata.",
    )

    return parser.parse_args()


def print_cli_summary(result: PipelineResult) -> None:
    """Print an executive briefing to stdout."""
    overview = result.impact_statistics.get("disaster_overview", {})
    settlement_report = result.impact_statistics.get("settlement_impact", {})
    flag_breakdown = settlement_report.get("impact_flag_breakdown", {})
    flood_stats = getattr(result, "flood_statistics", {})
    flood_files = result.metadata.get("generated_files", {}).get("flood", {})
    acc_path = flood_files.get("accuracy_validation_json", "")
    flood_raster_path = flood_files.get("flood_mask_geotiff", "N/A")

    # Load accuracy metrics if available
    acc_data = {}
    if acc_path and Path(acc_path).exists():
        try:
            with open(acc_path, "r", encoding="utf-8") as f:
                acc_data = json.load(f).get("metrics", {})
        except Exception:
            pass

    print("\n" + "=" * 78)
    print("        FLOODGUARD AI — UNIFIED DISASTER INTELLIGENCE BRIEFING")
    print("        Problem Statement 01: Optical Satellite Flood Detection")
    print("=" * 78)
    print(f" Execution ID       : {result.execution_id}")
    print(f" Execution Status   : {result.status}")
    print(f" Execution Duration : {result.elapsed_seconds:.2f} seconds")
    print(f" Area of Interest   : {result.aoi}")
    print(f" Sensor & Index     : {getattr(result, 'sensor_type', 'OPTICAL').upper()} ({getattr(result, 'spectral_index', 'MNDWI').upper()})")
    print("-" * 78)
    print(f" Active Inundation  : {overview.get('total_flooded_area_km2', flood_stats.get('total_flooded_area_km2', 0)):.2f} km²")
    print(f" Affected Population: {overview.get('affected_population_total', 0):,} people")
    print(f" Displaced Estimates: ~{overview.get('estimated_displaced_households', 0):,} households")
    print(f" Submerged Buildings: {overview.get('flooded_buildings_count', 0):,} footprints")
    print(f" Severed Road Length: {overview.get('flooded_road_length_km', 0):.2f} km ({overview.get('flooded_bridges_count', 0)} bridges)")
    print(f" Submerged Lifelines: {overview.get('flooded_facilities_count', 0)} critical facilities")
    print(f" Administrative Units: {overview.get('affected_districts_count', 0)} District(s), {overview.get('affected_municipalities_count', 0)} Municipality(ies)")
    
    if flag_breakdown:
        print("-" * 78)
        print(" AFFECTED SETTLEMENTS TAXONOMY (4-TIER RUBRIC):")
        print(f"  • CRITICAL_INUNDATED  : {flag_breakdown.get('CRITICAL_INUNDATED', 0)} settlement(s) (footprint >15% flooded / severe)")
        print(f"  • PARTIALLY_SUBMERGED : {flag_breakdown.get('PARTIALLY_SUBMERGED', 0)} settlement(s) (1-15% perimeter flooded)")
        print(f"  • ISOLATED_CUTOFF     : {flag_breakdown.get('ISOLATED_CUTOFF', 0)} settlement(s) (dry, but road access severed)")
        print(f"  • SECURE_HIGH_GROUND  : {flag_breakdown.get('SECURE_HIGH_GROUND', 0)} settlement(s) (dry, secure refuge hubs)")

    if acc_data:
        print("-" * 78)
        print(" GROUND TRUTH VALIDATION (RUBRIC EVALUATION CRITERIA):")
        print(f"  • IoU (Jaccard Index) : {acc_data.get('iou_jaccard', 0.0):.4f}")
        print(f"  • F1-Score (Dice)     : {acc_data.get('f1_score_dice', 0.0):.4f}")
        print(f"  • Overall Accuracy    : {acc_data.get('overall_accuracy', 0.0) * 100:.2f}%")
        print(f"  • Precision / Recall  : {acc_data.get('precision', 0.0):.4f} / {acc_data.get('recall', 0.0):.4f}")
        print(f"  • Reference Baseline  : {acc_data.get('reference_source', 'Cloud-free ground truth')}")

    print("-" * 78)
    print(" PRIMARY RUN DELIVERABLES:")
    print(f"  • Run Directory   : {Path(result.metadata_path).parent.parent}")
    print(f"  • Audit Metadata  : {result.metadata_path}")
    print(f"  • Execution Log   : {result.log_path}")
    print(f"  • Situation Report: {result.report_paths.get('impact_report', 'N/A')}")
    print(f"  • Settlement Rep. : {result.report_paths.get('settlement_report', 'N/A')}")
    print(f"  • Settlement CSV  : {result.csv_paths.get('settlement_report_csv', 'N/A')}")
    print(f"  • Flood Raster    : {flood_raster_path}")
    print(f"  • Flood Polygon   : {result.geojson_paths.get('flood_polygon', 'N/A')}")
    print(f"  • Accuracy Report : {acc_path or 'N/A'}")
    print(f"  • Infrastructure  : {result.csv_paths.get('infrastructure_csv', 'N/A')}")
    print("\n CARTOGRAPHIC MAPS:")
    for map_name, map_path in result.map_paths.items():
        print(f"  • {map_name.replace('_', ' ').title():<20}: {map_path}")
    print("=" * 78 + "\n")


def main() -> int:
    """CLI Entry Point."""
    args = parse_arguments()

    def console_progress(evt):
        print(f"[{evt.percentage:3d}%] [{evt.stage.value:<18}] {evt.message}")

    try:
        result = run_pipeline(
            aoi=args.aoi,
            before_date=(args.before_start, args.before_end),
            after_date=(args.after_start, args.after_end),
            sensor=args.sensor,
            index=args.index,
            output_dir=args.output_dir,
            project_name=args.project_name,
            progress_callback=console_progress,
        )
        print_cli_summary(result)
        return 0 if result.is_success() else 1
    except Exception as exc:
        print(f"\n[FATAL ERROR] Pipeline failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
