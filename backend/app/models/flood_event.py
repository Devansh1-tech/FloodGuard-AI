"""
flood_event.py — Flood Event Spatial Entity
===========================================

Central disaster entity recording delineated flood inundation extents, spatial boundaries,
administrative jurisdictions, and temporal baselines.
"""

from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Date, Enum as SQLEnum, Float, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import FloodSeverity
from app.models.types import SpatialGeometry

if TYPE_CHECKING:
    from app.models.impact import AffectedBuilding, AffectedInfrastructure, AffectedRoad
    from app.models.pipeline_run import PipelineRun
    from app.models.reports import GeneratedArtifact, GeneratedReport
    from app.models.statistics import DisasterStatistics, PopulationStatistics


class FloodEvent(Base, UUIDMixin, TimestampMixin):
    """
    Geospatial flood disaster occurrence delineated by the detection pipeline.
    """

    __tablename__ = "flood_events"

    pipeline_run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("pipeline_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), default="Nepal", nullable=False, index=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)  # Province
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    municipality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    before_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    after_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)

    flood_area: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # Total inundated area in km²

    # MultiPolygon geometry of flood extent (SRID 4326)
    geometry: Mapped[Optional[str]] = mapped_column(
        SpatialGeometry("MULTIPOLYGON", srid=4326, spatial_index=True),
        nullable=True,
    )

    # Polygon bounding box enclosing the AOI
    bounding_box: Mapped[Optional[str]] = mapped_column(
        SpatialGeometry("POLYGON", srid=4326, spatial_index=True),
        nullable=True,
    )

    crs: Mapped[str] = mapped_column(String(50), default="EPSG:4326", nullable=False)
    severity: Mapped[FloodSeverity] = mapped_column(
        SQLEnum(FloodSeverity, native_enum=False),
        default=FloodSeverity.MODERATE,
        index=True,
        nullable=False,
    )

    # Relationships
    pipeline_run: Mapped[PipelineRun] = relationship("PipelineRun", back_populates="flood_events")

    affected_buildings: Mapped[List[AffectedBuilding]] = relationship(
        "AffectedBuilding",
        back_populates="flood_event",
        cascade="all, delete-orphan",
    )
    affected_roads: Mapped[List[AffectedRoad]] = relationship(
        "AffectedRoad",
        back_populates="flood_event",
        cascade="all, delete-orphan",
    )
    affected_infrastructure: Mapped[List[AffectedInfrastructure]] = relationship(
        "AffectedInfrastructure",
        back_populates="flood_event",
        cascade="all, delete-orphan",
    )
    population_statistics: Mapped[Optional[PopulationStatistics]] = relationship(
        "PopulationStatistics",
        back_populates="flood_event",
        uselist=False,
        cascade="all, delete-orphan",
    )
    disaster_statistics: Mapped[Optional[DisasterStatistics]] = relationship(
        "DisasterStatistics",
        back_populates="flood_event",
        uselist=False,
        cascade="all, delete-orphan",
    )
    reports: Mapped[List[GeneratedReport]] = relationship(
        "GeneratedReport",
        back_populates="flood_event",
        cascade="all, delete-orphan",
    )
    artifacts: Mapped[List[GeneratedArtifact]] = relationship(
        "GeneratedArtifact",
        back_populates="flood_event",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_flood_events_district_severity", "district", "severity"),
        Index("ix_flood_events_temporal_window", "before_date", "after_date"),
    )

    def __repr__(self) -> str:
        return f"<FloodEvent id={self.id} name='{self.name}' area_km2={self.flood_area}>"
