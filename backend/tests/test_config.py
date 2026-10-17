"""
test_config.py — Centralized Configuration Unit Tests
=====================================================
"""

import os
import pytest
from app.config.settings import Settings, get_settings


def test_settings_default_values():
    """Verify that default settings instantiate with expected production attributes."""
    settings = Settings()
    assert settings.APP_NAME == "FloodGuard AI API"
    assert settings.API_V1_PREFIX == "/api/v1"
    assert isinstance(settings.cors_origins_list, list)
    assert len(settings.cors_origins_list) > 0
    assert settings.SERVER_PORT == 8000
    assert settings.STORAGE_LOCAL_ROOT is not None


def test_settings_environment_modes():
    """Verify development, testing, and production boolean properties."""
    dev_settings = Settings(ENVIRONMENT="development")
    assert dev_settings.is_development is True
    assert dev_settings.is_production is False
    assert dev_settings.is_testing is False

    prod_settings = Settings(ENVIRONMENT="production")
    assert prod_settings.is_development is False
    assert prod_settings.is_production is True
    assert prod_settings.is_testing is False

    test_settings = Settings(ENVIRONMENT="testing")
    assert test_settings.is_testing is True


def test_settings_sqlite_database_url():
    """Verify SQLite database URL construction."""
    settings = Settings(USE_SQLITE=True, SQLITE_DB_PATH="test_db.sqlite3")
    assert "sqlite+aiosqlite:///test_db.sqlite3" == settings.database_url


def test_settings_postgres_database_url():
    """Verify PostgreSQL database URL construction when USE_SQLITE is False."""
    settings = Settings(
        USE_SQLITE=False,
        ENVIRONMENT="production",
        POSTGRES_SERVER="db.internal",
        POSTGRES_PORT=5432,
        POSTGRES_USER="flood_user",
        POSTGRES_PASSWORD="secret_password",
        POSTGRES_DB="flood_gis",
    )
    assert settings.database_url == "postgresql+asyncpg://flood_user:secret_password@db.internal:5432/flood_gis"


def test_settings_cors_origins_parsing():
    """Verify comma-separated string parsing for CORS origins and allowed hosts."""
    settings = Settings(
        CORS_ORIGINS="http://localhost:3000, https://floodguard.ai, http://127.0.0.1:5173",
        ALLOWED_HOSTS="localhost, api.floodguard.ai",
    )
    assert "http://localhost:3000" in settings.cors_origins_list
    assert "https://floodguard.ai" in settings.cors_origins_list
    assert "api.floodguard.ai" in settings.ALLOWED_HOSTS


def test_get_settings_caching():
    """Verify lru_cache singleton behavior for get_settings()."""
    s1 = get_settings()
    s2 = get_settings()
    assert s1 is s2
