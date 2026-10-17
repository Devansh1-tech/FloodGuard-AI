"""
SQLAlchemy 2.x Domain Models for FloodGuard AI Database Layer
=============================================================
"""

from app.models.base import Base, IDMixin, TimestampMixin, UUIDMixin
from app.models.enums import (
    ArtifactType,
    DamageLevel,
    FloodSeverity,
    InfrastructureType,
    JobPriority,
    JobStatus,
    ReportType,
    UserRole,
    UserStatus,
)
from app.models.types import JSONType, SpatialGeometry
from app.models.user import User
from app.models.job import AnalysisJob
from app.models.pipeline_run import PipelineRun
from app.models.flood_event import FloodEvent
from app.models.impact import AffectedBuilding, AffectedInfrastructure, AffectedRoad
from app.models.statistics import DisasterStatistics, PopulationStatistics
from app.models.reports import GeneratedArtifact, GeneratedReport
from app.models.audit import AuditLog
from app.models.system import SystemConfiguration

__all__ = [
    "Base",
    "UUIDMixin",
    "IDMixin",
    "TimestampMixin",
    "JSONType",
    "SpatialGeometry",
    # Enums
    "JobStatus",
    "JobPriority",
    "UserRole",
    "UserStatus",
    "FloodSeverity",
    "ReportType",
    "ArtifactType",
    "InfrastructureType",
    "DamageLevel",
    # Models
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
