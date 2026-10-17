"""
execution_context.py — Shared Pipeline Execution Context
========================================================

Encapsulates global state, input configurations, run directories, file inventories,
telemetry, and execution lifecycle metrics for the FloodGuard AI pipeline.
"""

from __future__ import annotations

import datetime
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union


@dataclass
class PipelineContext:
    """
    Unified execution context passed across all runners and stages.

    Attributes
    ----------
    project_name : str
        Human-readable name of the disaster management project.
    aoi : str | list
        Area of Interest identifier preset or polygon coordinates.
    before_date : tuple[str, str]
        (start_date, end_date) ISO strings for the pre-flood window.
    after_date : tuple[str, str]
        (start_date, end_date) ISO strings for the post-flood window.
    base_output_dir : Path
        Root directory where run-specific directories will be created.
    execution_id : str
        Globally unique run identifier (e.g. ``run_20261017_112000_3f8a``).
    """

    project_name: str = "FloodGuard AI"
    aoi: Union[str, List[List[float]]] = "nepal_terai_koshi"
    before_date: Tuple[str, str] = ("2024-06-01", "2024-06-30")
    after_date: Tuple[str, str] = ("2024-09-15", "2024-10-15")
    base_output_dir: Path = field(default_factory=lambda: Path("outputs"))
    execution_id: str = ""

    # Lifecycle State
    status: str = "NOT_STARTED"  # NOT_STARTED, RUNNING, SUCCESS, PARTIAL_SUCCESS, FAILED
    current_stage: str = "INITIALIZING"
    start_time: float = field(default_factory=time.perf_counter)
    end_time: Optional[float] = None
    start_time_iso: str = ""
    end_time_iso: str = ""

    # Directory Hierarchy
    run_dir: Path = field(init=False)
    flood_dir: Path = field(init=False)
    impact_dir: Path = field(init=False)
    maps_dir: Path = field(init=False)
    reports_dir: Path = field(init=False)
    logs_dir: Path = field(init=False)
    metadata_dir: Path = field(init=False)
    temp_dir: Path = field(init=False)
    log_file: Path = field(init=False)

    # Generated Artifacts & Telemetry
    generated_files: Dict[str, Dict[str, str]] = field(
        default_factory=lambda: {
            "flood": {},
            "impact": {},
            "maps": {},
            "reports": {},
            "metadata": {},
            "logs": {},
        }
    )
    flood_statistics: Dict[str, Any] = field(default_factory=dict)
    impact_statistics: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    custom_params: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        """Initialize timestamp, unique execution ID, and isolated directory structure."""
        now = datetime.datetime.now(datetime.timezone.utc)
        self.start_time_iso = now.isoformat()

        if not self.execution_id:
            time_slug = now.strftime("%Y%m%d_%H%M%S")
            self.execution_id = f"run_{time_slug}"

        # Resolve paths
        self.base_output_dir = Path(self.base_output_dir).resolve()
        self.run_dir = self.base_output_dir / self.execution_id

        # Isolated sub-directories
        self.flood_dir = self.run_dir / "flood"
        self.impact_dir = self.run_dir / "impact"
        self.maps_dir = self.run_dir / "maps"
        self.reports_dir = self.run_dir / "reports"
        self.logs_dir = self.run_dir / "logs"
        self.metadata_dir = self.run_dir / "metadata"
        self.temp_dir = self.run_dir / "temporary"
        self.log_file = self.logs_dir / "pipeline.log"

    def create_directories(self) -> None:
        """Create all isolated run directories on disk."""
        for d in [
            self.run_dir,
            self.flood_dir,
            self.impact_dir,
            self.maps_dir,
            self.reports_dir,
            self.logs_dir,
            self.metadata_dir,
            self.temp_dir,
        ]:
            d.mkdir(parents=True, exist_ok=True)

    def add_generated_file(self, category: str, key: str, path: Union[str, Path]) -> None:
        """Record an output artifact path in the inventory."""
        str_path = str(Path(path).resolve())
        if category not in self.generated_files:
            self.generated_files[category] = {}
        self.generated_files[category][key] = str_path

    def add_warning(self, message: str) -> None:
        """Record a non-fatal warning."""
        self.warnings.append(message)

    def add_error(self, message: str) -> None:
        """Record an error condition."""
        self.errors.append(message)

    def mark_completed(self, status: str = "SUCCESS") -> None:
        """Mark the pipeline execution as complete."""
        self.end_time = time.perf_counter()
        self.end_time_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.status = status

    def get_elapsed_seconds(self) -> float:
        """Return total elapsed wall-clock seconds."""
        current = self.end_time if self.end_time is not None else time.perf_counter()
        return round(current - self.start_time, 2)
