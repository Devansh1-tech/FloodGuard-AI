"""
report_exporter.py — JSON Disaster Intelligence Exporter
=========================================================

Serializes structured disaster telemetry, population exposure models, and
executive situation reports to JSON artifacts.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any, Optional

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class ReportExporter:
    """
    Serializes and exports disaster intelligence reports into JSON format.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config
        self.output_dir = Path(config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def export_all_reports(
        self,
        damage_statistics: Dict[str, Any],
        dashboard_data: Dict[str, Any],
        impact_report: Dict[str, Any],
        population_report: Dict[str, Any],
        settlement_report: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        """
        Export all designated JSON telemetry artifacts.
        """
        paths = {}
        paths["damage_statistics"] = self.export_json(damage_statistics, "DamageStatistics.json")
        paths["dashboard_data"] = self.export_json(dashboard_data, "DashboardData.json")
        paths["impact_report"] = self.export_json(impact_report, "ImpactReport.json")
        paths["population_report"] = self.export_json(population_report, "AffectedPopulation.json")
        if settlement_report is not None:
            paths["settlement_report"] = self.export_json(settlement_report, "AffectedSettlements_Report.json")
        return paths

    def export_json(self, data: Dict[str, Any], filename: str) -> str:
        """
        Serialize a Python dictionary to a formatted JSON file.
        """
        out_path = str(self.output_dir / filename)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info("Exported JSON report: %s", out_path)
        return out_path
