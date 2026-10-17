"""
audit.py — Security & Compliance Audit Trail Repository
=======================================================

Records immutable audit entries for user activities, pipeline executions,
data exports, and administrative alterations.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditLog, Any, Any]):
    """Repository handling AuditLog records."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(model=AuditLog, session=session)

    async def log_action(
        self,
        action: str,
        entity: str,
        entity_id: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """Create and persist an audit entry."""
        audit_entry = AuditLog(
            action=action,
            entity=entity,
            entity_id=entity_id,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
        )
        self.session.add(audit_entry)
        await self.session.commit()
        await self.session.refresh(audit_entry)
        return audit_entry

    async def get_user_audit_trail(
        self,
        user_id: uuid.UUID,
        limit: int = 100,
    ) -> List[AuditLog]:
        """Fetch audit history for a specific user account."""
        stmt = (
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(desc(AuditLog.timestamp))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_entity_history(
        self,
        entity: str,
        entity_id: str,
        limit: int = 100,
    ) -> List[AuditLog]:
        """Fetch audit trail for a specific entity record."""
        stmt = (
            select(AuditLog)
            .where(
                AuditLog.entity == entity,
                AuditLog.entity_id == entity_id,
            )
            .order_by(desc(AuditLog.timestamp))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_recent_logs(self, limit: int = 100) -> List[AuditLog]:
        """Retrieve most recent audit events."""
        stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
