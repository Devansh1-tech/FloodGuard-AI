"""
base.py — Generic Async Repository Pattern
==========================================

Provides generic asynchronous CRUD persistence primitives using SQLAlchemy 2.x
and Pydantic v2 schemas.
"""

from __future__ import annotations

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=Any)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=Any)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    CRUD repository providing asynchronous access to database entities.
    """

    def __init__(self, model: Type[ModelType], session: AsyncSession) -> None:
        """
        Parameters
        ----------
        model : Type[ModelType]
            SQLAlchemy 2.x ORM model class.
        session : AsyncSession
            Active asynchronous database session.
        """
        self.model = model
        self.session = session

    async def get(self, id: Any) -> Optional[ModelType]:
        """Fetch a single record by primary key."""
        stmt = select(self.model).where(getattr(self.model, "id") == id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ModelType]:
        """Fetch a paginated list of records."""
        stmt = select(self.model).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, *, obj_in: Union[CreateSchemaType, Dict[str, Any]]) -> ModelType:
        """Persist a new entity record."""
        if isinstance(obj_in, dict):
            create_data = obj_in
        else:
            create_data = obj_in.model_dump(exclude_unset=True)

        db_obj = self.model(**create_data)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(
        self,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],
    ) -> ModelType:
        """Update fields on an existing entity record."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, *, id: Any) -> Optional[ModelType]:
        """Delete an entity by primary key."""
        db_obj = await self.get(id)
        if db_obj:
            await self.session.delete(db_obj)
            await self.session.commit()
        return db_obj

    async def count(self) -> int:
        """Count total rows in entity table."""
        stmt = select(func.count()).select_from(self.model)
        result = await self.session.execute(stmt)
        return int(result.scalar_one() or 0)
