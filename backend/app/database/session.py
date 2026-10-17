"""
session.py — Asynchronous SQLAlchemy 2.x Session Factory
========================================================

Manages the lifecycle of asynchronous database connections, connection pooling,
session factory instantiation, and database health probes.
"""

from __future__ import annotations

import time
from typing import AsyncGenerator, Optional, Tuple
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config.settings import get_settings
from app.core.logging import get_logger

logger = get_logger("DatabaseSession")

_engine: Optional[AsyncEngine] = None
_session_maker: Optional[async_sessionmaker[AsyncSession]] = None


def get_async_engine() -> AsyncEngine:
    """
    Retrieve or lazily initialize the singleton AsyncEngine.
    """
    global _engine
    if _engine is None:
        settings = get_settings()
        db_url = settings.database_url

        connect_args = {}
        engine_kwargs = {
            "echo": settings.DB_ECHO,
            "future": True,
        }

        # Apply dialect-specific parameters
        if "sqlite" in db_url:
            connect_args["check_same_thread"] = False
        else:
            engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
            engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
            engine_kwargs["pool_pre_ping"] = True

        _engine = create_async_engine(
            db_url,
            connect_args=connect_args,
            **engine_kwargs,
        )
        logger.info("Initialized AsyncEngine with dialect: %s", db_url.split("://")[0])

    return _engine


def get_async_session_maker() -> async_sessionmaker[AsyncSession]:
    """
    Retrieve or lazily initialize the singleton async session maker.
    """
    global _session_maker
    if _session_maker is None:
        engine = get_async_engine()
        _session_maker = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            autoflush=False,
            expire_on_commit=False,
        )
    return _session_maker


async def check_database_connection() -> Tuple[bool, str]:
    """
    Execute a low-overhead health probe ('SELECT 1') against the active database engine.

    Returns
    -------
    tuple[bool, str]
        (is_healthy, status_message_or_latency)
    """
    t0 = time.perf_counter()
    try:
        engine = get_async_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency_ms = (time.perf_counter() - t0) * 1000.0
        return True, f"Connected ({latency_ms:.1f}ms)"
    except Exception as exc:
        logger.warning("Database connectivity health check failed: %s", exc)
        return False, str(exc)
