"""
Configuration Module
====================

Centralized configuration for the FloodDetectionEngine.
All parameters (dates, AOI, thresholds, export settings,
visualization palettes) are defined here as a single source
of truth so that no module contains hardcoded values.
"""

from FloodDetectionEngine.config.config import EngineConfig, AOI_PRESETS

__all__ = ["EngineConfig", "AOI_PRESETS"]
