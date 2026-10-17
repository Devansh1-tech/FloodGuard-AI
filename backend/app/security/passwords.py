"""
passwords.py — Password Hashing & Cryptographic Verification
=============================================================

Secure one-way password hashing using native bcrypt with salt generation
and safe 72-byte truncation handling.
"""

from __future__ import annotations

import bcrypt


def hash_password(password: str) -> str:
    """Hash a plaintext password string using bcrypt with 12 rounds of salt."""
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that a plaintext password matches a stored bcrypt hash."""
    pw_bytes = plain_password.encode("utf-8")[:72]
    hash_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False
