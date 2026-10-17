"""
conftest.py — Global Pytest Fixtures for Backend Tests
======================================================
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
workspace_dir = backend_dir.parent
for p in [str(backend_dir), str(workspace_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.config.settings import Settings, get_settings
from app.database.base import Base
from app.dependencies.database import get_db
import importlib.util

spec = importlib.util.spec_from_file_location("backend_main", backend_dir / "main.py")
backend_main = importlib.util.module_from_spec(spec)
sys.modules["backend_main"] = backend_main
spec.loader.exec_module(backend_main)
create_app = backend_main.create_app


@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_settings() -> Settings:
    """Provide isolated test settings."""
    return Settings(
        ENVIRONMENT="testing",
        DEBUG=True,
        USE_SQLITE=True,
        SQLITE_DB_PATH=":memory:",
        STORAGE_LOCAL_ROOT="outputs/test_storage",
        LOG_FILE_PATH="logs/test_backend.log",
        SECRET_KEY="test-secret-key-for-jwt-signing-0123456789",
    )


@pytest_asyncio.fixture
async def test_db_session(test_settings: Settings) -> AsyncGenerator[AsyncSession, None]:
    """Provide an isolated in-memory SQLite async session for repository tests."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        future=True,
    )
    async_session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def client(test_settings: Settings, test_db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an asynchronous HTTP test client for API testing."""
    app = create_app(settings=test_settings)

    # Override get_db dependency
    async def override_get_db():
        yield test_db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()
