"""
init_db.py — Database Initialization & Readiness Script
=======================================================

Initializes database connection, checks connectivity, and synchronizes
declarative metadata with the database schema.
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.config.settings import get_settings
from app.core.logging import get_logger, setup_logging
from app.database.base import Base
from app.database.session import check_database_connection, get_async_engine

logger = get_logger("InitDB")


async def init_database() -> None:
    settings = get_settings()
    setup_logging(log_level="INFO")

    logger.info("Initializing database for environment: %s", settings.ENVIRONMENT)
    logger.info("Target URL: %s", settings.database_url.split("@")[-1] if "@" in settings.database_url else settings.database_url)

    # 1. Probe connectivity
    is_ok, msg = await check_database_connection()
    if not is_ok:
        logger.error("Database connection failed: %s", msg)
        sys.exit(1)

    logger.info("Database connection established: %s", msg)

    # 2. Synchronize metadata schema
    engine = get_async_engine()
    async with engine.begin() as conn:
        logger.info("Creating tables registered in SQLAlchemy Base.metadata...")
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose()
    logger.info("Database initialization completed successfully.")


if __name__ == "__main__":
    asyncio.run(init_database())
