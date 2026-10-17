"""
health.py — Health & Telemetry API Router
=========================================

Exposes endpoints for system diagnostics, readiness, and liveness probes.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.dependencies.services import get_health_service
from app.schemas.common import ApiResponse
from app.schemas.health import HealthCheckResponse
from app.services.health import HealthService

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=ApiResponse[HealthCheckResponse])
async def get_health_status(
    health_service: HealthService = Depends(get_health_service),
) -> ApiResponse[HealthCheckResponse]:
    """
    Comprehensive system health check inspecting Database, Pipeline, Earth Engine, and Storage.
    """
    health = await health_service.check_system_health()
    return ApiResponse(
        data=health,
        message=f"System status: {health.status}",
    )


@router.get("/live", response_model=ApiResponse[dict])
async def liveness_probe() -> ApiResponse[dict]:
    """
    Kubernetes/Docker liveness probe returning immediately if service process is running.
    """
    return ApiResponse(
        data={"status": "alive"},
        message="Service is responsive.",
    )


@router.get("/ready", response_model=ApiResponse[dict])
async def readiness_probe(
    health_service: HealthService = Depends(get_health_service),
) -> ApiResponse[dict]:
    """
    Kubernetes/Docker readiness probe returning whether backend is ready to accept traffic.
    """
    health = await health_service.check_system_health()
    is_ready = health.status in ["healthy", "degraded"]
    return ApiResponse(
        data={"ready": is_ready, "status": health.status},
        message="Service ready for traffic." if is_ready else "Service not ready.",
    )
