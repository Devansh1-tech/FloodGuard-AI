"""
analysis.py — Flood Disaster Analysis API Router
=================================================

Exposes endpoints for dispatching end-to-end flood detection and
settlement impact assessment pipeline runs, monitoring consolidated results,
and inspecting study area presets.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Header, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.dependencies.services import get_configuration_service, get_job_service
from app.schemas.analysis import (
    AnalysisDetailResponse,
    AnalysisSubmissionResponse,
    AnalysisTriggerRequest,
)
from app.schemas.common import ApiResponse, make_response
from app.schemas.jobs import JobResponse
from app.security.jwt import decode_access_token
from app.security.permissions import Role
from app.services.configuration import ConfigurationService
from app.services.job import JobService

router = APIRouter(prefix="/analysis", tags=["Analysis"])
security_scheme = HTTPBearer(auto_error=False)


async def require_analysis_role(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Dict[str, Any]:
    """
    Security dependency enforcing that only ADMIN and ANALYST roles can trigger analyses.
    Explicitly rejects unauthenticated requests (401) and VIEWER roles (403).
    """
    if credentials is None or not credentials.credentials:
        raise AuthenticationError("Missing Authorization header with Bearer token.")

    claims = decode_access_token(credentials.credentials)
    role = claims.get("role", Role.VIEWER.value)
    if role not in [Role.ADMIN.value, Role.ANALYST.value]:
        raise AuthorizationError(
            f"Operation forbidden. Required roles: ['ADMIN', 'ANALYST'], caller role: {role}"
        )
    return {
        "user_id": claims.get("sub"),
        "role": role,
        "is_active": claims.get("is_active", True),
    }


async def optional_analysis_role(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Dict[str, Any]:
    """Optional auth for backward compatibility on legacy /trigger route."""
    if credentials and credentials.credentials:
        try:
            claims = decode_access_token(credentials.credentials)
            return {
                "user_id": claims.get("sub"),
                "role": claims.get("role", Role.ANALYST.value),
            }
        except Exception:
            pass
    return {"user_id": "legacy_tester", "role": Role.ANALYST.value}


@router.post(
    "",
    response_model=ApiResponse[AnalysisSubmissionResponse],
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start new flood analysis",
    description=(
        "Validate study area (AOI), temporal date bounds, and priority. "
        "Create an AnalysisJob record, calculate estimated queue position, and "
        "dispatch the end-to-end Sentinel-1 SAR detection and settlement impact pipeline. "
        "Requires ADMIN or ANALYST privileges."
    ),
)
async def start_analysis(
    request_data: AnalysisTriggerRequest,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_analysis_role),
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[AnalysisSubmissionResponse]:
    """
    Start new flood analysis.
    """
    user_id = current_user.get("user_id")
    submission = await job_service.submit_analysis_job(request=request_data, user_id=user_id)
    return make_response(
        data=submission,
        message="Analysis job accepted and queued for execution.",
        request=req,
    )


@router.post(
    "/trigger",
    response_model=ApiResponse[JobResponse],
    status_code=status.HTTP_202_ACCEPTED,
    summary="Legacy trigger endpoint (backward compatibility)",
)
async def trigger_analysis_legacy(
    request_data: AnalysisTriggerRequest,
    req: Request,
    current_user: Dict[str, Any] = Depends(optional_analysis_role),
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[JobResponse]:
    """
    Legacy trigger endpoint returning JobResponse container.
    """
    user_id = current_user.get("user_id")
    submission = await job_service.submit_analysis_job(request=request_data, user_id=user_id)
    job_detail = await job_service.get_job_detail(submission.job_id)
    job_resp = JobResponse(
        job_id=job_detail.job_id,
        job_type="pipeline_analysis",
        status=job_detail.status,
        priority=job_detail.priority,
        progress_percent=job_detail.progress,
        message="Analysis job successfully scheduled for background execution.",
        created_at=job_detail.created_at,
        started_at=job_detail.started_at,
        completed_at=job_detail.completed_at,
        result=job_detail.parameters,
        error=job_detail.errors,
    )
    return make_response(
        data=job_resp,
        message="Analysis job successfully scheduled for background execution.",
        request=req,
    )


@router.get(
    "/presets",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get analysis study area presets",
)
async def get_analysis_presets(
    req: Request,
    config_service: ConfigurationService = Depends(get_configuration_service),
) -> ApiResponse[Dict[str, Any]]:
    """
    Retrieve supported study area presets, bounding geometries, and default date ranges.
    """
    presets = config_service.get_analysis_presets()
    return make_response(
        data=presets,
        message="Analysis presets retrieved successfully.",
        request=req,
    )


@router.get(
    "/{analysis_id}",
    response_model=ApiResponse[AnalysisDetailResponse],
    summary="Get complete analysis summary",
    description=(
        "Retrieve complete consolidated analysis summary including Sentinel-1 SAR flood "
        "statistics, affected population demographics, submerged critical infrastructure, "
        "generated situation reports, and exportable artifacts."
    ),
)
async def get_analysis_summary(
    analysis_id: str,
    req: Request,
    job_service: JobService = Depends(get_job_service),
) -> ApiResponse[AnalysisDetailResponse]:
    """
    Return complete consolidated analysis summary.
    """
    summary = await job_service.get_analysis_summary(analysis_id)
    return make_response(
        data=summary,
        message="Analysis summary retrieved successfully.",
        request=req,
    )
