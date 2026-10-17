"""
progress_tracker.py — Real-Time Pipeline Progress & Stage Tracker
=================================================================

Tracks execution stages, percentage completion, and status updates across the
unified pipeline. Supports event listeners for WebSockets, Celery, and Streamlit.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, List, Optional, Dict, Any


class PipelineStage(str, Enum):
    """Enumeration of recognized pipeline execution milestones."""
    INITIALIZING = "INITIALIZING"
    CONFIGURATION = "CONFIGURATION"
    ENVIRONMENT = "ENVIRONMENT"
    VALIDATION = "VALIDATION"
    EARTH_ENGINE = "EARTH_ENGINE"
    STAGE_2_RUNNING = "STAGE_2_RUNNING"
    STAGE_2_COMPLETE = "STAGE_2_COMPLETE"
    STAGE_3_RUNNING = "STAGE_3_RUNNING"
    STAGE_3_COMPLETE = "STAGE_3_COMPLETE"
    STATISTICS = "STATISTICS"
    MAPS = "MAPS"
    REPORTS = "REPORTS"
    METADATA = "METADATA"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# Standard percentage weights for milestones
STAGE_PROGRESS_MAP: Dict[PipelineStage, int] = {
    PipelineStage.INITIALIZING: 0,
    PipelineStage.CONFIGURATION: 5,
    PipelineStage.ENVIRONMENT: 10,
    PipelineStage.VALIDATION: 15,
    PipelineStage.EARTH_ENGINE: 25,
    PipelineStage.STAGE_2_RUNNING: 35,
    PipelineStage.STAGE_2_COMPLETE: 55,
    PipelineStage.STAGE_3_RUNNING: 65,
    PipelineStage.STAGE_3_COMPLETE: 80,
    PipelineStage.STATISTICS: 85,
    PipelineStage.MAPS: 90,
    PipelineStage.REPORTS: 95,
    PipelineStage.METADATA: 98,
    PipelineStage.COMPLETED: 100,
    PipelineStage.FAILED: 100,
}


@dataclass
class ProgressEvent:
    """Snapshot of a progress update event."""
    stage: PipelineStage
    percentage: int
    status: str
    message: str
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "stage": self.stage.value,
            "percentage": self.percentage,
            "status": self.status,
            "message": self.message,
            "timestamp": self.timestamp,
        }


ProgressCallback = Callable[[ProgressEvent], None]


class ProgressTracker:
    """
    Central progress tracker and event publisher for the pipeline.
    """

    def __init__(self, callback: Optional[ProgressCallback] = None) -> None:
        self.callbacks: List[ProgressCallback] = [callback] if callback else []
        self.history: List[ProgressEvent] = []
        self.current_stage: PipelineStage = PipelineStage.INITIALIZING
        self.current_percentage: int = 0
        self.current_message: str = "Pipeline initialized"

    def register_callback(self, callback: ProgressCallback) -> None:
        """Add an event listener (e.g. for WebSockets or UI progress bars)."""
        if callback not in self.callbacks:
            self.callbacks.append(callback)

    def update(
        self,
        stage: PipelineStage,
        message: str = "",
        status: str = "IN_PROGRESS",
        override_percentage: Optional[int] = None,
    ) -> None:
        """
        Record a stage update and notify all registered listeners.
        """
        pct = override_percentage if override_percentage is not None else STAGE_PROGRESS_MAP.get(stage, self.current_percentage)
        self.current_stage = stage
        self.current_percentage = max(self.current_percentage, min(100, pct))
        self.current_message = message or stage.value

        event = ProgressEvent(
            stage=stage,
            percentage=self.current_percentage,
            status=status,
            message=self.current_message,
        )
        self.history.append(event)

        for cb in self.callbacks:
            try:
                cb(event)
            except Exception:
                pass  # Listener failure must never crash pipeline execution

    def get_status_payload(self) -> Dict[str, Any]:
        """Return the current progress status as a JSON-serializable dictionary."""
        return {
            "current_stage": self.current_stage.value,
            "percentage": self.current_percentage,
            "message": self.current_message,
            "history_count": len(self.history),
        }
