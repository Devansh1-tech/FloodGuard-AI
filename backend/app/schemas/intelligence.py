"""
intelligence.py — Schemas for AI Demographic & Healthcare Intelligence (Stage 5.5)
===================================================================================

Defines request and response schemas for settlement-level census, vulnerable groups,
local hospital capacities, ICU/ventilators, antivenom stocks, and disease risk profiles.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class VulnerableDemographics(BaseModel):
    infants_under_5: int = Field(..., description="Estimated infants under age 5")
    elderly_above_60: int = Field(..., description="Estimated elderly citizens above age 60")
    pregnant_women: int = Field(..., description="Estimated pregnant and lactating mothers")
    disabled_or_chronic: int = Field(..., description="Persons with disabilities or chronic illnesses")


class HealthcareFacility(BaseModel):
    name: str = Field(..., description="Facility name")
    type: str = Field(..., description="Facility classification (e.g. Provincial Hospital, PHC, Health Post)")
    total_beds: int = Field(..., description="Total licensed inpatient beds")
    operational_beds: int = Field(..., description="Currently active functional beds")
    icu_beds: int = Field(default=0, description="Intensive Care Unit (ICU) beds")
    ventilators: int = Field(default=0, description="Functional mechanical ventilators")
    antivenom_stock: str = Field(default="Available", description="Terai monsoon snakebite antivenom status")
    flood_status: str = Field(default="operational", description="operational | submerged_ground_floor | inoperable")
    phone: str = Field(default="+977-1155", description="Emergency telephone contact")


class DiseaseRisk(BaseModel):
    disease: str = Field(..., description="Pathogen / condition name (e.g., Cholera, Leptospirosis, Snakebite)")
    risk_level: str = Field(..., description="critical | high | moderate | low")
    preventive_measures: str = Field(..., description="Actionable field mitigation directives")


class DailyReliefNeeds(BaseModel):
    potable_water_litres: int = Field(..., description="WHO standard minimum safe drinking water (3L/person/day)")
    food_ration_packets: int = Field(..., description="Daily dry emergency food packets needed")
    ors_sachets: int = Field(..., description="Oral Rehydration Salts sachets needed")
    water_purification_tabs: int = Field(..., description="Aquatabs / chlorine water purification tablets")


class SettlementDossierRequest(BaseModel):
    settlement_name: str = Field(..., description="Name of village, town, or city")
    district: str = Field(..., description="One of the 21 Nepal Terai districts")
    is_flooded: bool = Field(default=False, description="Whether the settlement is currently inundated")
    flood_depth_meters: Optional[float] = Field(default=None, description="Water depth if inundated")
    gemini_api_key: Optional[str] = Field(default=None, description="Optional user-provided Gemini API key override")


class SettlementDossierResponse(BaseModel):
    settlement_name: str
    district: str
    basin: str
    total_population: int
    is_flooded: bool
    flood_depth_meters: Optional[float] = None
    vulnerable_demographics: VulnerableDemographics
    healthcare_facilities: List[HealthcareFacility]
    disease_risks: List[DiseaseRisk]
    daily_relief_needs: DailyReliefNeeds
    logistics_advice: str
    executive_summary: str
    data_source: str = Field(default="gemini_1.5_flash", description="gemini_1.5_flash | empirical_terai_cache")
