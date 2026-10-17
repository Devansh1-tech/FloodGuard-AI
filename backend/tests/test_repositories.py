"""
test_repositories.py — Repository Base Pattern & CRUD Unit Tests
================================================================
"""

import pytest
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base, IDMixin, TimestampMixin
from app.repositories.base import BaseRepository


class SampleEntity(Base, IDMixin, TimestampMixin):
    """Concrete ORM model for testing generic repository capabilities."""
    __tablename__ = "test_entities"

    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)


class SampleCreateSchema(BaseModel):
    name: str
    description: str | None = None


class SampleUpdateSchema(BaseModel):
    description: str | None = None


class SampleRepository(BaseRepository[SampleEntity, SampleCreateSchema, SampleUpdateSchema]):
    """Concrete test repository implementation."""
    pass


@pytest.mark.asyncio
async def test_repository_crud_lifecycle(test_db_session: AsyncSession):
    """Verify end-to-end repository operations: Create, Read, Update, Delete, Count."""
    # Create the test table dynamically in SQLite
    engine = test_db_session.bind
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    repo = SampleRepository(SampleEntity, test_db_session)

    # 1. Create
    created = await repo.create(obj_in={"name": "Koshi River Basin", "description": "Flood zone"})
    assert created.id is not None
    assert created.name == "Koshi River Basin"

    # 2. Get by ID
    fetched = await repo.get(created.id)
    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.name == "Koshi River Basin"

    # 3. Count
    total = await repo.count()
    assert total == 1

    # 4. Update
    updated = await repo.update(db_obj=fetched, obj_in={"description": "High-risk inundation zone"})
    assert updated.description == "High-risk inundation zone"

    # 5. Get Multi
    items = await repo.get_multi(skip=0, limit=10)
    assert len(items) == 1
    assert items[0].id == created.id

    # 6. Delete
    deleted = await repo.delete(id=created.id)
    assert deleted is not None
    remaining = await repo.get(created.id)
    assert remaining is None

    total_after_delete = await repo.count()
    assert total_after_delete == 0
