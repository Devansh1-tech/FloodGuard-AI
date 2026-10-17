"""
FloodGuard AI — Unified Pipeline Orchestration Layer
====================================================

Orchestrates the complete disaster intelligence lifecycle from Earth Observation
SAR processing (Stage 2) to Settlement Impact Assessment (Stage 3).
"""

__version__ = "1.0.0"
__author__ = "FloodGuard AI Platform Architecture Team"

from pipeline.orchestrator import run_pipeline, PipelineOrchestrator
from pipeline.pipeline_manager import PipelineManager
from pipeline.execution_context import PipelineContext
from pipeline.pipeline_result import PipelineResult
from pipeline.progress_tracker import (
    ProgressTracker,
    ProgressEvent,
    PipelineStage,
    ProgressCallback,
)
from pipeline.validators import PipelineValidator
from pipeline.metadata import MetadataGenerator
from pipeline.exceptions import (
    PipelineError,
    ConfigurationError,
    ValidationError,
    EarthEngineError,
    Stage2Error,
    Stage3Error,
    ExportError,
)

__all__ = [
    "run_pipeline",
    "PipelineOrchestrator",
    "PipelineManager",
    "PipelineContext",
    "PipelineResult",
    "ProgressTracker",
    "ProgressEvent",
    "PipelineStage",
    "ProgressCallback",
    "PipelineValidator",
    "MetadataGenerator",
    "PipelineError",
    "ConfigurationError",
    "ValidationError",
    "EarthEngineError",
    "Stage2Error",
    "Stage3Error",
    "ExportError",
    "__version__",
]
