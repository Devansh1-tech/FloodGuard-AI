"""
settings.py — Centralized Enterprise Configuration
==================================================

Pydantic Settings v2 configuration manager. Reads from environment variables
and .env files with support for development, testing, and production environments.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, List, Optional, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Master application settings dataclass loaded from environment.
    """

    # ── Environment & App Info ──────────────────────────────────────────
    ENVIRONMENT: str = Field(default="development", description="Runtime environment: development | testing | production")
    DEBUG: bool = Field(default=True, description="Enable debug mode and verbose logging")
    APP_NAME: str = Field(default="FloodGuard AI API", description="Application display name")
    APP_VERSION: str = Field(default="1.0.0", description="Application semver")
    API_V1_PREFIX: str = Field(default="/api/v1", description="URL prefix for API v1")
    SECRET_KEY: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        description="Cryptographic secret key for signing tokens",
    )

    # ── Server Configuration ────────────────────────────────────────────
    SERVER_HOST: str = Field(default="0.0.0.0", description="Bind host")
    SERVER_PORT: int = Field(default=8000, description="Bind port")
    SERVER_WORKERS: int = Field(default=1, description="Number of worker processes")

    # ── Networking & Security ───────────────────────────────────────────
    ALLOWED_HOSTS: List[str] = Field(
        default_factory=lambda: ["*"],
        description="Allowed host headers for TrustedHostMiddleware",
    )
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"],
        description="Allowed CORS origin domains",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, description="JWT token validity in minutes")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT cryptographic signing algorithm")

    # ── Database (PostgreSQL / PostGIS / Async SQLite) ───────────────────
    USE_SQLITE: bool = Field(default=True, description="Fallback to async SQLite for development/testing")
    SQLITE_DB_PATH: str = Field(default="floodguard_dev.db", description="Path to local SQLite file")
    POSTGRES_SERVER: str = Field(default="localhost", description="PostgreSQL host")
    POSTGRES_PORT: int = Field(default=5432, description="PostgreSQL port")
    POSTGRES_USER: str = Field(default="postgres", description="PostgreSQL username")
    POSTGRES_PASSWORD: str = Field(default="postgres", description="PostgreSQL password")
    POSTGRES_DB: str = Field(default="floodguard_db", description="PostgreSQL database name")
    DB_POOL_SIZE: int = Field(default=10, description="Connection pool size")
    DB_MAX_OVERFLOW: int = Field(default=20, description="Max overflow connections")
    DB_ECHO: bool = Field(default=False, description="Echo raw SQL statements")

    # ── Google Earth Engine ─────────────────────────────────────────────
    EE_PROJECT_ID: str = Field(default="home-credit-505106", description="GCP Project ID with Earth Engine enabled")
    EE_SERVICE_ACCOUNT_KEY: Optional[str] = Field(default=None, description="Path to service account credentials JSON")

    # ── Storage Abstraction ─────────────────────────────────────────────
    STORAGE_BACKEND: str = Field(default="local", description="Storage driver: local | s3 | gcs | azure")
    STORAGE_LOCAL_ROOT: str = Field(default="outputs", description="Root directory for local file storage")
    STORAGE_S3_BUCKET: str = Field(default="floodguard-data", description="AWS S3 bucket name")
    STORAGE_S3_REGION: str = Field(default="us-east-1", description="AWS region")

    # ── Job System ──────────────────────────────────────────────────────
    JOB_MAX_CONCURRENT: int = Field(default=4, description="Maximum concurrent active background jobs")
    JOB_TIMEOUT_SECONDS: int = Field(default=3600, description="Maximum execution time before timeout")

    # ── Logging ─────────────────────────────────────────────────────────
    LOG_LEVEL: str = Field(default="INFO", description="Log verbosity level: DEBUG | INFO | WARNING | ERROR")
    LOG_FILE_PATH: str = Field(default="logs/backend.log", description="Path to rolling log file")

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    @field_validator("CORS_ORIGINS", "ALLOWED_HOSTS", mode="before")
    @classmethod
    def assemble_list(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.strip().startswith("[") and v.strip().endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @property
    def database_url(self) -> str:
        """Construct the async database connection URI."""
        if self.USE_SQLITE or self.ENVIRONMENT == "testing":
            return f"sqlite+aiosqlite:///{self.SQLITE_DB_PATH}"
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL(self) -> str:
        """Uppercase alias for database connection URI."""
        return self.database_url

    @property
    def cors_origins_list(self) -> List[str]:
        return self.CORS_ORIGINS

    @property
    def HOST(self) -> str:
        return self.SERVER_HOST

    @property
    def PORT(self) -> int:
        return self.SERVER_PORT

    @property
    def LOG_DIR(self) -> str:
        return str(Path(self.LOG_FILE_PATH).parent)

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() == "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_testing(self) -> bool:
        return self.ENVIRONMENT.lower() == "testing"


@lru_cache()
def get_settings() -> Settings:
    """Singleton getter for application settings."""
    return Settings()
