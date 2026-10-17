"""
configuration.py — SystemConfiguration Data Access Repository
=============================================================

Handles dynamic key-value platform configurations and settings persistence.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system import SystemConfiguration
from app.repositories.base import BaseRepository


class ConfigurationRepository(BaseRepository[SystemConfiguration, Any, Any]):
    """Repository handling SystemConfiguration persistence."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(model=SystemConfiguration, session=session)

    async def get_by_key(self, key: str) -> Optional[SystemConfiguration]:
        """Fetch setting by unique key."""
        stmt = select(SystemConfiguration).where(SystemConfiguration.key == key)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def set_value(
        self,
        key: str,
        value: str,
        description: Optional[str] = None,
        is_encrypted: bool = False,
    ) -> SystemConfiguration:
        """Create or update a dynamic configuration setting."""
        config = await self.get_by_key(key)
        if config:
            config.value = value
            if description is not None:
                config.description = description
            config.is_encrypted = is_encrypted
        else:
            config = SystemConfiguration(
                key=key,
                value=value,
                description=description,
                is_encrypted=is_encrypted,
            )
            self.session.add(config)

        await self.session.commit()
        await self.session.refresh(config)
        return config

    async def get_all_as_dict(self) -> Dict[str, str]:
        """Fetch all configuration keys and values as a dictionary."""
        stmt = select(SystemConfiguration)
        result = await self.session.execute(stmt)
        return {item.key: item.value for item in result.scalars().all()}
