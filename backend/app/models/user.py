"""
user.py — User Account & Organization Persistence Model
=======================================================

Stores user identity, role-based access classifications, and organization affiliation.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Enum as SQLEnum, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import UserRole, UserStatus

if TYPE_CHECKING:
    from app.models.audit import AuditLog
    from app.models.job import AnalysisJob


class User(Base, UUIDMixin, TimestampMixin):
    """
    User entity for identity, authentication, and role authorization.
    """

    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, native_enum=False),
        default=UserRole.VIEWER,
        nullable=False,
        index=True,
    )
    organization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[UserStatus] = mapped_column(
        SQLEnum(UserStatus, native_enum=False),
        default=UserStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    # Relationships
    analysis_jobs: Mapped[List[AnalysisJob]] = relationship(
        "AnalysisJob",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    audit_logs: Mapped[List[AuditLog]] = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_users_role_status", "role", "status"),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
