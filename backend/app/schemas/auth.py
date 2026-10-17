"""
auth.py — Authentication & User Schemas
=======================================
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Credentials payload for token generation."""
    username: str = Field(description="Username or email address")
    password: str = Field(description="Plaintext password")


class TokenResponse(BaseModel):
    """JWT bearer token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    """Parsed claims payload from a JWT token."""
    sub: str
    exp: int
    role: Optional[str] = "VIEWER"


class UserResponse(BaseModel):
    """Safe public representation of a user."""
    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool
