"""
Repository Pattern Data Access Layer for FloodGuard AI
======================================================
"""

from app.repositories.base import BaseRepository
from app.repositories.user import UserRepository
from app.repositories.job import JobRepository
from app.repositories.pipeline_run import PipelineRunRepository
from app.repositories.flood_event import FloodEventRepository
from app.repositories.report import ReportRepository
from app.repositories.artifact import ArtifactRepository
from app.repositories.audit import AuditRepository
from app.repositories.configuration import ConfigurationRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "JobRepository",
    "PipelineRunRepository",
    "FloodEventRepository",
    "ReportRepository",
    "ArtifactRepository",
    "AuditRepository",
    "ConfigurationRepository",
]
