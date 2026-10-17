"""
exceptions.py — Pipeline Exception Hierarchy
============================================

Defines specialized exceptions for the FloodGuard AI Unified Pipeline Orchestrator.
Allows fine-grained error identification, recovery strategies, and telemetry tracking.
"""

from __future__ import annotations


class PipelineError(Exception):
    """Base exception for all pipeline-related failures."""

    def __init__(self, message: str, stage: str = "GENERAL", details: str = "") -> None:
        super().__init__(message)
        self.message = message
        self.stage = stage
        self.details = details

    def __str__(self) -> str:
        base = f"[{self.stage}] {self.message}"
        if self.details:
            base += f" (Details: {self.details})"
        return base


class ConfigurationError(PipelineError):
    """Raised when pipeline input parameters or environment configs are invalid."""

    def __init__(self, message: str, details: str = "") -> None:
        super().__init__(message, stage="CONFIGURATION", details=details)


class ValidationError(PipelineError):
    """Raised when pre-flight validation of inputs, datasets, or permissions fails."""

    def __init__(self, message: str, details: str = "") -> None:
        super().__init__(message, stage="VALIDATION", details=details)


class EarthEngineError(PipelineError):
    """Raised when Google Earth Engine initialization, authentication, or RPC fails."""

    def __init__(self, message: str, details: str = "") -> None:
        super().__init__(message, stage="EARTH_ENGINE", details=details)


class Stage2Error(PipelineError):
    """Raised when Stage 2 Flood Detection Engine fails."""

    def __init__(self, message: str, details: str = "") -> None:
        super().__init__(message, stage="STAGE_2_FLOOD_DETECTION", details=details)


class Stage3Error(PipelineError):
    """Raised when Stage 3 Settlement Impact Assessment Engine fails."""

    def __init__(self, message: str, details: str = "") -> None:
        super().__init__(message, stage="STAGE_3_SETTLEMENT_IMPACT", details=details)


class ExportError(PipelineError):
    """Raised when exporting metadata, reports, or vector/raster outputs fails."""

    def __init__(self, message: str, details: str = "") -> None:
        super().__init__(message, stage="EXPORT", details=details)
