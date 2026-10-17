"""
reports.py — Report Schemas
===========================
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class ReportResponse(BaseModel):
    """Metadata response for a generated disaster report."""

    id: str
    flood_event_id: str
    report_type: str
    format: str
    report_path: str
    download_url: str
    created_at: str
