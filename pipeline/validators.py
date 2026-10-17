"""
validators.py — Pre-Flight System & Input Validators
====================================================

Verifies prerequisites, environment configurations, temporal ordering,
and filesystem permissions before pipeline execution begins.
"""

from __future__ import annotations

import datetime
import importlib
import os
import tempfile
from pathlib import Path
from typing import List, Tuple, Union

from pipeline.exceptions import ValidationError, ConfigurationError


class PipelineValidator:
    """
    Validates pipeline inputs, environment settings, and runtime dependencies.
    """

    @staticmethod
    def validate_dates(
        before_date: Tuple[str, str],
        after_date: Tuple[str, str],
    ) -> None:
        """
        Verify date format and chronological ordering.

        Parameters
        ----------
        before_date : tuple[str, str]
            (before_start, before_end) in 'YYYY-MM-DD' format.
        after_date : tuple[str, str]
            (after_start, after_end) in 'YYYY-MM-DD' format.

        Raises
        ------
        ConfigurationError
            If dates are improperly formatted or non-chronological.
        """
        def parse(d_str: str, label: str) -> datetime.date:
            try:
                return datetime.date.fromisoformat(d_str)
            except (ValueError, TypeError) as exc:
                raise ConfigurationError(
                    f"Invalid date format for '{label}': '{d_str}'. Expected 'YYYY-MM-DD'.",
                    details=str(exc),
                ) from exc

        b_start = parse(before_date[0], "before_start")
        b_end = parse(before_date[1], "before_end")
        a_start = parse(after_date[0], "after_start")
        a_end = parse(after_date[1], "after_end")

        if b_start >= b_end:
            raise ConfigurationError(
                f"Before start date ({b_start}) must precede before end date ({b_end})."
            )

        if a_start >= a_end:
            raise ConfigurationError(
                f"After start date ({a_start}) must precede after end date ({a_end})."
            )

        if b_start >= a_start:
            raise ConfigurationError(
                f"Pre-event window ({b_start}) must occur prior to post-event window ({a_start})."
            )

    @staticmethod
    def validate_output_directory(target_path: Union[str, Path]) -> Path:
        """
        Verify that the output directory is valid and writable.
        """
        path = Path(target_path).resolve()
        try:
            path.mkdir(parents=True, exist_ok=True)
            # Test write access with a temporary probe
            probe_file = path / f".write_probe_{os.getpid()}"
            probe_file.write_text("ok", encoding="utf-8")
            probe_file.unlink(missing_ok=True)
            return path
        except Exception as exc:
            raise ValidationError(
                f"Output directory '{path}' is not writable.",
                details=str(exc),
            ) from exc

    @staticmethod
    def validate_required_packages() -> None:
        """
        Confirm presence of critical geospatial and numerical libraries.
        """
        required_packages = [
            "ee",
            "geopandas",
            "shapely",
            "rasterio",
            "pyproj",
            "numpy",
            "pandas",
            "networkx",
            "matplotlib",
        ]
        missing = []
        for pkg in required_packages:
            try:
                importlib.import_module(pkg)
            except ImportError:
                missing.append(pkg)

        if missing:
            raise ValidationError(
                f"Missing required Python dependencies: {', '.join(missing)}. "
                f"Please run 'pip install -r requirements.txt'."
            )

    @staticmethod
    def validate_engine_availability() -> None:
        """
        Confirm that Stage 2 (FloodDetectionEngine) and Stage 3 (SettlementImpactEngine)
        are importable and ready.
        """
        try:
            import FloodDetectionEngine  # noqa: F401
        except ImportError as exc:
            raise ValidationError(
                "FloodDetectionEngine (Stage 2) is not installed or importable.",
                details=str(exc),
            ) from exc

        try:
            import SettlementImpactEngine  # noqa: F401
        except ImportError as exc:
            raise ValidationError(
                "SettlementImpactEngine (Stage 3) is not installed or importable.",
                details=str(exc),
            ) from exc

    @staticmethod
    def validate_earth_engine_project(project_id: str | None = None) -> str:
        """
        Validate that an Earth Engine project ID is available from config or environment.
        """
        pid = project_id or os.getenv("EE_PROJECT_ID")
        if not pid:
            raise ConfigurationError(
                "Google Earth Engine project ID not configured. Set EE_PROJECT_ID in .env "
                "or pass gee_project in configuration."
            )
        return pid
