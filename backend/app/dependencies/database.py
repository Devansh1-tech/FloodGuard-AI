"""
database.py — Asynchronous Database Session Dependency
======================================================

Yields scoped asynchronous database sessions for FastAPI route handlers,
ensuring automatic commit/rollback and proper resource cleanup.
"""

from __future__ import annotations

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_async_session_maker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an asynchronous SQLAlchemy database session.
    """
    session_factory = get_async_session_maker()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
