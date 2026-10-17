"""
damage_summary.py — Consolidated Disaster Statistics & Reporting Engine
=======================================================================

Module 6 of Stage 3: Synthesizes multi-sectoral impact metrics into unified,
humanitarian-standard disaster intelligence datasets and dashboard schemas.
"""

from __future__ import annotations

import datetime
from typing import Dict, Any, List

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.utils.logger import get_logger

logger = get_logger(__name__)


class DamageSummaryEngine:
    """
    Assembles comprehensive disaster intelligence outputs across all sectors.
    """

    def __init__(self, config: ImpactConfig) -> None:
        self.config = config

    def compile_damage_statistics(
        self,
        total_flood_area_km2: float,
        admin_summary: Dict[str, Any],
        settlement_summary: Dict[str, Any],
        transport_summary: Dict[str, Any],
        network_summary: Dict[str, Any],
        infrastructure_summary: Dict[str, Any],
        population_summary: Dict[str, Any],
        risk_rankings: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Assemble the primary DamageStatistics.json document.
        """
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        bld_stats = settlement_summary.get("building_damage_summary", {})
        infra_cats = infrastructure_summary.get("by_category", {})

        stats = {
            "metadata": {
                "system": "FloodGuard AI — Stage 3 Settlement Impact Assessment Engine",
                "version": "1.0.0",
                "generated_at_utc": now_iso,
                "aoi": self.config.aoi_name,
                "projected_crs": self.config.projected_crs,
            },
            "disaster_overview": {
                "total_flooded_area_km2": round(total_flood_area_km2, 2),
                "affected_provinces_count": admin_summary.get("total_provinces_affected", 0),
                "affected_districts_count": admin_summary.get("total_districts_affected", 0),
                "affected_municipalities_count": admin_summary.get("total_municipalities_affected", 0),
                "affected_villages_count": settlement_summary.get("settlements_affected_count", 0),
                "flooded_buildings_count": bld_stats.get("total_buildings_flooded", 0),
                "flooded_road_length_km": transport_summary.get("total_flooded_length_km", 0.0),
                "flooded_bridges_count": transport_summary.get("flooded_bridges_count", 0),
                "flooded_facilities_count": infrastructure_summary.get("total_facilities_flooded", 0),
                "affected_population_total": population_summary.get("total_affected_population", 0),
                "estimated_displaced_households": population_summary.get("demographic_vulnerability", {}).get("estimated_displaced_households", 0),
            },
            "administrative_impact": admin_summary,
            "settlements_and_buildings": settlement_summary,
            "transportation_and_connectivity": {
                **transport_summary,
                "graph_topology": network_summary,
            },
            "critical_infrastructure": infrastructure_summary,
            "human_exposure": population_summary,
            "priority_intervention_ranking": risk_rankings,
        }

        return stats

    def compile_dashboard_data(self, damage_stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a lightweight, chart-ready data payload optimized for web frontend cards.
        """
        overview = damage_stats.get("disaster_overview", {})
        admin = damage_stats.get("administrative_impact", {})
        infra = damage_stats.get("critical_infrastructure", {}).get("by_category", {})
        roads = damage_stats.get("transportation_and_connectivity", {}).get("by_classification", {})
        bld = damage_stats.get("settlements_and_buildings", {}).get("building_damage_summary", {}).get("by_building_type", {})
        pop_demog = damage_stats.get("human_exposure", {}).get("demographic_vulnerability", {})

        return {
            "kpi_cards": [
                {"title": "Flooded Area", "value": f"{overview.get('total_flooded_area_km2', 0):.1f} km²", "trend": "Critical"},
                {"title": "Affected Population", "value": f"{overview.get('affected_population_total', 0):,}", "subtext": f"~{overview.get('estimated_displaced_households', 0):,} households"},
                {"title": "Flooded Buildings", "value": f"{overview.get('flooded_buildings_count', 0):,}", "subtext": "Footprints Submerged"},
                {"title": "Flooded Roads", "value": f"{overview.get('flooded_road_length_km', 0):.1f} km", "subtext": f"{overview.get('flooded_bridges_count', 0)} Bridges"},
                {"title": "Critical Lifelines", "value": f"{overview.get('flooded_facilities_count', 0)}", "subtext": f"{infra.get('health', 0)} Hospitals, {infra.get('education', 0)} Schools"},
                {"title": "Municipalities", "value": f"{overview.get('affected_municipalities_count', 0)}", "subtext": f"{overview.get('affected_districts_count', 0)} Districts"},
            ],
            "charts": {
                "road_damage_by_class": {
                    "labels": list(roads.keys()),
                    "values": [r.get("flooded_length_km", 0.0) for r in roads.values()],
                },
                "building_damage_by_type": {
                    "labels": list(bld.keys()),
                    "values": [b.get("count", 0) for b in bld.values()],
                },
                "population_vulnerability": {
                    "labels": ["Children (<5)", "Elderly (65+)", "Female Pop", "Displaced HH"],
                    "values": [
                        pop_demog.get("children_under_5", 0),
                        pop_demog.get("elderly_65_plus", 0),
                        pop_demog.get("female_population", 0),
                        pop_demog.get("estimated_displaced_households", 0),
                    ],
                },
                "municipality_severity_scores": [
                    {
                        "name": r.get("municipality_name"),
                        "score": r.get("disaster_severity_index"),
                        "tier": r.get("priority_tier"),
                    }
                    for r in damage_stats.get("priority_intervention_ranking", [])[:10]
                ],
            },
        }

    def compile_humanitarian_impact_report(self, damage_stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate formal situation report structure (UN-OCHA / NDRRMA SitRep format).
        """
        overview = damage_stats.get("disaster_overview", {})
        ranking = damage_stats.get("priority_intervention_ranking", [])
        top_muni = ranking[0]["municipality_name"] if ranking else "Unknown"

        return {
            "situation_report_id": f"SITREP-{datetime.datetime.now().strftime('%Y%m%d-%H%M')}",
            "title": f"Nepal Terai Flood Disaster Intelligence Assessment — {self.config.aoi_name.upper()}",
            "executive_summary": (
                f"Sentinel-1 SAR inundation analysis reveals that {overview.get('total_flooded_area_km2', 0):.1f} km² "
                f"of land is actively inundated across {overview.get('affected_districts_count', 0)} districts and "
                f"{overview.get('affected_municipalities_count', 0)} municipalities. An estimated "
                f"{overview.get('affected_population_total', 0):,} people are exposed, with {overview.get('flooded_buildings_count', 0)} "
                f"building structures inundated. A total of {overview.get('flooded_road_length_km', 0):.1f} km of road network "
                f"and {overview.get('flooded_bridges_count', 0)} bridges are submerged, severely impeding humanitarian logistics. "
                f"Priority response is required in {top_muni}."
            ),
            "key_figures": overview,
            "priority_needs": [
                "Emergency evacuation logistics for isolated riverbank settlements",
                "Field medical deployments to compensate for submerged health facilities",
                "Alternate overland transport routing around severed bridges and highways",
                "Immediate emergency shelter and relief material distribution",
            ],
            "severity_ranking": ranking,
        }
