"""
types.py — Custom SQLAlchemy Field Types & Spatial Adapters
===========================================================

Provides dialect-resilient spatial geometry types (PostGIS Geometry on PostgreSQL,
Text on lightweight test SQLite) and optimized JSONB columns.
"""

from __future__ import annotations

from typing import Optional
from sqlalchemy import JSON, Text, TypeDecorator
from sqlalchemy.dialects.postgresql import JSONB

try:
    from geoalchemy2 import Geometry
    GEOALCHEMY_AVAILABLE = True
except ImportError:
    GEOALCHEMY_AVAILABLE = False
    Geometry = None


# Dialect-resilient JSON column using binary JSONB on PostgreSQL for indexing
JSONType = JSON().with_variant(JSONB, "postgresql")


class SpatialGeometry(TypeDecorator):
    """
    Dialect-adaptive spatial geometry column.

    On PostgreSQL, renders as a native PostGIS `GEOMETRY` column with GiST spatial indexing.
    On SQLite, renders as `TEXT` (WKT/GeoJSON) to enable unit testing without requiring
    external SpatiaLite dynamic C libraries to be compiled.
    """

    impl = Text
    cache_ok = True

    def __init__(
        self,
        geometry_type: str = "GEOMETRY",
        srid: int = 4326,
        spatial_index: bool = True,
        **kwargs,
    ) -> None:
        super().__init__()
        self.geometry_type = geometry_type.upper()
        self.srid = srid
        self.spatial_index = spatial_index
        self.kwargs = kwargs

    def load_dialect_impl(self, dialect):
        if dialect is None:
            return self.impl

        if dialect.name == "postgresql" and GEOALCHEMY_AVAILABLE:
            return dialect.type_descriptor(
                Geometry(
                    geometry_type=self.geometry_type,
                    srid=self.srid,
                    spatial_index=self.spatial_index,
                    **self.kwargs,
                )
            )

        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        # In both dialects, string representation (WKT / GeoJSON) is preserved
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return str(value)
