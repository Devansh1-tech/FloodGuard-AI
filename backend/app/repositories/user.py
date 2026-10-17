"""
user.py — User Entity Data Access Repository
============================================

Provides persistence and query methods for User authentication, organization
lookups, and account state transitions.
"""

from __future__ import annotations

import uuid
from typing import Any, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.repositories.base import BaseRepository
from app.security.passwords import verify_password


class UserRepository(BaseRepository[User, Any, Any]):
    """Repository handling User entity persistence and authentication queries."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(model=User, session=session)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by unique email address."""
        stmt = select(User).where(User.email == email.strip().lower())
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_active_users(self, skip: int = 0, limit: int = 50) -> List[User]:
        """Fetch active user accounts with pagination."""
        stmt = (
            select(User)
            .where(User.status == UserStatus.ACTIVE)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_role(self, role: UserRole, skip: int = 0, limit: int = 50) -> List[User]:
        """List users belonging to a specific RBAC role."""
        stmt = (
            select(User)
            .where(User.role == role)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def authenticate(self, email: str, password_plaintext: str) -> Optional[User]:
        """Validate user credentials against stored bcrypt hash."""
        user = await self.get_by_email(email)
        if not user or user.status != UserStatus.ACTIVE:
            return None
        if not verify_password(password_plaintext, user.password_hash):
            return None
        return user

    async def update_status(self, user_id: uuid.UUID, status: UserStatus) -> Optional[User]:
        """Update account activity status."""
        user = await self.get(user_id)
        if user:
            user.status = status
            self.session.add(user)
            await self.session.commit()
            await self.session.refresh(user)
        return user
