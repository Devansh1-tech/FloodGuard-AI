"""
main.py — FloodGuard AI Backend Application Entrypoint
======================================================

Enterprise-ready FastAPI application factory configuring middleware pipelines,
centralized structured logging, global exception handling, lifecycle management,
and modular REST API routing.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.api.router import api_v1_router
from app.config.settings import Settings, get_settings
from app.core.handlers import register_exception_handlers
from app.core.logging import get_logger, setup_logging
from app.database.session import check_database_connection, get_async_engine
from app.middleware import setup_middleware
from app.schemas.health import HealthCheckResponse
from app.services.health import HealthService

logger = get_logger("Main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager managing startup initialization
    and graceful shutdown sequences.
    """
    settings: Settings = app.state.settings

    # 1. Initialize logging
    setup_logging(log_level=settings.LOG_LEVEL, log_dir=settings.LOG_DIR)
    logger.info("==================================================================")
    logger.info("Starting FloodGuard AI Backend Foundation v%s", settings.APP_VERSION)
    logger.info("Environment: %s | Debug: %s", settings.ENVIRONMENT, settings.DEBUG)
    logger.info("==================================================================")

    # 2. Ensure local storage directories exist
    os.makedirs(settings.STORAGE_LOCAL_ROOT, exist_ok=True)
    logger.info("Local storage root verified at: %s", os.path.abspath(settings.STORAGE_LOCAL_ROOT))

    # 3. Probe database connectivity
    db_ok, db_msg = await check_database_connection()
    if db_ok:
        logger.info("Database connectivity established: %s", db_msg)
    else:
        logger.warning("Database connectivity check degraded: %s", db_msg)

    yield

    # Shutdown sequence
    logger.info("Shutting down FloodGuard AI Backend...")
    engine = get_async_engine()
    await engine.dispose()
    logger.info("Disposed database connection pool. Goodbye!")


def create_app(settings: Settings | None = None) -> FastAPI:
    """
    Application factory constructing a fully-configured FastAPI instance.
    """
    app_settings = settings or get_settings()

    app = FastAPI(
        title=app_settings.APP_NAME,
        version=app_settings.APP_VERSION,
        description=(
            "FloodGuard AI Enterprise Backend API — Orchestrating Sentinel-1 SAR "
            "Flood Detection, Settlement Impact Assessment, and Disaster Response."
        ),
        docs_url="/docs" if app_settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if app_settings.ENVIRONMENT != "production" else None,
        openapi_url="/openapi.json" if app_settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan,
    )

    # Attach settings to application state
    app.state.settings = app_settings

    # Setup middleware pipeline
    setup_middleware(app, app_settings)

    # Register centralized exception handlers
    register_exception_handlers(app)

    # Include versioned API routers
    app.include_router(api_v1_router)

    # Root welcome & metadata endpoint
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "application": app_settings.APP_NAME,
            "version": app_settings.APP_VERSION,
            "status": "online",
            "environment": app_settings.ENVIRONMENT,
            "docs": "/docs" if app_settings.ENVIRONMENT != "production" else None,
            "api_v1": "/api/v1",
        }

    # Top-level /health endpoint satisfying specification requirements
    @app.get("/health", response_model=HealthCheckResponse, tags=["Health"])
    async def top_level_health():
        health_service = HealthService()
        return await health_service.check_system_health()

    return app


app = create_app()


if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
