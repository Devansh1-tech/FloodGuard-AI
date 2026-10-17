"""
Pydantic v2 schemas and API payload contracts.
"""

from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.health import HealthCheckResponse, ComponentHealth
from app.schemas.jobs import (
    JobCreateRequest,
    JobResponse,
    JobStatusResponse,
    JobStatusDetailResponse,
)
from app.schemas.analysis import (
    AnalysisTriggerRequest,
    AnalysisResponse,
    AnalysisSubmissionResponse,
    AnalysisDetailResponse,
)
from app.schemas.reports import ReportResponse
from app.schemas.artifacts import ArtifactResponse
from app.schemas.system import SystemConfigurationResponse, SystemStatisticsResponse
from app.schemas.auth import TokenResponse, TokenPayload, LoginRequest, UserResponse

__all__ = [
    "ApiResponse",
    "PaginatedResponse",
    "HealthCheckResponse",
    "ComponentHealth",
    "JobCreateRequest",
    "JobResponse",
    "JobStatusResponse",
    "JobStatusDetailResponse",
    "AnalysisTriggerRequest",
    "AnalysisResponse",
    "AnalysisSubmissionResponse",
    "AnalysisDetailResponse",
    "ReportResponse",
    "ArtifactResponse",
    "SystemConfigurationResponse",
    "SystemStatisticsResponse",
    "TokenResponse",
    "TokenPayload",
    "LoginRequest",
    "UserResponse",
]
