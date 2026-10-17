"""
test_dependencies.py — Dependency Injection & Security Dependencies Tests
========================================================================
"""

import pytest
from fastapi.security import HTTPAuthorizationCredentials

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.dependencies.auth import (
    get_current_active_user,
    get_current_user,
    get_current_user_claims,
    require_role_dependency,
)
from app.dependencies.services import (
    get_configuration_service,
    get_health_service,
    get_job_service,
    get_pipeline_service,
    get_report_service,
    get_storage_service,
)
from app.security.jwt import create_access_token, decode_access_token
from app.security.permissions import Role


def test_service_dependencies():
    """Verify service dependency providers return instances."""
    assert get_health_service() is not None
    assert get_pipeline_service() is not None
    assert get_report_service() is not None
    assert get_storage_service() is not None
    assert get_job_service() is not None
    assert get_configuration_service() is not None


def test_jwt_issuance_and_decoding():
    """Verify creating and verifying JWT access tokens."""
    token = create_access_token(
        subject="analyst_user_1",
        claims={"role": Role.ANALYST.value, "is_active": True},
    )
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload["sub"] == "analyst_user_1"
    assert payload["role"] == Role.ANALYST.value
    assert payload["is_active"] is True


@pytest.mark.asyncio
async def test_auth_dependencies_success():
    """Verify extracting valid user claims through auth dependency pipeline."""
    token = create_access_token(
        subject="admin_user_99",
        claims={"role": Role.ADMIN.value, "is_active": True},
    )
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    claims = await get_current_user_claims(credentials=creds)
    user = await get_current_user(claims=claims)
    active_user = await get_current_active_user(current_user=user)

    assert active_user["user_id"] == "admin_user_99"
    assert active_user["role"] == Role.ADMIN.value


@pytest.mark.asyncio
async def test_auth_dependencies_missing_token():
    """Verify AuthenticationError raised on missing credentials."""
    with pytest.raises(AuthenticationError):
        await get_current_user_claims(credentials=None)


@pytest.mark.asyncio
async def test_role_enforcement():
    """Verify role authorization checks."""
    analyst_checker = require_role_dependency([Role.ANALYST])

    # Analyst permitted
    user_analyst = {"user_id": "u1", "role": Role.ANALYST.value, "is_active": True}
    res = await analyst_checker(current_user=user_analyst)
    assert res == user_analyst

    # Admin permitted by default
    user_admin = {"user_id": "u2", "role": Role.ADMIN.value, "is_active": True}
    res = await analyst_checker(current_user=user_admin)
    assert res == user_admin

    # Viewer forbidden
    user_viewer = {"user_id": "u3", "role": Role.VIEWER.value, "is_active": True}
    with pytest.raises(AuthorizationError):
        await analyst_checker(current_user=user_viewer)
