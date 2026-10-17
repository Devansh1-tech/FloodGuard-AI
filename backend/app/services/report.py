"""
report.py — Disaster Reporting & Analytics Service
==================================================

Coordinates access to generated disaster reports, dashboard statistics,
and analytical summaries produced by pipeline runs.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.services.base import BaseService
from app.core.exceptions import NotFoundError


class ReportService(BaseService):
    """
    Service managing retrieval and formatting of disaster reports.
    """

    async def get_report_by_run_id(self, run_id: str, report_type: str = "ImpactReport") -> Dict[str, Any]:
        """
        Fetch a parsed JSON report from an execution directory.
        """
        root = Path(self.settings.STORAGE_LOCAL_ROOT)
        report_file = root / run_id / "reports" / f"{report_type}.json"

        if not report_file.exists():
            raise NotFoundError("Report", f"{run_id}/{report_type}")

        with open(report_file, "r", encoding="utf-8") as f:
            return json.load(f)

    async def list_available_reports(self, run_id: str) -> List[str]:
        """List all report names available in an execution directory."""
        root = Path(self.settings.STORAGE_LOCAL_ROOT)
        reports_dir = root / run_id / "reports"

        if not reports_dir.exists():
            return []

        return [f.name for f in reports_dir.glob("*.json")]
