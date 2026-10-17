"""
jwt.py — JSON Web Token (JWT) Issuance & Validation
===================================================

Creates, encodes, and verifies signed JWT access tokens using PyJWT.
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, Optional
import jwt

from app.config.settings import get_settings
from app.core.exceptions import AuthenticationError


def create_access_token(
    subject: str,
    claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[datetime.timedelta] = None,
) -> str:
    """
    Generate an encoded signed JWT access token.
    """
    settings = get_settings()
    now = datetime.datetime.now(datetime.timezone.utc)

    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
    }
    if claims:
        to_encode.update(claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Validate signature and decode JWT payload claims.

    Raises
    ------
    AuthenticationError
        If token is expired, corrupted, or signature is invalid.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationError("Access token has expired. Please re-authenticate.") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthenticationError("Invalid access token signature.") from exc
