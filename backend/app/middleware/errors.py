"""
errors.py — Global ASGI Exception Catch-All Middleware
======================================================

Ensures that even if an unhandled exception escapes FastAPI exception handlers
(for instance within an earlier middleware), a standardized JSON 500 error envelope
is returned to the client rather than an unstyled plain text crash.
"""

from __future__ import annotations

import datetime
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.logging import get_logger

logger = get_logger("ExceptionMiddleware")


class ExceptionCatchMiddleware(BaseHTTPMiddleware):
    """
    Catch-all ASGI middleware trapping unexpected runtime failures.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            logger.exception("Uncaught exception in middleware chain: %s", exc)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "An unexpected error occurred during request processing.",
                        "details": {"exception_type": type(exc).__name__},
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    },
                },
            )
