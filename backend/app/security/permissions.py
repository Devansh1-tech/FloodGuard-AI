"""
permissions.py — Role-Based Access Control (RBAC)
=================================================

Defines user roles and permission verification primitives for API routes.
"""

from __future__ import annotations

from enum import Enum
from typing import Callable, List
from fastapi import Depends

from app.core.exceptions import AuthorizationError


class Role(str, Enum):
    """User authorization roles."""
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    RESPONDER = "RESPONDER"
    VIEWER = "VIEWER"


def require_role(allowed_roles: List[Role]) -> Callable:
    """
    Factory returning a dependency that enforces caller has one of the allowed roles.
    """
    async def role_checker(current_user: dict = None) -> bool:
        # User payload extracted by auth dependency
        user_role = (current_user or {}).get("role", Role.VIEWER.value)
        if user_role not in [r.value for r in allowed_roles] and user_role != Role.ADMIN.value:
            raise AuthorizationError(
                f"Action requires one of the following roles: {[r.value for r in allowed_roles]}"
            )
        return True

    return role_checker
