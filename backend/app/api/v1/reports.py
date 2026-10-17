"""
reports.py — Disaster Reports & Analytics API Router
====================================================

Exposes endpoints for inspecting generated report metadata and streaming
report deliverables (PDF, HTML, JSON, CSV).
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse

from app.dependencies.services import get_report_service
from app.schemas.common import ApiResponse, make_response
from app.schemas.reports import ReportResponse
from app.services.report import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get(
    "/{report_id}",
    response_model=ApiResponse[ReportResponse],
    summary="Get report metadata",
    description="Retrieve database metadata, format, and download URL for a generated disaster report.",
)
async def get_report_metadata(
    report_id: str,
    req: Request,
    report_service: ReportService = Depends(get_report_service),
) -> ApiResponse[ReportResponse]:
    """
    Return report metadata.
    """
    metadata = await report_service.get_report_metadata(report_id)
    return make_response(
        data=metadata,
        message="Report metadata retrieved successfully.",
        request=req,
    )


@router.get(
    "/{report_id}/download",
    summary="Download report file",
    description="Download or stream the generated report deliverable from disk.",
)
async def download_report(
    report_id: str,
    report_service: ReportService = Depends(get_report_service),
):
    """
    Download report file.
    """
    file_path = await report_service.get_report_file_path(report_id)
    filename = Path(file_path).name
    media_type = "application/json" if filename.endswith(".json") else "application/octet-stream"
    if filename.endswith(".pdf"):
        media_type = "application/pdf"
    elif filename.endswith(".html"):
        media_type = "text/html"
    elif filename.endswith(".csv"):
        media_type = "text/csv"

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type,
    )


@router.get(
    "/run/{run_id}",
    response_model=ApiResponse[List[str]],
    summary="List reports for execution run (backward compatibility)",
)
async def list_reports_by_run(
    run_id: str,
    req: Request,
    report_service: ReportService = Depends(get_report_service),
) -> ApiResponse[List[str]]:
    """
    List all generated report documents available for a specific pipeline execution run.
    """
    reports = await report_service.list_available_reports(run_id)
    return make_response(
        data=reports,
        message=f"Found {len(reports)} reports for run '{run_id}'.",
        request=req,
    )
