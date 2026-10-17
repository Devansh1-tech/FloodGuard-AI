"""
API v1 Router Package
"""

from app.api.v1.health import router as health_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.reports import router as reports_router
from app.api.v1.downloads import router as downloads_router
from app.api.v1.system import router as system_router

__all__ = [
    "health_router",
    "analysis_router",
    "jobs_router",
    "reports_router",
    "downloads_router",
    "system_router",
]
