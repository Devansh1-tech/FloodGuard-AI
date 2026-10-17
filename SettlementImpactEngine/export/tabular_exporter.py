"""
tabular_exporter.py — Tabular Dataset Exporter
==============================================

Exports analytical tabular data and cross-tabulations to clean CSV files.
"""

from __future__ import annotations

import os
from pathlib import Path
import pandas as pd

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class TabularExporter:
    """
    Exports tabular metrics to CSV format.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config
        self.output_dir = Path(config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def export_infrastructure_summary(self, df: pd.DataFrame, filename: str = "InfrastructureSummary.csv") -> str:
        """
        Export critical infrastructure summary to CSV.
        """
        out_path = str(self.output_dir / filename)
        if df is None or df.empty:
            pd.DataFrame().to_csv(out_path, index=False)
            return out_path

        df.to_csv(out_path, index=False, encoding="utf-8")
        logger.info("Exported CSV [%d rows]: %s", len(df), out_path)
        return out_path

    def export_dataframe(self, df: pd.DataFrame, filename: str) -> str:
        """
        Export any pandas DataFrame to the configured output directory.
        """
        out_path = str(self.output_dir / filename)
        df.to_csv(out_path, index=False, encoding="utf-8")
        logger.info("Exported CSV: %s", out_path)
        return out_path
