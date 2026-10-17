"""
impact.py — Geospatial Settlement & Infrastructure Impact Models
================================================================

Stores spatially-intersected disaster damage assessments for buildings,
road segments, and critical infrastructure lifelines.
"""

from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, Float, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin
from app.models.enums import DamageLevel, InfrastructureType
from app.models.types import SpatialGeometry

if TYPE_CHECKING:
    from app.models.flood_event import FloodEvent


class AffectedBuilding(Base, UUIDMixin):
    """
    Building structure intersected by delineated flood extent.
    """

    __tablename__ = "affected_buildings"

    flood_event_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("flood_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    building_type: Mapped[str] = mapped_column(
        String(100),
        default="residential",
        nullable=False,
        index=True,
    )
    building_area: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Footprint area in m²
    damage_level: Mapped[DamageLevel] = mapped_column(
        SQLEnum(DamageLevel, native_enum=False),
        default=DamageLevel.MODERATE,
        nullable=False,
        index=True,
    )
    water_depth_estimated_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Geometry: Polygon footprint or Point centroid
    geometry: Mapped[Optional[str]] = mapped_column(
        SpatialGeometry("GEOMETRY", srid=4326, spatial_index=True),
        nullable=True,
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationship
    flood_event: Mapped[FloodEvent] = relationship("FloodEvent", back_populates="affected_buildings")

    __table_args__ = (
        Index("ix_affected_buildings_event_type", "flood_event_id", "building_type"),
        Index("ix_affected_buildings_damage", "flood_event_id", "damage_level"),
    )

    def __repr__(self) -> str:
        return f"<AffectedBuilding id={self.id} type='{self.building_type}' damage={self.damage_level}>"


class AffectedRoad(Base, UUIDMixin):
    """
    Transportation network segment submerged or severed by flood waters.
    """

    __tablename__ = "affected_roads"

    flood_event_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("flood_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    road_type: Mapped[str] = mapped_column(
        String(100),
        default="unclassified",
        nullable=False,
        index=True,
    )
    road_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    road_length: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # Submerged length in km
    damage_level: Mapped[DamageLevel] = mapped_column(
        SQLEnum(DamageLevel, native_enum=False),
        default=DamageLevel.MODERATE,
        nullable=False,
        index=True,
    )

    # Geometry: Linestring or MultiLinestring road centerline
    geometry: Mapped[Optional[str]] = mapped_column(
        SpatialGeometry("MULTILINESTRING", srid=4326, spatial_index=True),
        nullable=True,
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationship
    flood_event: Mapped[FloodEvent] = relationship("FloodEvent", back_populates="affected_roads")

    __table_args__ = (
        Index("ix_affected_roads_event_type", "flood_event_id", "road_type"),
    )

    def __repr__(self) -> str:
        return f"<AffectedRoad id={self.id} type='{self.road_type}' length_km={self.road_length}>"


class AffectedInfrastructure(Base, UUIDMixin):
    """
    Critical facility lifeline (hospital, school, police, emergency shelter).
    """

    __tablename__ = "affected_infrastructure"

    flood_event_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("flood_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    infrastructure_type: Mapped[InfrastructureType] = mapped_column(
        SQLEnum(InfrastructureType, native_enum=False),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Quick boolean filter flags for immediate disaster response querying
    hospital: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    school: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    police: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    shelter: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    status: Mapped[str] = mapped_column(
        String(50),
        default="SUBMERGED",
        nullable=False,
        index=True,
    )

    # Point geometry of the facility
    geometry: Mapped[Optional[str]] = mapped_column(
        SpatialGeometry("POINT", srid=4326, spatial_index=True),
        nullable=True,
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationship
    flood_event: Mapped[FloodEvent] = relationship("FloodEvent", back_populates="affected_infrastructure")

    __table_args__ = (
        Index("ix_affected_infra_event_type", "flood_event_id", "infrastructure_type"),
        Index("ix_affected_infra_status", "flood_event_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<AffectedInfrastructure id={self.id} name='{self.name}' type={self.infrastructure_type}>"
