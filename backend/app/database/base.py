"""
base.py — Alembic Metadata Import Aggregator
============================================

Aggregates all SQLAlchemy models for Alembic auto-migration discovery
and schema synchronization.
"""

from app.models.base import Base
from app.models.user import User
from app.models.job import AnalysisJob
from app.models.pipeline_run import PipelineRun
from app.models.flood_event import FloodEvent
from app.models.impact import AffectedBuilding, AffectedRoad, AffectedInfrastructure
from app.models.statistics import PopulationStatistics, DisasterStatistics
from app.models.reports import GeneratedReport, GeneratedArtifact
from app.models.audit import AuditLog
from app.models.system import SystemConfiguration

__all__ = [
    "Base",
    "User",
    "AnalysisJob",
    "PipelineRun",
    "FloodEvent",
    "AffectedBuilding",
    "AffectedRoad",
    "AffectedInfrastructure",
    "PopulationStatistics",
    "DisasterStatistics",
    "GeneratedReport",
    "GeneratedArtifact",
    "AuditLog",
    "SystemConfiguration",
]
