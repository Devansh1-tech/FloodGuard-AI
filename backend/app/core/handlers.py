"""
handlers.py — Global Exception Handlers & Standardized Error Envelopes
======================================================================

Registers global exception handlers on the FastAPI application, ensuring all
client errors and internal exceptions return a uniform JSON envelope.
"""

from __future__ import annotations

import datetime
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import ApplicationError
from app.core.logging import get_logger

logger = get_logger("ExceptionHandler")


def format_error_response(
    code: str,
    message: str,
    status_code: int,
    details: dict | None = None,
) -> JSONResponse:
    """Construct standard JSON error envelope."""
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
    }
    return JSONResponse(status_code=status_code, content=payload)


async def application_error_handler(request: Request, exc: ApplicationError) -> JSONResponse:
    """Handle custom application exceptions."""
    logger.warning("Application error [%s]: %s on path %s", exc.code, exc.message, request.url.path)
    return format_error_response(
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle FastAPI / Pydantic request validation errors."""
    logger.info("Validation error on path %s: %s", request.url.path, exc.errors())
    formatted_errors = [
        {
            "loc": [str(x) for x in err["loc"]],
            "msg": err["msg"],
            "type": err["type"],
        }
        for err in exc.errors()
    ]
    return format_error_response(
        code="REQUEST_VALIDATION_ERROR",
        message="One or more fields in the request payload failed validation.",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details={"validation_errors": formatted_errors},
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle standard Starlette / FastAPI HTTPExceptions."""
    code_map = {
        404: "NOT_FOUND",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        405: "METHOD_NOT_ALLOWED",
    }
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    return format_error_response(
        code=code,
        message=str(exc.detail),
        status_code=exc.status_code,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unhandled unexpected server errors."""
    logger.exception("Unhandled server exception on path %s: %s", request.url.path, exc)
    return format_error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected internal server error occurred. Please contact system support.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all centralized exception handlers to the FastAPI application."""
    app.add_exception_handler(ApplicationError, application_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
