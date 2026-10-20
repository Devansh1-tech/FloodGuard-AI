"""
middleware — Request & Response Processing Interceptors
=======================================================

Provides middleware components for CORS, GZip compression, request correlation,
structured access logging, timing telemetry, and global exception trapping.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.config.settings import Settings
from app.middleware.errors import ExceptionCatchMiddleware
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.timing import RequestTimingMiddleware

__all__ = [
    "RequestLoggingMiddleware",
    "RequestTimingMiddleware",
    "ExceptionCatchMiddleware",
    "setup_middleware",
]


def setup_middleware(app: FastAPI, settings: Settings) -> None:
    """
    Attach the complete middleware pipeline to the FastAPI application.

    Note: Starlette executes middlewares in reverse registration order (bottom-up),
    so outer-most middlewares must be added last.
    """
    # 1. Catch-all unexpected exception protection
    app.add_middleware(ExceptionCatchMiddleware)

    # 2. Access and correlation ID logging
    app.add_middleware(RequestLoggingMiddleware)

    # 3. Response timing header (X-Process-Time)
    app.add_middleware(RequestTimingMiddleware)

    # 4. GZip Response Compression
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # 5. Trusted Hosts filtering (if configured)
    if isinstance(settings.ALLOWED_HOSTS, str):
        allowed_hosts = [h.strip() for h in settings.ALLOWED_HOSTS.split(",") if h.strip()]
    else:
        allowed_hosts = list(settings.ALLOWED_HOSTS)

    if allowed_hosts and "*" not in allowed_hosts:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

    # 6. Cross-Origin Resource Sharing (CORS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_origin_regex=r"https://.*\.onrender\.com",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
