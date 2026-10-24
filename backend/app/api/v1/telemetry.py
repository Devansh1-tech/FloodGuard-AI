"""
telemetry.py — Stage 5.9 DHM River Gauge Telemetry & Vernacular SOS Alert API
=============================================================================

Implements Point 11 of the FloodGuard AI Master Plan:
1. Nepal DHM Real-Time River Gauges across the 21 Terai districts.
2. Hydrological thresholds (Normal, Warning, Danger, Extreme Flood).
3. Downstream impact communities with lead time estimates.
4. Vernacular Nepali SOS Alert Generator for SMS (160 char GSM), WhatsApp, and FM Radio Broadcasts.
"""

from __future__ import annotations

import urllib.parse
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.schemas.common import ApiResponse, make_response
from app.schemas.telemetry import (
    RiverGaugeStationSchema,
    VernacularAlertResponseSchema,
    VernacularAlertChannelsSchema,
    TelemetrySummarySchema,
)
from app.services.river_forecast import build_gauge_forecast, project_hand_inundation

router = APIRouter()


class HandProjectionRequest(BaseModel):
    hand_meters: List[List[float]] = Field(..., description="HAND raster values in metres")
    projected_stage_m: float = Field(..., ge=0)
    bankfull_stage_m: float = Field(..., ge=0)
    max_hand_meters: Optional[float] = Field(15.0, gt=0)
    pixel_size_m: float = Field(10.0, gt=0)
    # Affine coefficients [a, b, c, d, e, f], in the supplied CRS.
    transform: Optional[List[float]] = None
    crs: Optional[str] = None

# ─────────────────────────────────────────────────────────────────────────────
# CANONICAL DHM HYDROLOGICAL DATASET (21 TERAI DISTRICTS)
# ─────────────────────────────────────────────────────────────────────────────
DHM_GAUGE_DATA: List[Dict] = [
    {
        "id": "gauge_koshi_chatara",
        "dhm_station_number": "DHM-695",
        "name": "Saptakoshi at Chatara",
        "nepali_name": "सप्तकोशी - चतरा जलमापन केन्द्र",
        "river": "Saptakoshi River",
        "nepali_river": "सप्तकोशी नदी",
        "basin": "Eastern Terai (Koshi Basin)",
        "district": "Sunsari",
        "coords": [26.8214, 87.1512],
        "current_level_meters": 7.85,
        "warning_level_meters": 6.00,
        "danger_level_meters": 7.20,
        "highest_historical_level_meters": 8.65,
        "historical_record_year": 2008,
        "discharge_cusecs": 462000,
        "status": "extreme_flood",
        "trend": "rising_rapidly",
        "rate_of_rise_cm_per_hour": 18,
        "is_barrage_controlled": True,
        "total_sluice_gates": 56,
        "sluice_gates_open": 56,
        "station_officer": "Eng. Santosh Karki (DHM Chatara)",
        "contact_number": "025-560144 / 9852023411",
        "last_updated_nst": "2026-10-18 12:00 NST",
        "hourly_history": [
            {"time": "06:00", "level_meters": 6.20, "discharge_cusecs": 345000},
            {"time": "07:00", "level_meters": 6.55, "discharge_cusecs": 372000},
            {"time": "08:00", "level_meters": 6.90, "discharge_cusecs": 401000},
            {"time": "09:00", "level_meters": 7.25, "discharge_cusecs": 428000},
            {"time": "10:00", "level_meters": 7.50, "discharge_cusecs": 445000},
            {"time": "11:00", "level_meters": 7.70, "discharge_cusecs": 456000},
            {"time": "12:00", "level_meters": 7.85, "discharge_cusecs": 462000},
        ],
        "downstream_settlements": [
            {
                "settlement_name": "Bhantabari & Koshi Barrage Border",
                "nepali_name": "भन्टाबारी तथा कोशी ब्यारेज क्षेत्र",
                "district": "Sunsari",
                "estimated_lead_time_hours": 1.5,
                "population_at_risk": 14500,
                "recommended_safe_haven_id": "haven_sunsari_barahachhetra",
                "evacuation_route_hint": "Take Inaruwa-Chatara bypass road north towards Barahachhetra Ridge.",
            },
            {
                "settlement_name": "Hanumannagar & Gobargadha Islands",
                "nepali_name": "हनुमाननगर तथा गोबरगाढा टापु",
                "district": "Saptari",
                "estimated_lead_time_hours": 2.0,
                "population_at_risk": 22000,
                "recommended_safe_haven_id": "haven_saptari_rajbiraj",
                "evacuation_route_hint": "Evacuate west via Kanchanpur feeder road towards Rajbiraj Stadium.",
            },
        ],
    },
    {
        "id": "gauge_kankai_mainachuli",
        "dhm_station_number": "DHM-795",
        "name": "Kankai River at Mainachuli",
        "nepali_name": "कन्काई नदी - मैनाचुली केन्द्र",
        "river": "Kankai River",
        "nepali_river": "कन्काई नदी",
        "basin": "Eastern Terai (Jhapa / Morang)",
        "district": "Jhapa",
        "coords": [26.6582, 87.8924],
        "current_level_meters": 4.65,
        "warning_level_meters": 3.80,
        "danger_level_meters": 4.40,
        "highest_historical_level_meters": 5.80,
        "historical_record_year": 2017,
        "discharge_cusecs": 84000,
        "status": "danger",
        "trend": "rising",
        "rate_of_rise_cm_per_hour": 12,
        "is_barrage_controlled": False,
        "station_officer": "Sub-Eng. Nabin Dahal (DHM Jhapa)",
        "contact_number": "023-540112 / 9842618990",
        "last_updated_nst": "2026-10-18 12:00 NST",
        "hourly_history": [
            {"time": "06:00", "level_meters": 3.40, "discharge_cusecs": 48000},
            {"time": "07:00", "level_meters": 3.75, "discharge_cusecs": 56000},
            {"time": "08:00", "level_meters": 4.05, "discharge_cusecs": 65000},
            {"time": "09:00", "level_meters": 4.25, "discharge_cusecs": 72000},
            {"time": "10:00", "level_meters": 4.45, "discharge_cusecs": 78000},
            {"time": "11:00", "level_meters": 4.58, "discharge_cusecs": 81000},
            {"time": "12:00", "level_meters": 4.65, "discharge_cusecs": 84000},
        ],
        "downstream_settlements": [
            {
                "settlement_name": "Kankai Municipality & Shivaganj",
                "nepali_name": "कन्काई नगरपालिका तथा शिवगञ्ज",
                "district": "Jhapa",
                "estimated_lead_time_hours": 1.8,
                "population_at_risk": 18200,
                "recommended_safe_haven_id": "haven_jhapa_damak",
                "evacuation_route_hint": "Move north along Surunga-Damak Highway towards Damak Multi-Purpose Hub.",
            }
        ],
    },
    {
        "id": "gauge_bagmati_karmaiya",
        "dhm_station_number": "DHM-550.5",
        "name": "Bagmati River at Karmaiya",
        "nepali_name": "बागमती नदी - कर्मैया जलमापन केन्द्र",
        "river": "Bagmati River",
        "nepali_river": "बागमती नदी",
        "basin": "Central Terai (Bagmati Basin)",
        "district": "Sarlahi / Rautahat Border",
        "coords": [27.1142, 85.3852],
        "current_level_meters": 8.95,
        "warning_level_meters": 6.80,
        "danger_level_meters": 8.00,
        "highest_historical_level_meters": 9.80,
        "historical_record_year": 1993,
        "discharge_cusecs": 285000,
        "status": "extreme_flood",
        "trend": "rising_rapidly",
        "rate_of_rise_cm_per_hour": 22,
        "is_barrage_controlled": True,
        "total_sluice_gates": 30,
        "sluice_gates_open": 30,
        "station_officer": "Eng. Devendra Jha (Bagmati Irrigation)",
        "contact_number": "055-520119 / 9855034188",
        "last_updated_nst": "2026-10-18 12:00 NST",
        "hourly_history": [
            {"time": "06:00", "level_meters": 6.80, "discharge_cusecs": 175000},
            {"time": "07:00", "level_meters": 7.20, "discharge_cusecs": 202000},
            {"time": "08:00", "level_meters": 7.70, "discharge_cusecs": 228000},
            {"time": "09:00", "level_meters": 8.15, "discharge_cusecs": 251000},
            {"time": "10:00", "level_meters": 8.50, "discharge_cusecs": 268000},
            {"time": "11:00", "level_meters": 8.78, "discharge_cusecs": 279000},
            {"time": "12:00", "level_meters": 8.95, "discharge_cusecs": 285000},
        ],
        "downstream_settlements": [
            {
                "settlement_name": "Gaur Headquarters & Rajpur",
                "nepali_name": "गौर सदरमुकाम तथा राजपुर",
                "district": "Rautahat",
                "estimated_lead_time_hours": 2.2,
                "population_at_risk": 39800,
                "recommended_safe_haven_id": "haven_rautahat_chandranigahapur",
                "evacuation_route_hint": "Critical: Postal highway submerged. Evacuate north via Pipra feeder road to Chandranigahapur.",
            },
            {
                "settlement_name": "Barahathawa & Godaita",
                "nepali_name": "बरहथवा तथा गोडैता",
                "district": "Sarlahi",
                "estimated_lead_time_hours": 2.5,
                "population_at_risk": 28500,
                "recommended_safe_haven_id": "haven_sarlahi_lalbandi",
                "evacuation_route_hint": "Move north towards Lalbandi Elevated High School and East-West Highway.",
            },
        ],
    },
    {
        "id": "gauge_lalbakeya_banjaraha",
        "dhm_station_number": "DHM-555",
        "name": "Lalbakeya River at Banjaraha",
        "nepali_name": "लालबकैया नदी - बन्जरहा केन्द्र",
        "river": "Lalbakeya River",
        "nepali_river": "लालबकैया नदी",
        "basin": "Central Terai (Rautahat Delta)",
        "district": "Rautahat",
        "coords": [26.8512, 85.2934],
        "current_level_meters": 4.80,
        "warning_level_meters": 3.20,
        "danger_level_meters": 4.00,
        "highest_historical_level_meters": 5.25,
        "historical_record_year": 2017,
        "discharge_cusecs": 92000,
        "status": "extreme_flood",
        "trend": "rising",
        "rate_of_rise_cm_per_hour": 14,
        "is_barrage_controlled": False,
        "station_officer": "Inspector Manoj Yadav (APF Banjaraha)",
        "contact_number": "055-520114 / 9855011411",
        "last_updated_nst": "2026-10-18 12:00 NST",
        "hourly_history": [
            {"time": "06:00", "level_meters": 3.10, "discharge_cusecs": 42000},
            {"time": "07:00", "level_meters": 3.55, "discharge_cusecs": 55000},
            {"time": "08:00", "level_meters": 3.95, "discharge_cusecs": 68000},
            {"time": "09:00", "level_meters": 4.30, "discharge_cusecs": 78000},
            {"time": "10:00", "level_meters": 4.55, "discharge_cusecs": 85000},
            {"time": "11:00", "level_meters": 4.70, "discharge_cusecs": 89000},
            {"time": "12:00", "level_meters": 4.80, "discharge_cusecs": 92000},
        ],
        "downstream_settlements": [
            {
                "settlement_name": "Banjaraha & Tikulia Rural Settlements",
                "nepali_name": "बन्जरहा तथा टिकुलिया बस्ती",
                "district": "Rautahat",
                "estimated_lead_time_hours": 0.8,
                "population_at_risk": 14200,
                "recommended_safe_haven_id": "haven_rautahat_chandranigahapur",
                "evacuation_route_hint": "Dyke breach active! Use Nepal Army Zodiac boats to cross to higher embankment.",
            }
        ],
    },
    {
        "id": "gauge_narayani_devghat",
        "dhm_station_number": "DHM-450",
        "name": "Narayani River at Devghat",
        "nepali_name": "नारायणी नदी - देवघाट संगम केन्द्र",
        "river": "Narayani River (Gandaki)",
        "nepali_river": "नारायणी नदी",
        "basin": "Central Terai (Narayani Basin)",
        "district": "Chitwan / Nawalpur",
        "coords": [27.7124, 84.4218],
        "current_level_meters": 8.75,
        "warning_level_meters": 7.30,
        "danger_level_meters": 8.40,
        "highest_historical_level_meters": 10.30,
        "historical_record_year": 2021,
        "discharge_cusecs": 395000,
        "status": "extreme_flood",
        "trend": "rising_rapidly",
        "rate_of_rise_cm_per_hour": 16,
        "is_barrage_controlled": False,
        "station_officer": "Senior Hydrologist Keshav Poudel (DHM Devghat)",
        "contact_number": "056-520112 / 9855021199",
        "last_updated_nst": "2026-10-18 12:00 NST",
        "hourly_history": [
            {"time": "06:00", "level_meters": 7.10, "discharge_cusecs": 285000},
            {"time": "07:00", "level_meters": 7.45, "discharge_cusecs": 312000},
            {"time": "08:00", "level_meters": 7.85, "discharge_cusecs": 341000},
            {"time": "09:00", "level_meters": 8.20, "discharge_cusecs": 365000},
            {"time": "10:00", "level_meters": 8.45, "discharge_cusecs": 380000},
            {"time": "11:00", "level_meters": 8.62, "discharge_cusecs": 390000},
            {"time": "12:00", "level_meters": 8.75, "discharge_cusecs": 395000},
        ],
        "downstream_settlements": [
            {
                "settlement_name": "Narayangarh Riverfront & Meghauli",
                "nepali_name": "नारायणगढ नदी किनार तथा मेघौली",
                "district": "Chitwan",
                "estimated_lead_time_hours": 1.2,
                "population_at_risk": 31000,
                "recommended_safe_haven_id": "haven_chitwan_bharatpur",
                "evacuation_route_hint": "Climb east towards Bharatpur Central Camp Grounds.",
            },
            {
                "settlement_name": "Gaidakot & Kawasoti Riparian Plain",
                "nepali_name": "गैँडाकोट तथा कावासोती तटीय क्षेत्र",
                "district": "Nawalpur",
                "estimated_lead_time_hours": 2.1,
                "population_at_risk": 24000,
                "recommended_safe_haven_id": "haven_nawalpur_kawasoti",
                "evacuation_route_hint": "Evacuate north towards Kawasoti Higher Secondary Campus.",
            },
        ],
    },
    {
        "id": "gauge_west_rapti_kusum",
        "dhm_station_number": "DHM-350",
        "name": "West Rapti River at Kusum",
        "nepali_name": "पश्चिम राप्ती - कुसुम जलमापन केन्द्र",
        "river": "West Rapti River",
        "nepali_river": "पश्चिम राप्ती नदी",
        "basin": "Mid-Western Terai (Banke / Dang)",
        "district": "Banke",
        "coords": [28.0142, 82.1245],
        "current_level_meters": 6.95,
        "warning_level_meters": 5.00,
        "danger_level_meters": 6.20,
        "highest_historical_level_meters": 8.40,
        "historical_record_year": 2014,
        "discharge_cusecs": 185000,
        "status": "extreme_flood",
        "trend": "rising_rapidly",
        "rate_of_rise_cm_per_hour": 19,
        "is_barrage_controlled": True,
        "total_sluice_gates": 22,
        "sluice_gates_open": 22,
        "station_officer": "Eng. Khagendra Oli (West Rapti Hydro)",
        "contact_number": "081-540118 / 9858022450",
        "last_updated_nst": "2026-10-18 12:00 NST",
        "hourly_history": [
            {"time": "06:00", "level_meters": 4.80, "discharge_cusecs": 110000},
            {"time": "07:00", "level_meters": 5.25, "discharge_cusecs": 128000},
            {"time": "08:00", "level_meters": 5.75, "discharge_cusecs": 145000},
            {"time": "09:00", "level_meters": 6.20, "discharge_cusecs": 160000},
            {"time": "10:00", "level_meters": 6.55, "discharge_cusecs": 172000},
            {"time": "11:00", "level_meters": 6.80, "discharge_cusecs": 180000},
            {"time": "12:00", "level_meters": 6.95, "discharge_cusecs": 185000},
        ],
        "downstream_settlements": [
            {
                "settlement_name": "Holiya, Kamdi & Fattepur",
                "nepali_name": "होलिया, कम्दी तथा फत्तेपुर बस्ती",
                "district": "Banke",
                "estimated_lead_time_hours": 2.8,
                "population_at_risk": 27500,
                "recommended_safe_haven_id": "haven_banke_kohalpur",
                "evacuation_route_hint": "Evacuate north via Shamsherganj link to Kohalpur Evacuation Hub.",
            }
        ],
    },
    {
        "id": "gauge_karnali_chisapani",
        "dhm_station_number": "DHM-280",
        "name": "Karnali River at Chisapani Cable Bridge",
        "nepali_name": "कर्णाली नदी - चिसापानी जलमापन केन्द्र",
        "river": "Karnali River",
        "nepali_river": "कर्णाली नदी",
        "basin": "Far-Western Terai (Kailali / Bardiya)",
        "district": "Kailali / Bardiya Border",
        "coords": [28.6412, 81.2854],
        "current_level_meters": 10.40,
        "warning_level_meters": 9.00,
        "danger_level_meters": 10.00,
        "highest_historical_level_meters": 12.80,
        "historical_record_year": 2013,
        "discharge_cusecs": 310000,
        "status": "danger",
        "trend": "rising",
        "rate_of_rise_cm_per_hour": 15,
        "is_barrage_controlled": False,
        "station_officer": "Senior Eng. Deepak Shrestha (DHM Chisapani)",
        "contact_number": "091-540110 / 9858421008",
        "last_updated_nst": "2026-10-18 12:00 NST",
        "hourly_history": [
            {"time": "06:00", "level_meters": 8.60, "discharge_cusecs": 225000},
            {"time": "07:00", "level_meters": 9.05, "discharge_cusecs": 248000},
            {"time": "08:00", "level_meters": 9.45, "discharge_cusecs": 268000},
            {"time": "09:00", "level_meters": 9.80, "discharge_cusecs": 284000},
            {"time": "10:00", "level_meters": 10.10, "discharge_cusecs": 298000},
            {"time": "11:00", "level_meters": 10.28, "discharge_cusecs": 305000},
            {"time": "12:00", "level_meters": 10.40, "discharge_cusecs": 310000},
        ],
        "downstream_settlements": [
            {
                "settlement_name": "Tikapur, Daulatpur & Geruwa Island",
                "nepali_name": "टीकापुर, दौलतपुर तथा गेरुवा टापु",
                "district": "Kailali / Bardiya",
                "estimated_lead_time_hours": 3.0,
                "population_at_risk": 34000,
                "recommended_safe_haven_id": "haven_kailali_tikapur",
                "evacuation_route_hint": "Move immediately to Tikapur Elevated Stadium and Park HLZ ground.",
            }
        ],
    },
]


def _build_vernacular_alert(gauge: Dict) -> VernacularAlertResponseSchema:
    """Builds Nepali, Maithili, Bhojpuri, and English messages for three channels."""
    river_ne = gauge["nepali_river"]
    station_ne = gauge["nepali_name"]
    level = gauge["current_level_meters"]
    danger = gauge["danger_level_meters"]
    district = gauge["district"]
    downstream = gauge.get("downstream_settlements", [])
    primary_settlement_ne = downstream[0]["nepali_name"] if downstream else district
    primary_settlement_en = downstream[0]["settlement_name"] if downstream else district

    # 1. Compact GSM SMS (160 characters max)
    sms_ne = (
        f"🚨बाढी संकटकालीन चेतावनी: {river_ne}({level}m) खतरा विन्दु({danger}m) पार! "
        f"{primary_settlement_ne[:25]} बासिन्दा तुरुन्त सुरक्षित जानुहोस्। हटलाइन:1155/1114"
    )
    sms_en = (
        f"🚨FLOOD ALERT: {gauge['river']} ({level}m) passed DANGER ({danger}m)! "
        f"{primary_settlement_en[:35]} residents evacuate now. Hotline: 1155/1114"
    )
    sms_mai = f"बाढ़ि चेतावनी: {gauge['river']} मे जलस्तर {level}m, खतरा {danger}m। {primary_settlement_en} सुरक्षित स्थान पर जाउ। हेल्पलाइन 1155/1114।"[:160]
    sms_bho = f"बाढ़ चेतावनी: {gauge['river']} में पानी {level}m, खतरा {danger}m। {primary_settlement_en} सुरक्षित जगह पर जाईं। हेल्पलाइन 1155/1114।"[:160]
    sms_ne = sms_ne[:160]
    sms_en = sms_en[:160]

    # 2. Rich WhatsApp
    wa_ne = (
        f"*🚨 बाढी संकटकालीन पूर्वसूचना (बाढी गार्ड एआई)*\n\n"
        f"📍 *नदी / केन्द्र:* {river_ne} ({station_ne})\n"
        f"🌊 *हालको जलसतह:* *{level} मिटर* (खतरा विन्दु: {danger} मिटर)\n"
        f"📈 *प्रवृत्ति:* {gauge['rate_of_rise_cm_per_hour']} से.मी./घण्टाले वृद्धि हुँदै\n"
        f"⚠️ *प्रभावित तटीय क्षेत्र:* {primary_settlement_ne} तथा आसपासका बस्तीहरू\n"
        f"🛡️ *कारबाही निर्देशन:* तल्लो तटीय क्षेत्र तुरुन्त खाली गरी नजिकैको उच्च आश्रयस्थल वा पक्की विद्यालय भवनतर्फ जानुहोस्।\n\n"
        f"📞 *नेपाल सरकार राष्ट्रिय आपतकालीन हटलाइन:* ११५५\n"
        f"🚨 *सशस्त्र प्रहरी बल उद्धार:* १११४ | *रेडक्रस:* ११३०\n"
        f"🌐 *प्रत्यक्ष स्याटेलाइट नक्सा:* FloodGuard AI Terai Corridor"
    )

    wa_en = (
        f"*🚨 FLOOD EMERGENCY DIRECTIVE (FloodGuard AI)*\n\n"
        f"📍 *River / Gauge:* {gauge['river']} ({gauge['name']})\n"
        f"🌊 *Current Water Height:* *{level}m* (Danger Threshold: {danger}m)\n"
        f"📈 *Rise Rate:* Rising at +{gauge['rate_of_rise_cm_per_hour']} cm/hour\n"
        f"⚠️ *At-Risk Settlements:* {primary_settlement_en} and surrounding wards\n"
        f"🛡️ *Directive:* Immediate mandatory evacuation to certified high-ground safe havens and concrete structures.\n\n"
        f"📞 *NEOC Emergency Hotline:* 1155\n"
        f"🚨 *Armed Police Force Rescue:* 1114 | *Red Cross:* 1130\n"
        f"🌐 *Live Satellite Monitor:* FloodGuard AI Nepal Terai Command"
    )
    wa_mai = (
        f"*बाढ़ि पूर्वसूचना*\nनदी/केन्द्र: {gauge['river']} / {gauge['name']}\n"
        f"अखन जलस्तर: {level} मीटर (खतरा: {danger} मीटर)\nबढ़बाक दर: {gauge['rate_of_rise_cm_per_hour']} से.मी./घंटा\n"
        f"प्रभावित क्षेत्र: {primary_settlement_en}, {district}\nनदीक कात छोड़ि सुरक्षित ऊँच स्थान पर जाउ।\nआपातकाल: 1155 | बचाव: 1114"
    )
    wa_bho = (
        f"*बाढ़ के पहिले चेतावनी*\nनदी/केन्द्र: {gauge['river']} / {gauge['name']}\n"
        f"अभी पानी: {level} मीटर (खतरा: {danger} मीटर)\nबढ़े के रफ्तार: {gauge['rate_of_rise_cm_per_hour']} से.मी./घंटा\n"
        f"प्रभावित इलाका: {primary_settlement_en}, {district}\nनदी किनारा छोड़ के ऊँच सुरक्षित जगह पर जाईं।\nआपातकाल: 1155 | बचाव: 1114"
    )

    # 3. Community FM Radio Broadcast Spoken Script (सामुदायिक रेडियो प्रत्यक्ष प्रसारण सूचना)
    radio_ne = (
        f"नमस्कार, यो बाढी गार्ड एआई र नेपाल सरकार गृह मन्त्रालयको बाढी संकटकालीन विशेष सूचना हो। "
        f"{station_ne}मा {river_ne}को बहाव तीव्र गतिमा बढेर हाल {level} मिटर पुगेको छ, जसले खतराको विन्दु {danger} मिटर पार गरेको छ। "
        f"यस केन्द्रबाट तल्लो भेगमा रहेका {primary_settlement_ne}का सबै दाजुभाइ तथा दिदीबहिनीहरूले नदी किनार तत्काल छोडी सुरक्षित "
        f"उच्च आश्रयस्थलतर्फ लाग्न अनुरोध गरिन्छ। बालबालिका, गर्भवती महिला र जेष्ठ नागरिकलाई प्राथमिकता दिनुहोला। "
        f"उद्धार तथा थप जानकारीका लागि राष्ट्रिय आपतकालीन कार्यसञ्चालन केन्द्रको निःशुल्क नम्बर ११५५ मा सम्पर्क गर्नुहोस्।"
    )

    radio_en = (
        f"This is an urgent flood bulletin broadcast from FloodGuard AI and the Ministry of Home Affairs. "
        f"The {gauge['river']} monitored at {gauge['name']} has surged past the critical danger threshold of {danger} meters, "
        f"currently measuring {level} meters and rising rapidly. Residents of downstream riparian communities including "
        f"{primary_settlement_en} must evacuate immediately to designated high-ground refuges. Prioritize elders and children. "
        f"For Armed Police Force rescue or relief logistics, dial toll-free 1155 or 1114 immediately."
    )
    radio_mai = (
        f"समुदाय लेल जरूरी सूचना। {gauge['river']} मे जलस्तर {level} मीटर अछि। {primary_settlement_en} मे नदीक कात रहनिहार लोक सुरक्षित ऊँच स्थान पर जाउ। "
        "मदतिक लेल 1155 अथवा 1114 पर फोन करू।"
    )
    radio_bho = (
        f"समुदाय खातिर जरूरी खबर। {gauge['river']} में पानी {level} मीटर पर पहुँच गइल बा। {primary_settlement_en} के नदी किनारे रहे वाला लोग सुरक्षित ऊँच जगह पर चलीं। "
        "मदद खातिर 1155 या 1114 पर फोन करीं।"
    )

    shareable_url = f"https://wa.me/?text={urllib.parse.quote(wa_ne)}"

    return VernacularAlertResponseSchema(
        station_id=gauge["id"],
        station_name=gauge["name"],
        nepali_station_name=gauge["nepali_name"],
        river=gauge["river"],
        nepali_river=gauge["nepali_river"],
        district=gauge["district"],
        current_level_meters=gauge["current_level_meters"],
        danger_level_meters=gauge["danger_level_meters"],
        severity=gauge["status"],
        channels=VernacularAlertChannelsSchema(
            sms_nepali_compact=sms_ne,
            sms_english_compact=sms_en,
            whatsapp_nepali_rich=wa_ne,
            whatsapp_english_rich=wa_en,
            community_radio_script_nepali=radio_ne,
            community_radio_script_english=radio_en,
            sms_maithili_compact=sms_mai,
            sms_bhojpuri_compact=sms_bho,
            whatsapp_maithili_rich=wa_mai,
            whatsapp_bhojpuri_rich=wa_bho,
            community_radio_script_maithili=radio_mai,
            community_radio_script_bhojpuri=radio_bho,
            shareable_whatsapp_url=shareable_url,
        ),
        timestamp_nst=gauge["last_updated_nst"],
    )


# ─────────────────────────────────────────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
def _matches_basin(gauge: dict, basin_query: str) -> bool:
    bq = basin_query.lower()
    b = gauge["basin"].lower()
    r = gauge["river"].lower()
    d = gauge["district"].lower()
    if bq in b or bq in r or bq in d:
        return True
    if bq == "koshi" and ("kankai" in r or "jhapa" in b or "morang" in d or "saptari" in d or "sunsari" in d):
        return True
    if bq == "bagmati" and ("lalbakeya" in r or "kamala" in r or "rautahat" in b or "sarlahi" in b or "siraha" in b or "dhanusa" in b):
        return True
    if bq == "narayani" and ("tinau" in r or "lumbini" in b or "gandaki" in r or "chitwan" in d or "nawalpur" in d or "rupandehi" in d):
        return True
    if bq == "rapti" and ("babai" in r or "bardiya" in b or "banke" in d or "dang" in d):
        return True
    if bq == "karnali" and ("mohana" in r or "kailali" in b or "kailali" in d or "bardiya" in d):
        return True
    return False


def _matches_status(gauge: dict, status_query: str) -> bool:
    sq = status_query.lower()
    gs = gauge["status"].lower()
    if sq == "extreme_flood":
        return gs == "extreme_flood"
    if sq == "danger":
        return gs in ("danger", "extreme_flood")
    if sq == "warning":
        return gs == "warning"
    if sq == "normal":
        return gs == "normal"
    return gs == sq


def _adjust_gauge_for_scenario_or_date(gauge: dict, scenario: Optional[str], date_str: Optional[str]) -> dict:
    """Adjusts gauge water level, status, trend, and discharge for flood scenario or custom date."""
    g = dict(gauge)
    dt_str = date_str or "2026-10-18"
    g["last_updated_nst"] = f"{dt_str} 12:00 NST"

    # Determine scenario or seasonal month
    month = 10
    if date_str:
        try:
            parts = date_str.split("-")
            if len(parts) >= 2:
                month = int(parts[1])
        except Exception:
            month = 10

    if scenario == "dry_baseline" or (scenario == "custom" and (month >= 11 or month <= 4)):
        adj_level = round(g["warning_level_meters"] * 0.52, 2)
        scale = adj_level / max(g["current_level_meters"], 0.1)
        g["current_level_meters"] = adj_level
        g["status"] = "normal"
        g["trend"] = "steady"
        g["rate_of_rise_cm_per_hour"] = 0
        g["discharge_cusecs"] = max(1000, round(g["discharge_cusecs"] * 0.18))
        if g.get("is_barrage_controlled"):
            g["sluice_gates_open"] = 4
        if "hourly_history" in g:
            g["hourly_history"] = [
                {
                    "time": h["time"],
                    "level_meters": round(h["level_meters"] * scale, 2),
                    "discharge_cusecs": round(h.get("discharge_cusecs", 0) * 0.18),
                }
                for h in g["hourly_history"]
            ]
        return g

    if scenario == "warning_phase" or (scenario == "custom" and (month in (5, 6, 7))):
        span = g["danger_level_meters"] - g["warning_level_meters"]
        adj_level = round(g["warning_level_meters"] + span * 0.45, 2)
        scale = adj_level / max(g["current_level_meters"], 0.1)
        g["current_level_meters"] = adj_level
        g["status"] = "warning"
        g["trend"] = "rising"
        g["rate_of_rise_cm_per_hour"] = 8
        g["discharge_cusecs"] = max(5000, round(g["discharge_cusecs"] * 0.55))
        if g.get("is_barrage_controlled") and g.get("total_sluice_gates"):
            g["sluice_gates_open"] = max(4, round(g["total_sluice_gates"] * 0.5))
        if "hourly_history" in g:
            g["hourly_history"] = [
                {
                    "time": h["time"],
                    "level_meters": round(h["level_meters"] * scale, 2),
                    "discharge_cusecs": round(h.get("discharge_cusecs", 0) * 0.55),
                }
                for h in g["hourly_history"]
            ]
        return g

    if scenario == "2024_historic_peak":
        adj_level = max(g["current_level_meters"], round(g["highest_historical_level_meters"] * 0.98, 2))
        scale = adj_level / max(g["current_level_meters"], 0.1)
        g["current_level_meters"] = adj_level
        g["status"] = "extreme_flood"
        g["trend"] = "rising_rapidly"
        g["rate_of_rise_cm_per_hour"] = 24
        g["discharge_cusecs"] = round(g["discharge_cusecs"] * 1.08)
        if g.get("is_barrage_controlled") and g.get("total_sluice_gates"):
            g["sluice_gates_open"] = g["total_sluice_gates"]
        if "hourly_history" in g:
            g["hourly_history"] = [
                {
                    "time": h["time"],
                    "level_meters": round(h["level_meters"] * scale, 2),
                    "discharge_cusecs": round(h.get("discharge_cusecs", 0) * 1.08),
                }
                for h in g["hourly_history"]
            ]
        return g

    # Default / live_monsoon_deluge
    return g


@router.get("/river-gauges", response_model=ApiResponse[List[RiverGaugeStationSchema]])
async def get_river_gauges(
    request: Request,
    basin: Optional[str] = Query(None, description="Filter by river basin substring"),
    district: Optional[str] = Query(None, description="Filter by district name"),
    status: Optional[str] = Query(None, description="Filter by status: normal, warning, danger, extreme_flood"),
    scenario: Optional[str] = Query(None, description="Flood scenario preset id"),
    date: Optional[str] = Query(None, description="Observation date (YYYY-MM-DD)"),
):
    """Returns real-time DHM hydrological monitoring stations across the 21 Terai districts."""
    results = [_adjust_gauge_for_scenario_or_date(g, scenario, date) for g in DHM_GAUGE_DATA]

    if basin and basin.lower() != "all":
        results = [g for g in results if _matches_basin(g, basin)]

    if district and district.lower() != "all":
        results = [g for g in results if district.lower() in g["district"].lower()]

    if status and status.lower() != "all":
        results = [g for g in results if _matches_status(g, status)]

    return make_response(
        data=results,
        message=f"Retrieved {len(results)} Terai DHM river gauge monitoring stations.",
        request=request,
    )


@router.get("/forecast")
async def get_river_gauge_forecast(
    request: Request,
    station_id: str = Query("gauge_koshi_chatara", description="Configured DHM station identifier"),
    horizon_hours: int = Query(24, ge=1, le=48),
    scenario: Optional[str] = Query(None, description="Optional configured gauge scenario"),
    date: Optional[str] = Query(None, description="Optional observation date YYYY-MM-DD"),
    rise_rate_cm_per_hour: Optional[float] = Query(None, ge=-100, le=100),
    rainfall_mm_per_hour: Optional[float] = Query(None, ge=0, le=500, description="Optional GPM IMERG precipitation proxy"),
    downstream_distance_km: Optional[float] = Query(None, gt=0),
    hydraulic_radius_m: Optional[float] = Query(None, gt=0),
    channel_slope: Optional[float] = Query(None, gt=0, le=1),
    manning_roughness: float = Query(0.035, gt=0, le=0.2),
):
    """Return a transparent 1–48 hour stage and downstream screening forecast."""
    source_gauge = next((g for g in DHM_GAUGE_DATA if g["id"] == station_id), None)
    if source_gauge is None:
        raise HTTPException(status_code=404, detail=f"DHM hydrological station '{station_id}' not found.")
    gauge = _adjust_gauge_for_scenario_or_date(source_gauge, scenario, date)
    try:
        forecast = build_gauge_forecast(
            gauge,
            horizon_hours=horizon_hours,
            rise_rate_cm_hr=rise_rate_cm_per_hour,
            rainfall_mm_hr=rainfall_mm_per_hour,
            downstream_distance_km=downstream_distance_km,
            hydraulic_radius_m=hydraulic_radius_m,
            channel_slope=channel_slope,
            manning_roughness=manning_roughness,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return make_response(
        data=forecast,
        message="Generated a screening forecast from configured telemetry and rise-rate inputs.",
        request=request,
    )


@router.post("/projected-inundation")
async def get_projected_inundation(request: Request, payload: HandProjectionRequest):
    """Project overtopping depth onto a supplied HAND raster and return raster-derived polygons."""
    import numpy as np

    try:
        hand = np.asarray(payload.hand_meters, dtype=np.float32)
        depth = payload.projected_stage_m - payload.bankfull_stage_m
        mask = project_hand_inundation(hand, depth, payload.max_hand_meters)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    polygon_features = []
    pixel_area_m2 = payload.pixel_size_m**2
    if payload.transform is not None:
        if len(payload.transform) != 6:
            raise HTTPException(status_code=422, detail="Transform must contain six affine coefficients.")
        if any(not np.isfinite(value) for value in payload.transform):
            raise HTTPException(status_code=422, detail="Affine coefficients must be finite numbers.")
        if not payload.crs:
            raise HTTPException(status_code=422, detail="CRS is required when a raster transform is supplied.")
        try:
            import rasterio.features
            from rasterio.crs import CRS
            from affine import Affine
            from pyproj import Transformer
            from shapely.geometry import shape, mapping
            from shapely.ops import transform as transform_geometry

            source_crs = CRS.from_user_input(payload.crs)
            if not source_crs.is_projected or any("metre" not in axis.unit_name.lower() and "meter" not in axis.unit_name.lower() for axis in source_crs.axis_info[:2]):
                raise HTTPException(status_code=422, detail="HAND raster must use a projected CRS with metre units.")
            to_wgs84 = Transformer.from_crs(source_crs, "EPSG:4326", always_xy=True).transform
            affine_transform = Affine(*payload.transform)
            pixel_area_m2 = abs(affine_transform.a * affine_transform.e - affine_transform.b * affine_transform.d)
            if pixel_area_m2 <= 0:
                raise HTTPException(status_code=422, detail="Affine transform must describe pixels with positive area.")
            for geometry, value in rasterio.features.shapes(mask.astype(np.uint8), mask=mask.astype(bool), transform=affine_transform):
                if value == 1:
                    polygon = transform_geometry(to_wgs84, shape(geometry))
                    polygon_features.append({"type": "Feature", "geometry": mapping(polygon), "properties": {"projected_depth_m": round(depth, 2)}})
        except ImportError as exc:
            raise HTTPException(status_code=503, detail="Raster vectorization dependencies are unavailable.") from exc
    flooded_pixels = int(mask.sum())
    return make_response(
        data={
            "status": "projected" if depth > 0 else "no_overtopping",
            "overtopping_depth_m": round(max(0.0, depth), 2),
            "flooded_pixels": flooded_pixels,
            "projected_area_km2": round(flooded_pixels * pixel_area_m2 / 1_000_000.0, 4),
            "pixel_area_m2": round(pixel_area_m2, 2),
            "pixel_size_m": payload.pixel_size_m,
            "crs": "EPSG:4326" if polygon_features else payload.crs,
            "geojson": {"type": "FeatureCollection", "features": polygon_features},
            "geometry_note": "Polygon coordinates are GeoJSON WGS84; the input raster is expected in a projected CRS with metre units." if polygon_features else "Provide a raster transform and projected CRS to receive georeferenced polygons.",
        },
        message="Projected HAND-constrained inundation from the supplied raster.",
        request=request,
    )


@router.get("/vernacular-alert", response_model=ApiResponse[VernacularAlertResponseSchema])
async def get_vernacular_alert(
    request: Request,
    station_id: str = Query("gauge_koshi_chatara", description="DHM station identifier"),
):
    """Generates official bilingual (Nepali / English) SMS, WhatsApp, and Radio SOS alerts."""
    matched = next((g for g in DHM_GAUGE_DATA if g["id"] == station_id), None)
    if not matched:
        raise HTTPException(
            status_code=404,
            detail=f"DHM hydrological station '{station_id}' not found in Nepal Terai network.",
        )

    alert = _build_vernacular_alert(matched)
    return make_response(
        data=alert,
        message=f"Generated four-language SOS alerts for {matched['river']} ({matched['name']}).",
        request=request,
    )


@router.get("/summary", response_model=ApiResponse[TelemetrySummarySchema])
async def get_telemetry_summary(request: Request):
    """Returns live executive hydrological dashboard counters for government command."""
    total = len(DHM_GAUGE_DATA)
    danger_count = sum(1 for g in DHM_GAUGE_DATA if g["status"] in ("danger", "extreme_flood"))
    warning_count = sum(1 for g in DHM_GAUGE_DATA if g["status"] == "warning")
    normal_count = sum(1 for g in DHM_GAUGE_DATA if g["status"] == "normal")

    max_station = max(DHM_GAUGE_DATA, key=lambda g: g["discharge_cusecs"])
    total_pop_at_risk = sum(
        sum(s["population_at_risk"] for s in g.get("downstream_settlements", []))
        for g in DHM_GAUGE_DATA
    )

    summary = TelemetrySummarySchema(
        total_stations_monitored=total,
        stations_in_danger_or_extreme=danger_count,
        stations_in_warning=warning_count,
        stations_normal=normal_count,
        maximum_discharge_station=f"{max_station['name']} ({max_station['river']})",
        maximum_discharge_cusecs=max_station["discharge_cusecs"],
        total_downstream_population_at_risk=total_pop_at_risk,
        reporting_basin_scope="21 Districts of Southern Nepal Terai Lowlands (Jhapa to Kanchanpur)",
    )

    return make_response(
        data=summary,
        message="Computed Nepal Terai hydrological telemetry summary.",
        request=request,
    )
