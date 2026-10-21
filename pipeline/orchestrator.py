"""
orchestrator.py — Unified Pipeline Orchestrator & Entry Point
============================================================

The master entry point for the FloodGuard AI disaster intelligence platform.
Exposes the single high-level `run_pipeline(...)` function that coordinates the
complete workflow from inputs to final decision-ready analytics.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

from pipeline.execution_context import PipelineContext
from pipeline.pipeline_manager import PipelineManager
from pipeline.pipeline_result import PipelineResult
from pipeline.progress_tracker import ProgressTracker, ProgressCallback


class PipelineOrchestrator:
    """
    High-level orchestrator class for the FloodGuard AI Unified Pipeline.
    """

    def __init__(
        self,
        aoi: Union[str, List[List[float]]] = "nepal_terai_koshi",
        before_date: Union[str, Tuple[str, str]] = ("2024-06-01", "2024-06-30"),
        after_date: Union[str, Tuple[str, str]] = ("2024-09-15", "2024-10-15"),
        output_dir: str = "outputs",
        project_name: str = "FloodGuard AI",
        progress_callback: Optional[ProgressCallback] = None,
        execution_id: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        """
        Initialize the orchestrator with minimal user parameters.

        Parameters
        ----------
        aoi : str | list[list[float]]
            Area of Interest identifier (preset key or explicit polygon coordinates).
        before_date : str | tuple[str, str]
            Pre-flood temporal window. If single string, defaults to a 30-day span.
        after_date : str | tuple[str, str]
            Post-flood temporal window. If single string, defaults to a 30-day span.
        output_dir : str
            Base root directory for outputs. Runs will be created inside run_YYYYMMDD_HHMMSS/.
        project_name : str
            Human-readable name of the disaster management project.
        progress_callback : callable | None
            Optional listener receiving real-time ProgressEvent objects.
        execution_id : str | None
            Optional explicit run identifier.
        """
        # Normalize date arguments
        b_dates = self._normalize_date_range(before_date)
        a_dates = self._normalize_date_range(after_date)

        sensor_type = kwargs.pop("sensor_type", kwargs.pop("sensor", "optical"))
        spectral_index = kwargs.pop("spectral_index", kwargs.pop("index", "mndwi"))

        self.context = PipelineContext(
            project_name=project_name,
            aoi=aoi,
            before_date=b_dates,
            after_date=a_dates,
            sensor_type=sensor_type,
            spectral_index=spectral_index,
            base_output_dir=Path(output_dir),
            execution_id=execution_id or "",
            custom_params=kwargs,
        )

        self.tracker = ProgressTracker(callback=progress_callback)
        self.manager = PipelineManager(context=self.context, tracker=self.tracker)

    def execute(self) -> PipelineResult:
        """
        Execute the end-to-end disaster analysis workflow.

        Returns
        -------
        PipelineResult
            Complete results object with status, file paths, metrics, and metadata.
        """
        return self.manager.execute()

    @staticmethod
    def _normalize_date_range(date_val: Union[str, Tuple[str, str], List[str]]) -> Tuple[str, str]:
        """Convert single date or list/tuple to strict (start, end) tuple."""
        if isinstance(date_val, (tuple, list)):
            if len(date_val) >= 2:
                return (str(date_val[0]), str(date_val[1]))
            elif len(date_val) == 1:
                return (str(date_val[0]), str(date_val[0]))
        elif isinstance(date_val, str):
            # If single date provided, assume 1-day or default range
            return (date_val, date_val)
        return ("2024-06-01", "2024-06-30")


def run_pipeline(
    aoi: Union[str, List[List[float]]] = "nepal_terai_koshi",
    before_date: Union[str, Tuple[str, str]] = ("2024-06-01", "2024-06-30"),
    after_date: Union[str, Tuple[str, str]] = ("2024-09-15", "2024-10-15"),
    output_dir: str = "outputs",
    project_name: str = "FloodGuard AI",
    progress_callback: Optional[ProgressCallback] = None,
    **kwargs: Any,
) -> PipelineResult:
    """
    Single unified entry point to run the FloodGuard AI platform.

    The user provides only:
    - aoi
    - before_date
    - after_date
    - output_dir
    - project_name

    Everything else (GEE init, Stage 2 detection, Stage 3 impact, maps, reports, metadata)
    executes automatically without manual intervention.

    Returns
    -------
    PipelineResult
        Full disaster intelligence result.
    """
    orchestrator = PipelineOrchestrator(
        aoi=aoi,
        before_date=before_date,
        after_date=after_date,
        output_dir=output_dir,
        project_name=project_name,
        progress_callback=progress_callback,
        **kwargs,
    )
    return orchestrator.execute()
