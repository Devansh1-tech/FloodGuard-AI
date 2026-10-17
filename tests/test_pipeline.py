"""
test_pipeline.py — Unified Pipeline Integration & Unit Tests
============================================================

Verifies lifecycle orchestration, Stage 2 to Stage 3 data handoff, isolated
directory structures, logging, metadata generation, and error resilience.
"""

from __future__ import annotations

import json
import shutil
import tempfile
from pathlib import Path
import pytest

from pipeline import (
    run_pipeline,
    PipelineOrchestrator,
    PipelineContext,
    PipelineResult,
    PipelineValidator,
    ProgressTracker,
    PipelineStage,
    ConfigurationError,
    ValidationError,
)


@pytest.fixture
def temp_output_dir():
    """Create a temporary root directory for pipeline test outputs."""
    tmp = tempfile.mkdtemp(prefix="floodguard_orchestrator_test_")
    yield tmp
    shutil.rmtree(tmp, ignore_errors=True)


def test_pipeline_validators_dates():
    """Verify chronological date validation."""
    # Valid dates
    PipelineValidator.validate_dates(
        before_date=("2024-06-01", "2024-06-30"),
        after_date=("2024-09-15", "2024-10-15"),
    )

    # Invalid dates: start after end
    with pytest.raises(ConfigurationError):
        PipelineValidator.validate_dates(
            before_date=("2024-06-30", "2024-06-01"),
            after_date=("2024-09-15", "2024-10-15"),
        )

    # Invalid dates: pre-window after post-window
    with pytest.raises(ConfigurationError):
        PipelineValidator.validate_dates(
            before_date=("2024-10-01", "2024-10-30"),
            after_date=("2024-09-01", "2024-09-15"),
        )


def test_pipeline_context_directory_creation(temp_output_dir):
    """Verify isolated run directory layout."""
    ctx = PipelineContext(
        project_name="Test FloodGuard",
        base_output_dir=Path(temp_output_dir),
        execution_id="test_run_001",
    )
    ctx.create_directories()

    assert ctx.run_dir.exists()
    assert ctx.flood_dir.exists()
    assert ctx.impact_dir.exists()
    assert ctx.maps_dir.exists()
    assert ctx.reports_dir.exists()
    assert ctx.logs_dir.exists()
    assert ctx.metadata_dir.exists()
    assert ctx.temp_dir.exists()


def test_progress_tracker_callbacks():
    """Verify progress events and listener notifications."""
    events = []

    def on_progress(evt):
        events.append(evt)

    tracker = ProgressTracker(callback=on_progress)
    tracker.update(PipelineStage.CONFIGURATION, "Configuring pipeline")
    tracker.update(PipelineStage.EARTH_ENGINE, "Connecting to Earth Engine")
    tracker.update(PipelineStage.COMPLETED, "Done")

    assert len(events) == 3
    assert events[0].stage == PipelineStage.CONFIGURATION
    assert events[-1].percentage == 100
    assert tracker.get_status_payload()["percentage"] == 100


def test_orchestrator_initialization(temp_output_dir):
    """Verify clean orchestrator setup with minimal parameters."""
    orchestrator = PipelineOrchestrator(
        aoi="nepal_terai_koshi",
        before_date=("2024-06-01", "2024-06-30"),
        after_date=("2024-09-15", "2024-10-15"),
        output_dir=temp_output_dir,
        project_name="Nepal Disaster Management Authority",
    )

    assert orchestrator.context.project_name == "Nepal Disaster Management Authority"
    assert orchestrator.context.aoi == "nepal_terai_koshi"
    assert orchestrator.context.run_dir.parent == Path(temp_output_dir).resolve()


def test_end_to_end_run_pipeline(temp_output_dir):
    """
    Test full end-to-end pipeline execution from single entry point run_pipeline(...).
    Verifies Stage 2 -> Stage 3 handoff, file generation, metadata, and logging.
    """
    progress_log = []

    def progress_callback(evt):
        progress_log.append(evt.stage)

    result = run_pipeline(
        aoi="nepal_terai_koshi",
        before_date=("2024-06-01", "2024-06-30"),
        after_date=("2024-09-15", "2024-10-15"),
        output_dir=temp_output_dir,
        project_name="FloodGuard AI Koshi Assessment",
        progress_callback=progress_callback,
    )

    # 1. Result Status & Timing
    assert isinstance(result, PipelineResult)
    assert result.is_success()
    assert result.status in ["SUCCESS", "PARTIAL_SUCCESS"]
    assert result.elapsed_seconds > 0.0
    assert result.execution_id.startswith("run_")

    # 2. Check Directory Structure on Disk
    run_dir = Path(temp_output_dir) / result.execution_id
    assert run_dir.exists()
    assert (run_dir / "flood").exists()
    assert (run_dir / "impact").exists()
    assert (run_dir / "maps").exists()
    assert (run_dir / "reports").exists()
    assert (run_dir / "logs").exists()
    assert (run_dir / "metadata").exists()

    # 3. Check Metadata JSON Generation
    meta_path = Path(result.metadata_path)
    assert meta_path.exists()
    with open(meta_path, "r", encoding="utf-8") as f:
        meta_data = json.load(f)
    assert meta_data["execution"]["execution_id"] == result.execution_id
    assert meta_data["system_info"]["pipeline_version"] == "1.0.0"
    assert "generated_files" in meta_data

    # 4. Check Centralized Log File
    log_path = Path(result.log_path)
    assert log_path.exists()
    assert log_path.stat().st_size > 0
    with open(log_path, "r", encoding="utf-8") as f:
        log_content = f.read()
    assert "FLOODGUARD AI — UNIFIED PIPELINE EXECUTION STARTED" in log_content

    # 5. Check GeoJSON Artifacts
    assert "flood_polygon" in result.geojson_paths
    assert Path(result.geojson_paths["flood_polygon"]).exists()

    expected_impact_geojsons = ["districts", "municipalities", "villages", "buildings", "roads"]
    for k in expected_impact_geojsons:
        assert k in result.geojson_paths
        assert Path(result.geojson_paths[k]).exists()

    # 6. Check Reports & CSV Artifacts
    expected_reports = ["damage_statistics", "dashboard_data", "impact_report", "population_report"]
    for r in expected_reports:
        assert r in result.report_paths
        assert Path(result.report_paths[r]).exists()

    assert "infrastructure_csv" in result.csv_paths
    assert Path(result.csv_paths["infrastructure_csv"]).exists()

    # 7. Check Cartographic Map Outputs
    expected_maps = ["administrative_map", "road_impact_map", "infrastructure_map", "population_map"]
    for m in expected_maps:
        assert m in result.map_paths
        assert Path(result.map_paths[m]).exists()

    # 8. Test to_dict() and to_json() for FastAPI Readiness
    res_dict = result.to_dict()
    assert res_dict["status"] == result.status
    assert "summary_metrics" in res_dict
    assert res_dict["summary_metrics"]["affected_population"] > 0

    json_str = result.to_json()
    assert isinstance(json_str, str)
    assert result.execution_id in json_str

    # 9. Verify Progress Tracker History
    assert PipelineStage.VALIDATION in progress_log
    assert PipelineStage.STAGE_3_COMPLETE in progress_log
    assert PipelineStage.COMPLETED in progress_log
