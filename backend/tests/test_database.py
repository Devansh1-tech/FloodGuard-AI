"""
test_database.py — Database Foundation & Connectivity Tests
===========================================================
"""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import (
    check_database_connection,
    get_async_engine,
    get_async_session_maker,
)


@pytest.mark.asyncio
async def test_get_async_engine():
    """Verify engine instantiation and dialect detection."""
    engine = get_async_engine()
    assert engine is not None
    assert hasattr(engine, "connect")


@pytest.mark.asyncio
async def test_get_async_session_maker():
    """Verify session maker returns AsyncSession instances."""
    maker = get_async_session_maker()
    assert maker is not None
    async with maker() as session:
        assert isinstance(session, AsyncSession)


@pytest.mark.asyncio
async def test_check_database_connection():
    """Verify database health probe 'SELECT 1' executes cleanly."""
    is_ok, msg = await check_database_connection()
    assert is_ok is True
    assert "Connected" in msg


@pytest.mark.asyncio
async def test_session_execute_query(test_db_session: AsyncSession):
    """Verify querying through the async session."""
    result = await test_db_session.execute(text("SELECT 42 AS answer"))
    row = result.mappings().first()
    assert row["answer"] == 42
