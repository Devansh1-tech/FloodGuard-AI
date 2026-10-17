"""
system.py — Dynamic System Configuration Persistence Model
===========================================================

Stores dynamic application configuration, geospatial thresholds, feature flags,
and external service integrations without requiring redeployment.
"""

from __future__ import annotations

from typing import Optional
from sqlalchemy import Boolean, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class SystemConfiguration(Base, UUIDMixin, TimestampMixin):
    """
    Dynamic key-value settings entity.
    """

    __tablename__ = "system_configurations"

    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)



    def __repr__(self) -> str:
        return f"<SystemConfiguration key='{self.key}'>"
