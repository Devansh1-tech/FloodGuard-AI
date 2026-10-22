"""
agricultural_loss.py — Agricultural Crop Exposure & Economic Loss Valuation
=============================================================================

Resolves Weakness 11: "Omission of Agricultural & Economic Crop Loss Valuation"
Quantifies monsoon paddy (Dhan), sugarcane, and vegetable acreage submerged by floodwaters,
calculating crop yield losses (metric tons) and monetary damage in Nepalese Rupees (NPR).

Agricultural Economic Parameters (Nepal Ministry of Agriculture & Livestock Development):
- Monsoon Paddy Yield: 3.85 metric tons / hectare
- Coarse Paddy Minimum Support Price (MSP): NPR 33,620 / metric ton (NPR 3,362 / quintal)
- Sugarcane Yield: 46.0 metric tons / hectare
- Sugarcane Government Support Price: NPR 5,650 / metric ton
- Farm Labor Replacement Factor: 1.15
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, Any, List
import numpy as np

from SettlementImpactEngine.utils.logger import get_logger, LogTimer

logger = get_logger(__name__)


@dataclass
class AgriculturalLossReport:
    """Summary of agricultural crop exposure and economic losses."""
    sector_id: str
    total_flooded_cropland_hectares: float
    paddy_flooded_hectares: float
    sugarcane_flooded_hectares: float
    vegetable_cashcrops_hectares: float
    lost_paddy_yield_metric_tons: float
    lost_sugarcane_yield_metric_tons: float
    total_economic_loss_npr: float
    total_economic_loss_crores_npr: float
    affected_farming_households: int
    food_security_deficit_months: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AgriculturalLossEvaluator:
    """
    Evaluates agricultural damage from flood extents and inundation persistence.
    """

    def __init__(
        self,
        paddy_msp_npr_per_ton: float = 33620.0,
        sugarcane_price_npr_per_ton: float = 5650.0,
        avg_farm_size_ha: float = 0.85,
    ) -> None:
        self.paddy_msp = paddy_msp_npr_per_ton
        self.sugarcane_price = sugarcane_price_npr_per_ton
        self.avg_farm_size = avg_farm_size_ha

    def evaluate_sector_loss(
        self,
        sector_id: str,
        total_flood_area_km2: float,
        cropland_fraction: float = 0.68, # 68% of Nepal Terai floodplain is active arable land
    ) -> AgriculturalLossReport:
        """
        Calculates crop destruction and economic loss in Nepalese Rupees (NPR).
        """
        with LogTimer(f"Agricultural Economic Valuation ({sector_id})", logger):
            # 1 km² = 100 hectares
            flooded_cropland_ha = round(total_flood_area_km2 * 100.0 * cropland_fraction, 1)

            # Terai cropping breakdown during monsoon: ~72% Paddy, ~18% Sugarcane, ~10% Cash Crops
            paddy_ha = round(flooded_cropland_ha * 0.72, 1)
            sugarcane_ha = round(flooded_cropland_ha * 0.18, 1)
            veg_ha = round(flooded_cropland_ha * 0.10, 1)

            # Yield losses
            paddy_tons = round(paddy_ha * 3.85, 1)
            sugarcane_tons = round(sugarcane_ha * 46.0, 1)

            # Monetary damage in NPR
            paddy_loss_npr = paddy_tons * self.paddy_msp
            sugarcane_loss_npr = sugarcane_tons * self.sugarcane_price
            veg_loss_npr = veg_ha * 125000.0 # avg vegetable production cost/loss NPR 125k/ha

            total_npr = round(paddy_loss_npr + sugarcane_loss_npr + veg_loss_npr, 2)
            crores_npr = round(total_npr / 10000000.0, 2) # 1 Crore = 10 Million NPR

            households = int(round(flooded_cropland_ha / self.avg_farm_size))
            
            # Deficit: each 1,000 tons of lost rice creates ~2.5 months deficit for 10,000 residents
            deficit_months = round(min(12.0, (paddy_tons / 4500.0) * 1.8), 1)

            logger.info(
                f"Agricultural Assessment Completed for {sector_id}: "
                f"{flooded_cropland_ha:,.1f} ha damaged. Paddy: {paddy_tons:,.1f} tons. "
                f"Total Economic Loss: NPR {crores_npr:.2f} Crores (NPR {total_npr:,.0f}). "
                f"Impacted Households: {households:,}."
            )

            return AgriculturalLossReport(
                sector_id=sector_id,
                total_flooded_cropland_hectares=flooded_cropland_ha,
                paddy_flooded_hectares=paddy_ha,
                sugarcane_flooded_hectares=sugarcane_ha,
                vegetable_cashcrops_hectares=veg_ha,
                lost_paddy_yield_metric_tons=paddy_tons,
                lost_sugarcane_yield_metric_tons=sugarcane_tons,
                total_economic_loss_npr=total_npr,
                total_economic_loss_crores_npr=crores_npr,
                affected_farming_households=households,
                food_security_deficit_months=deficit_months,
            )
