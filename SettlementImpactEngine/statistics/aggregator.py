"""
aggregator.py — Tabular Aggregation & Cross-Tabulation
======================================================

Converts geospatial disaster observations into clean tabular summaries
and CSV outputs for emergency management analysts.
"""

from __future__ import annotations

import pandas as pd
from typing import Dict, Any, List


class TabularAggregator:
    """
    Transforms multi-sectoral impact metrics into tabular data structures.
    """

    @staticmethod
    def build_infrastructure_table(infra_summary: Dict[str, Any]) -> pd.DataFrame:
        """
        Build a flat DataFrame suitable for InfrastructureSummary.csv.
        """
        records = infra_summary.get("facility_details", [])
        if not records:
            return pd.DataFrame(
                columns=[
                    "facility_id", "name", "category", "sub_type", "capacity",
                    "is_flooded", "is_encroached", "status", "nearest_safe_facility",
                    "nearest_safe_distance_km"
                ]
            )

        df = pd.DataFrame(records)
        return df

    @staticmethod
    def build_municipality_table(risk_rankings: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Build an administrative impact table.
        """
        if not risk_rankings:
            return pd.DataFrame()

        cols = [
            "municipality_name", "district_name", "province_name", "type",
            "total_area_km2", "flooded_area_km2", "flood_percentage",
            "exposed_population", "flooded_road_km", "flooded_facilities_count",
            "disaster_severity_index", "priority_tier"
        ]
        df = pd.DataFrame(risk_rankings)
        available_cols = [c for c in cols if c in df.columns]
        return df[available_cols]
