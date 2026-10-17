"""
system.py — System Telemetry & Configuration API Router
=======================================================

Exposes endpoints for platform configuration inspection, database statistics,
runtime telemetry, and environmental diagnostics.
"""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, Depends, Request

from app.dependencies.services import get_configuration_service
from app.schemas.common import ApiResponse, make_response
from app.schemas.system import SystemConfigurationResponse, SystemStatisticsResponse
from app.services.configuration import ConfigurationService

router = APIRouter(prefix="/system", tags=["System"])


@router.get(
    "/configuration",
    response_model=ApiResponse[SystemConfigurationResponse],
    summary="Get platform configuration",
    description=(
        "Retrieve platform version, pipeline version, Google Earth Engine project binding, "
        "storage backend, database status, and operational deployment environment."
    ),
)
async def get_system_configuration(
    req: Request,
    config_service: ConfigurationService = Depends(get_configuration_service),
) -> ApiResponse[SystemConfigurationResponse]:
    """
    Return formal system configuration.
    """
    config_data = config_service.get_platform_configuration()
    return make_response(
        data=config_data,
        message="System configuration retrieved successfully.",
        request=req,
    )


@router.get(
    "/statistics",
    response_model=ApiResponse[SystemStatisticsResponse],
    summary="Get platform usage statistics",
    description=(
        "Return total counts of registered users, background analysis jobs, delineated flood events, "
        "generated situation reports, exported artifacts, storage footprint (bytes), and "
        "mean pipeline execution duration."
    ),
)
async def get_system_statistics(
    req: Request,
    config_service: ConfigurationService = Depends(get_configuration_service),
) -> ApiResponse[SystemStatisticsResponse]:
    """
    Return system statistics and database aggregates.
    """
    stats_data = await config_service.get_system_statistics()
    return make_response(
        data=stats_data,
        message="System statistics retrieved successfully.",
        request=req,
    )


@router.get(
    "/info",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get public system information (backward compatibility)",
)
async def get_system_info(
    req: Request,
    config_service: ConfigurationService = Depends(get_configuration_service),
) -> ApiResponse[Dict[str, Any]]:
    """
    Retrieve public system information, environment status, and capabilities.
    """
    info = config_service.get_public_settings()
    return make_response(
        data=info,
        message="System information retrieved.",
        request=req,
    )


@router.get(
    "/telemetry",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get runtime telemetry (backward compatibility)",
)
async def get_system_telemetry(
    req: Request,
    config_service: ConfigurationService = Depends(get_configuration_service),
) -> ApiResponse[Dict[str, Any]]:
    """
    Retrieve platform runtime telemetry and diagnostics.
    """
    telemetry = config_service.get_system_telemetry()
    return make_response(
        data=telemetry,
        message="System telemetry retrieved.",
        request=req,
    )
