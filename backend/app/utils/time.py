"""
time.py — DateTime & Temporal Utilities
=======================================

Provides consistent UTC datetime conversions, ISO 8601 formatting,
and date range validation utilities.
"""

from __future__ import annotations

import datetime
from typing import Optional, Tuple


def utc_now() -> datetime.datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.datetime.now(datetime.timezone.utc)


def utc_iso_format(dt: Optional[datetime.datetime] = None) -> str:
    """Return ISO 8601 string representation of a UTC datetime."""
    target = dt or utc_now()
    if target.tzinfo is None:
        target = target.replace(tzinfo=datetime.timezone.utc)
    return target.isoformat()


def validate_date_range(start_date: str, end_date: str) -> Tuple[datetime.date, datetime.date]:
    """
    Validate that start_date and end_date are in 'YYYY-MM-DD' format and start <= end.

    Raises
    ------
    ValueError
        If dates cannot be parsed or if start_date is later than end_date.
    """
    try:
        s_date = datetime.date.fromisoformat(start_date)
    except ValueError as exc:
        raise ValueError(f"Invalid start_date '{start_date}': must be YYYY-MM-DD") from exc

    try:
        e_date = datetime.date.fromisoformat(end_date)
    except ValueError as exc:
        raise ValueError(f"Invalid end_date '{end_date}': must be YYYY-MM-DD") from exc

    if s_date > e_date:
        raise ValueError(f"start_date ({start_date}) cannot be later than end_date ({end_date})")

    return s_date, e_date
