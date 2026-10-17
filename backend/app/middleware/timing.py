"""
timing.py — Request Timing Middleware
=====================================

Calculates the wall-clock execution duration of every HTTP request and attaches
an 'X-Process-Time' header (in seconds with millisecond precision) to the response.
"""

from __future__ import annotations

import time
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """
    Measures duration of request processing and attaches 'X-Process-Time' response header.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        return response
