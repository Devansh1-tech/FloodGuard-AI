"""
base.py — SQLAlchemy 2.x Declarative Base & Model Mixins
========================================================

Defines the centralized DeclarativeBase, UUID primary key mixin, and
audit timestamp mixins with timezone-aware UTC datetime tracking.
"""

from __future__ import annotations

import datetime
import uuid
from sqlalchemy import DateTime, Integer, Uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative root class for all SQLAlchemy 2.x ORM entities."""
    pass


class UUIDMixin:
    """Primary key UUID mixin utilizing RFC 4122 v4 UUIDs."""
    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )


class IDMixin:
    """Primary key integer mixin for legacy or sequence-based tables."""
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)


class TimestampMixin:
    """Audit timestamps for model creation and modification."""

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
