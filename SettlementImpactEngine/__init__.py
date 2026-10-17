"""
SettlementImpactEngine — FloodGuard AI Stage 3 Disaster Intelligence Engine
============================================================================

Transforms Sentinel-1 flood polygons and raster masks into actionable
human, infrastructural, and economic disaster intelligence for Nepal.
"""

__version__ = "1.0.0"
__author__ = "FloodGuard AI Geospatial Architecture Team"

from SettlementImpactEngine.config.config import ImpactConfig
from SettlementImpactEngine.pipeline import SettlementImpactPipeline, ImpactPipelineResult

__all__ = [
    "ImpactConfig",
    "SettlementImpactPipeline",
    "ImpactPipelineResult",
    "__version__",
]
