"""
artifacts.py — Artifact Schemas
===============================
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class ArtifactResponse(BaseModel):
    """Metadata response for a generated deliverable artifact."""

    id: str
    flood_event_id: str
    artifact_type: str
    file_path: str
    file_size_bytes: Optional[int] = None
    checksum: Optional[str] = None
    download_url: str
    created_at: str
