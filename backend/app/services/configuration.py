"""
configuration.py — Centralized Configuration & System Metadata Service
======================================================================

Provides access to application configuration, geospatial analysis presets,
and environment parameters for frontend and external services.
"""

from __future__ import annotations

import sys
from typing import Any, Dict, List

from app.services.base import BaseService


class ConfigurationService(BaseService):
    """
    Coordinates access to system settings, feature flags, and spatial presets.
    """

    def get_public_settings(self) -> Dict[str, Any]:
        """
        Return public, non-sensitive application settings.
        """
        return {
            "app_name": self.settings.APP_NAME,
            "version": self.settings.APP_VERSION,
            "environment": self.settings.ENVIRONMENT,
            "debug": self.settings.DEBUG,
            "storage_backend": self.settings.STORAGE_BACKEND,
            "cors_origins": self.settings.cors_origins_list,
            "earth_engine_configured": bool(self.settings.EE_PROJECT_ID),
        }

    def get_analysis_presets(self) -> Dict[str, Any]:
        """
        Return default AOI boundaries, supported regions, and default temporal windows.
        """
        return {
            "default_aoi": "nepal_terai_koshi",
            "supported_aois": [
                {
                    "id": "nepal_terai_koshi",
                    "name": "Koshi River Basin (Eastern Terai, Nepal)",
                    "type": "preset",
                    "description": "High-risk transboundary flood corridor along Koshi River",
                },
                {
                    "id": "nepal_terai_west_rapti",
                    "name": "West Rapti Basin (Mid-Western Terai, Nepal)",
                    "type": "preset",
                    "description": "Recurrent flash-flood and inundation plain",
                },
                {
                    "id": "custom_polygon",
                    "name": "Custom Polygon (GeoJSON)",
                    "type": "custom",
                    "description": "User-uploaded or interactive polygon geometry",
                },
            ],
            "default_date_ranges": {
                "monsoon_2024": {
                    "label": "2024 Nepal Monsoon Crisis",
                    "before": ["2024-06-01", "2024-06-30"],
                    "after": ["2024-09-15", "2024-10-15"],
                },
            },
            "sensor": {
                "name": "Sentinel-1 SAR C-band",
                "orbit_pass": "DESCENDING",
                "polarization": "VV, VH",
            },
        }

    def get_system_telemetry(self) -> Dict[str, Any]:
        """
        Return platform telemetry and runtime environment diagnostics.
        """
        return {
            "python_version": sys.version,
            "platform": sys.platform,
            "environment": self.settings.ENVIRONMENT,
            "max_job_workers": 4,
            "storage_root": self.settings.STORAGE_LOCAL_ROOT,
        }
