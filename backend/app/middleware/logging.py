"""
logging.py — Request Logging & Correlation ID Middleware
========================================================

Attaches a unique 'X-Request-ID' correlation token to each request/response cycle
and writes structured log entries recording client origin, route, status code, and latency.
"""

from __future__ import annotations

import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import get_logger

logger = get_logger("RequestLoggingMiddleware")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware establishing correlation tracking and structured access logs.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Resolve or generate correlation request ID
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        client_host = request.client.host if request.client else "unknown"
        method = request.method
        url_path = request.url.path

        start_time = time.perf_counter()
        logger.info(
            "--> %s %s [client: %s, req_id: %s]",
            method,
            url_path,
            client_host,
            request_id,
        )

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            response.headers["X-Request-ID"] = request_id

            logger.info(
                "<-- %s %s %d (%.2fms) [req_id: %s]",
                method,
                url_path,
                response.status_code,
                duration_ms,
                request_id,
            )
            return response
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(
                "<!- %s %s FAILED (%.2fms) [req_id: %s]: %s",
                method,
                url_path,
                duration_ms,
                request_id,
                exc,
            )
            raise
