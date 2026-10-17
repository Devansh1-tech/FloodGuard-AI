"""
audit.py — Security & Compliance Audit Log Entity
=================================================

Maintains an immutable historical audit trail of user and system actions,
disaster analysis triggers, administrative alterations, and report exports.
"""

from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING, Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin
from app.models.types import JSONType

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(Base, UUIDMixin):
    """
    Append-only security and operational telemetry log.
    """

    __tablename__ = "audit_logs"

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    timestamp: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
        index=True,
    )

    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)

    # Relationship
    user: Mapped[Optional[User]] = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_logs_user_action", "user_id", "action"),
        Index("ix_audit_logs_entity_action", "entity", "action"),
    )

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action='{self.action}' entity='{self.entity}'>"
