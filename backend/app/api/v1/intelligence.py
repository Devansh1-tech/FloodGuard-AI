"""
intelligence.py — AI Demographics & Healthcare Intelligence Endpoints (Stage 5.5)
==================================================================================

Endpoints implementing User Requirements 5 & 6:
- Population headcounts & vulnerable groups (infants, elderly, pregnant women).
- Healthcare facilities, bed capacities, ICU/ventilators, and snakebite antivenom stocks.
- Disease risk profiling (Cholera, Snakebite, Dengue) and emergency supply calculations.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from app.schemas.common import ApiResponse, make_response
from app.schemas.intelligence import (
    SettlementDossierRequest,
    SettlementDossierResponse,
)
from app.services.gemini_intelligence import gemini_intelligence_service

router = APIRouter(prefix="/intelligence", tags=["AI Demographics & Healthcare"])


@router.post("/settlement-dossier", response_model=ApiResponse[SettlementDossierResponse])
async def get_settlement_dossier(
    request: SettlementDossierRequest,
) -> ApiResponse[SettlementDossierResponse]:
    """
    Fetch comprehensive AI demographic breakdown, vulnerable citizen headcounts,
    and local hospital operational status for any Terai settlement.
    """
    try:
        dossier = await gemini_intelligence_service.get_settlement_dossier(request)
        return make_response(
            data=dossier,
            message=f"Dossier generated successfully for {request.settlement_name} ({request.district}) via {dossier.data_source}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate settlement dossier: {str(e)}",
        )


@router.get("/status", response_model=ApiResponse[dict])
async def get_intelligence_status() -> ApiResponse[dict]:
    """
    Health and capability check for the Gemini Demographic & Healthcare Service.
    """
    has_api_key = bool(gemini_intelligence_service.api_key)
    return make_response(
        data={
            "service": "Gemini 1.5 Demographic & Healthcare Intelligence",
            "model": gemini_intelligence_service.model,
            "has_configured_api_key": has_api_key,
            "offline_empirical_engine": "ACTIVE (Covers all 21 Terai districts)",
            "supported_features": [
                "Population headcounts & vulnerable citizen extraction",
                "Hospital bed & ICU capacity tracking",
                "Monsoon snakebite antivenom stock monitor",
                "Daily emergency water (WHO 3L/day) & ration calculator",
            ],
        },
        message="AI Demographic & Healthcare intelligence engine is online and operational.",
    )
