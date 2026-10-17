"""
Dependencies package for FastAPI dependency injection.
"""

from app.dependencies.database import get_db
from app.dependencies.services import (
    get_health_service,
    get_pipeline_service,
    get_report_service,
    get_storage_service,
    get_job_service,
    get_configuration_service,
    get_shared_job_manager,
)
from app.dependencies.auth import (
    get_current_user_claims,
    get_current_user,
    get_current_active_user,
    require_role_dependency,
)

__all__ = [
    "get_db",
    "get_health_service",
    "get_pipeline_service",
    "get_report_service",
    "get_storage_service",
    "get_job_service",
    "get_configuration_service",
    "get_shared_job_manager",
    "get_current_user_claims",
    "get_current_user",
    "get_current_active_user",
    "require_role_dependency",
]
