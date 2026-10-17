"""
system.py — System Telemetry & Configuration API Router
=======================================================

Exposes non-sensitive platform metadata, runtime telemetry, and environment parameters.
"""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends

from app.dependencies.services import get_configuration_service
from app.schemas.common import ApiResponse
from app.services.configuration import ConfigurationService

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/info", response_model=ApiResponse[Dict[str, Any]])
async def get_system_info(
    config_service: ConfigurationService = Depends(get_configuration_service),
) -> ApiResponse[Dict[str, Any]]:
    """
    Retrieve public system information, environment status, and capabilities.
    """
    info = config_service.get_public_settings()
    return ApiResponse(
        data=info,
        message="System information retrieved.",
    )


@router.get("/telemetry", response_model=ApiResponse[Dict[str, Any]])
async def get_system_telemetry(
    config_service: ConfigurationService = Depends(get_configuration_service),
) -> ApiResponse[Dict[str, Any]]:
    """
    Retrieve platform runtime telemetry and diagnostics.
    """
    telemetry = config_service.get_system_telemetry()
    return ApiResponse(
        data=telemetry,
        message="System telemetry retrieved.",
    )
