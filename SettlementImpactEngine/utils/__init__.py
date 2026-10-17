"""
SettlementImpactEngine utilities — logging, CRS transformations, geometry repairs.
"""

from SettlementImpactEngine.utils.logger import get_logger, LogTimer
from SettlementImpactEngine.utils.crs import (
    ensure_crs,
    to_projected,
    to_geographic,
    get_utm_epsg_for_bounds,
    DEFAULT_GEOGRAPHIC_CRS,
    DEFAULT_PROJECTED_CRS,
)
from SettlementImpactEngine.utils.geometry import (
    fix_invalid_geometries,
    safe_intersection,
    calculate_precise_area_km2,
    calculate_precise_length_km,
    dissolve_flood_footprint,
)

__all__ = [
    "get_logger",
    "LogTimer",
    "ensure_crs",
    "to_projected",
    "to_geographic",
    "get_utm_epsg_for_bounds",
    "DEFAULT_GEOGRAPHIC_CRS",
    "DEFAULT_PROJECTED_CRS",
    "fix_invalid_geometries",
    "safe_intersection",
    "calculate_precise_area_km2",
    "calculate_precise_length_km",
    "dissolve_flood_footprint",
]
