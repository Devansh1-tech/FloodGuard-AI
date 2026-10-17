"""
statistics.py — Disaster Summary & Demographic Statistics Models
=================================================================

Stores high-level analytical rollups, demographic impact distributions,
and disaster severity index metrics for FloodEvent occurrences.
"""

from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING, Any, Dict, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin
from app.models.types import JSONType

if TYPE_CHECKING:
    from app.models.flood_event import FloodEvent


class PopulationStatistics(Base, UUIDMixin):
    """
    Demographic vulnerability breakdown within the delineated inundation zone.
    """

    __tablename__ = "population_statistics"

    flood_event_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("flood_events.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    population: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Total affected individuals
    households: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Displaced households estimate
    children: Mapped[int] = mapped_column(Integer, default=0, nullable=False)    # Children under 15
    women: Mapped[int] = mapped_column(Integer, default=0, nullable=False)       # Female population
    elderly: Mapped[int] = mapped_column(Integer, default=0, nullable=False)     # Individuals aged 60+
    density: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)   # Inhabitants per km²

    demographic_breakdown: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # 1-to-1 Relationship with FloodEvent
    flood_event: Mapped[FloodEvent] = relationship(
        "FloodEvent",
        back_populates="population_statistics",
    )

    def __repr__(self) -> str:
        return f"<PopulationStatistics event_id={self.flood_event_id} affected_pop={self.population}>"


class DisasterStatistics(Base, UUIDMixin):
    """
    Executive disaster overview, combined asset impact metrics, and severity index.
    """

    __tablename__ = "disaster_statistics"

    flood_event_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("flood_events.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    flood_area: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)              # Inundation area in km²
    affected_buildings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)        # Submerged building footprints
    affected_roads: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)          # Submerged road length in km
    affected_population: Mapped[int] = mapped_column(Integer, default=0, nullable=False)       # Impacted residents count
    disaster_severity_index: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # DSI score (0.0 - 100.0)

    # Complete nested JSON summary matching unified pipeline impact_statistics
    json_summary: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # 1-to-1 Relationship with FloodEvent
    flood_event: Mapped[FloodEvent] = relationship(
        "FloodEvent",
        back_populates="disaster_statistics",
    )

    def __repr__(self) -> str:
        return f"<DisasterStatistics event_id={self.flood_event_id} dsi={self.disaster_severity_index}>"
