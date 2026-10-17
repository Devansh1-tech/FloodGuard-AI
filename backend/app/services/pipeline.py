"""
pipeline.py — Unified Pipeline Integration Service Wrapper
==========================================================

Service wrapper bridging the FastAPI backend to the FloodGuard AI
Unified Pipeline Orchestrator (`pipeline.run_pipeline`).
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable, Dict, Optional, Tuple, Union

from app.services.base import BaseService
from app.core.exceptions import PipelineError

# Import the orchestrator entry point
try:
    from pipeline import run_pipeline, PipelineResult
except ImportError:
    run_pipeline = None
    PipelineResult = None


class PipelineService(BaseService):
    """
    Coordinates execution of the disaster analysis pipeline.
    """

    def is_engine_available(self) -> bool:
        """Verify that the underlying pipeline package is installed and importable."""
        return run_pipeline is not None

    async def execute_analysis_pipeline(
        self,
        aoi: Union[str, list] = "nepal_terai_koshi",
        before_date: Tuple[str, str] = ("2024-06-01", "2024-06-30"),
        after_date: Tuple[str, str] = ("2024-09-15", "2024-10-15"),
        output_dir: Optional[str] = None,
        project_name: str = "FloodGuard AI",
        progress_callback: Optional[Callable] = None,
        **kwargs: Any,
    ) -> Any:
        """
        Execute the unified pipeline asynchronously off the event loop.

        Parameters
        ----------
        aoi : str | list
            Study area preset or polygon coordinates.
        before_date : tuple[str, str]
            Pre-flood temporal window.
        after_date : tuple[str, str]
            Post-flood crisis window.
        output_dir : str | None
            Target output root directory.
        project_name : str
            Project title.
        progress_callback : callable | None
            Listener for progress milestones.

        Returns
        -------
        PipelineResult
            Complete results object with status and generated artifact paths.
        """
        if not self.is_engine_available():
            raise PipelineError("Unified Pipeline package is not available in backend environment.")

        out_root = output_dir or self.settings.STORAGE_LOCAL_ROOT
        self.logger.info("Scheduling pipeline execution for AOI '%s' (output: '%s')", aoi, out_root)

        # Run the CPU-bound / synchronous GEE pipeline in a background worker thread
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None,
            lambda: run_pipeline(
                aoi=aoi,
                before_date=before_date,
                after_date=after_date,
                output_dir=out_root,
                project_name=project_name,
                progress_callback=progress_callback,
                **kwargs,
            ),
        )
        return result
