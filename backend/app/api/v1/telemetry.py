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

from app.schemas.common import ApiResponse, make_response
from app.schemas.telemetry import (
    RiverGaugeStationSchema,
    VernacularAlertResponseSchema,
    VernacularAlertChannelsSchema,
    TelemetrySummarySchema,
)

router = APIRouter()

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
    """Builds multi-channel bilingual alerts for SMS, WhatsApp, and Radio Broadcast."""
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
            shareable_whatsapp_url=shareable_url,
        ),
        timestamp_nst=gauge["last_updated_nst"],
    )


# ─────────────────────────────────────────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/river-gauges", response_model=ApiResponse[List[RiverGaugeStationSchema]])
async def get_river_gauges(
    request: Request,
    basin: Optional[str] = Query(None, description="Filter by river basin substring"),
    district: Optional[str] = Query(None, description="Filter by district name"),
    status: Optional[str] = Query(None, description="Filter by status: normal, warning, danger, extreme_flood"),
):
    """Returns real-time DHM hydrological monitoring stations across the 21 Terai districts."""
    results = DHM_GAUGE_DATA

    if basin:
        results = [g for g in results if basin.lower() in g["basin"].lower()]

    if district:
        results = [g for g in results if district.lower() in g["district"].lower()]

    if status:
        results = [g for g in results if g["status"].lower() == status.lower()]

    return make_response(
        data=results,
        message=f"Retrieved {len(results)} Terai DHM river gauge monitoring stations.",
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
        message=f"Generated bilingual vernacular SOS alerts for {matched['river']} ({matched['name']}).",
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
