"""
Pydantic v2 schemas and API payload contracts.
"""

from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.health import HealthCheckResponse, ComponentHealth
from app.schemas.jobs import JobCreateRequest, JobResponse, JobStatusResponse
from app.schemas.analysis import AnalysisTriggerRequest, AnalysisResponse
from app.schemas.auth import TokenResponse, TokenPayload, LoginRequest, UserResponse

__all__ = [
    "ApiResponse",
    "PaginatedResponse",
    "HealthCheckResponse",
    "ComponentHealth",
    "JobCreateRequest",
    "JobResponse",
    "JobStatusResponse",
    "AnalysisTriggerRequest",
    "AnalysisResponse",
    "TokenResponse",
    "TokenPayload",
    "LoginRequest",
    "UserResponse",
]
