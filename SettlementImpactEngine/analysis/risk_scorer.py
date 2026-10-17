"""
risk_scorer.py — Multi-Criteria Disaster Severity Index (DSI)
=============================================================

Calculates weighted composite risk scores across affected municipalities,
integrating physical inundation, human exposure, infrastructure disruption,
and road network severance.
"""

from __future__ import annotations

from typing import Dict, Any, List
import pandas as pd


class DisasterRiskScorer:
    """
    Multi-criteria disaster severity evaluator.
    """

    def __init__(
        self,
        weight_population: float = 0.35,
        weight_area: float = 0.25,
        weight_infrastructure: float = 0.20,
        weight_transport: float = 0.20,
    ) -> None:
        self.w_pop = weight_population
        self.w_area = weight_area
        self.w_infra = weight_infrastructure
        self.w_trans = weight_transport

    def compute_municipality_risk_scores(
        self,
        municipalities_summary: List[Dict[str, Any]],
        pop_breakdown: Dict[str, int],
        roads_flooded_km_by_muni: Dict[str, float] = None,
        infra_flooded_by_muni: Dict[str, int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Compute normalized Disaster Severity Index (0 - 100) per municipality.

        Parameters
        ----------
        municipalities_summary : list[dict]
            Output from AdministrativeImpactAnalyzer.
        pop_breakdown : dict
            Exposed population mapped by municipality name.
        roads_flooded_km_by_muni : dict | None
            Flooded road km per municipality.
        infra_flooded_by_muni : dict | None
            Flooded facility count per municipality.

        Returns
        -------
        list[dict]
            Municipalities ranked in descending order of severity score.
        """
        if not municipalities_summary:
            return []

        roads_flooded_km_by_muni = roads_flooded_km_by_muni or {}
        infra_flooded_by_muni = infra_flooded_by_muni or {}

        max_pop = max([pop_breakdown.get(m["municipality_name"], 0) for m in municipalities_summary] + [1])
        max_road_km = max([roads_flooded_km_by_muni.get(m["municipality_name"], 0.0) for m in municipalities_summary] + [1.0])
        max_infra = max([infra_flooded_by_muni.get(m["municipality_name"], 0) for m in municipalities_summary] + [1])

        scored_records = []
        for m in municipalities_summary:
            name = m["municipality_name"]

            # Sub-scores (0 - 100)
            area_score = min(100.0, m.get("flood_percentage", 0.0) * 2.5)  # 40% flood = 100
            exposed_pop = pop_breakdown.get(name, 0)
            pop_score = (exposed_pop / max_pop) * 100.0
            infra_count = infra_flooded_by_muni.get(name, 0)
            infra_score = (infra_count / max_infra) * 100.0
            road_km = roads_flooded_km_by_muni.get(name, 0.0)
            trans_score = (road_km / max_road_km) * 100.0

            # Composite weighted DSI
            dsi = (
                (self.w_area * area_score)
                + (self.w_pop * pop_score)
                + (self.w_infra * infra_score)
                + (self.w_trans * trans_score)
            )
            dsi = round(min(100.0, max(0.0, dsi)), 1)

            # Assign Priority Tier
            if dsi >= 65.0:
                tier = "Tier 1: CRITICAL (Immediate Relief Deployment)"
            elif dsi >= 40.0:
                tier = "Tier 2: HIGH (Urgent Support)"
            elif dsi >= 20.0:
                tier = "Tier 3: MODERATE (Monitoring & Logistics)"
            else:
                tier = "Tier 4: LOW (Local Advisory)"

            scored_records.append({
                **m,
                "exposed_population": exposed_pop,
                "flooded_road_km": round(road_km, 2),
                "flooded_facilities_count": infra_count,
                "disaster_severity_index": dsi,
                "priority_tier": tier,
            })

        # Sort descending by DSI
        scored_records.sort(key=lambda x: x["disaster_severity_index"], reverse=True)
        return scored_records
