"""
auth.py — Authentication & Security Dependencies
================================================

FastAPI security dependencies extracting and verifying JWT bearer credentials,
authenticating current user context, and enforcing role-based access.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.security.jwt import decode_access_token
from app.security.permissions import Role

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user_claims(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Dict[str, Any]:
    """
    Extract and validate JWT Bearer token claims from the Authorization header.
    """
    if credentials is None or not credentials.credentials:
        raise AuthenticationError("Missing or malformed Authorization header with Bearer token.")

    token = credentials.credentials
    claims = decode_access_token(token)
    return claims


async def get_current_user(
    claims: Dict[str, Any] = Depends(get_current_user_claims),
) -> Dict[str, Any]:
    """
    Return authenticated user claims dictionary.
    """
    return {
        "user_id": claims.get("sub"),
        "role": claims.get("role", Role.VIEWER.value),
        "is_active": claims.get("is_active", True),
    }


async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Ensure the caller's account is active.
    """
    if not current_user.get("is_active", True):
        raise AuthorizationError("Inactive user account.")
    return current_user


def require_role_dependency(allowed_roles: List[Role]):
    """
    Dependency factory checking caller role against allowed roles.
    """
    async def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_active_user),
    ) -> Dict[str, Any]:
        user_role = current_user.get("role", Role.VIEWER.value)
        allowed_values = [r.value for r in allowed_roles]
        if user_role not in allowed_values and user_role != Role.ADMIN.value:
            raise AuthorizationError(
                f"Operation forbidden. Required roles: {allowed_values}, caller role: {user_role}"
            )
        return current_user

    return role_checker
