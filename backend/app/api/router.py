"""
router.py — Master API Router Aggregator
========================================

Aggregates all versioned endpoints under standard API prefixes.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.analysis import router as analysis_router
from app.api.v1.artifacts import router as artifacts_router
from app.api.v1.downloads import router as downloads_router
from app.api.v1.health import router as health_router
from app.api.v1.intelligence import router as intelligence_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.reports import router as reports_router
from app.api.v1.system import router as system_router
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.gee import router as gee_router

# Master v1 router with prefix /api/v1
api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router)
api_v1_router.include_router(intelligence_router)
api_v1_router.include_router(analysis_router)
api_v1_router.include_router(jobs_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(artifacts_router)
api_v1_router.include_router(downloads_router)
api_v1_router.include_router(system_router)
api_v1_router.include_router(telemetry_router, prefix="/telemetry", tags=["telemetry"])
api_v1_router.include_router(gee_router)
