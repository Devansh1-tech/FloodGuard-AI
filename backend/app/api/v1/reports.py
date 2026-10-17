"""
reports.py — Disaster Reports & Analytics API Router
====================================================

Exposes endpoints for retrieving generated analytical summaries, settlement impact
breakdowns, and risk reports produced by pipeline runs.
"""

from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Depends

from app.dependencies.services import get_report_service
from app.schemas.common import ApiResponse
from app.services.report import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{run_id}", response_model=ApiResponse[List[str]])
async def list_reports(
    run_id: str,
    report_service: ReportService = Depends(get_report_service),
) -> ApiResponse[List[str]]:
    """
    List all generated report documents available for a specific pipeline execution run.
    """
    reports = await report_service.list_available_reports(run_id)
    return ApiResponse(
        data=reports,
        message=f"Found {len(reports)} reports for run '{run_id}'.",
    )


@router.get("/{run_id}/{report_type}", response_model=ApiResponse[Dict[str, Any]])
async def get_report_content(
    run_id: str,
    report_type: str = "ImpactReport",
    report_service: ReportService = Depends(get_report_service),
) -> ApiResponse[Dict[str, Any]]:
    """
    Retrieve the JSON analytical report for an execution run.
    """
    report = await report_service.get_report_by_run_id(run_id, report_type)
    return ApiResponse(
        data=report,
        message=f"Report '{report_type}' retrieved for run '{run_id}'.",
    )
