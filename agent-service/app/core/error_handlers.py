from datetime import datetime, timezone
from typing import Any
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
import structlog

from app.core.exceptions import AppException
from app.core.logging import get_logger

logger = get_logger("app.error_handler")


def _get_request_id(request: Request) -> str:
    """Safely extracts request_id from ASGI request state or active structlog contextvars."""
    state_id = getattr(request.state, "request_id", None)
    if state_id:
        return str(state_id)
    context = structlog.contextvars.get_contextvars()
    return context.get("request_id", "")


def _format_error_body(
    code: str,
    message: str,
    request_id: str,
    details: Any = None,
) -> dict[str, Any]:
    """Generates consistent RFC 7807-inspired error payload."""
    return {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": details if details is not None else {},
        }
    }


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handles all custom application domain & infrastructure exceptions."""
    request_id = _get_request_id(request)
    headers = dict(exc.headers) if exc.headers else {}
    if request_id:
        headers["X-Request-ID"] = request_id

    log_method = logger.warning if exc.status_code < 500 else logger.error
    log_method(
        "app_exception_handled",
        status_code=exc.status_code,
        code=exc.code,
        error_message=exc.message,
        details=exc.details,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=_format_error_body(
            code=exc.code,
            message=exc.message,
            request_id=request_id,
            details=exc.details,
        ),
        headers=headers,
    )


async def starlette_http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Handles standard Starlette / FastAPI HTTPExceptions."""
    request_id = _get_request_id(request)
    headers = dict(exc.headers) if exc.headers else {}
    if request_id:
        headers["X-Request-ID"] = request_id

    # Derive human-friendly error code from HTTP status
    status_code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        408: "REQUEST_TIMEOUT",
        409: "CONFLICT",
        422: "UNPROCESSABLE_ENTITY",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
        504: "GATEWAY_TIMEOUT",
    }
    code = status_code_map.get(exc.status_code, f"HTTP_{exc.status_code}")
    message = str(exc.detail) if exc.detail else "An HTTP error occurred."

    log_method = logger.warning if exc.status_code < 500 else logger.error
    log_method(
        "http_exception_handled",
        status_code=exc.status_code,
        code=code,
        error_message=message,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=_format_error_body(
            code=code,
            message=message,
            request_id=request_id,
        ),
        headers=headers,
    )


async def request_validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handles FastAPI Pydantic schema validation failures (HTTP 422)."""
    request_id = _get_request_id(request)
    logger.warning(
        "request_validation_failed",
        status_code=422,
        validation_errors=exc.errors(),
    )

    return JSONResponse(
        status_code=422,
        content=_format_error_body(
            code="VALIDATION_ERROR",
            message="Request body or query parameter validation failed.",
            request_id=request_id,
            details={"errors": exc.errors()},
        ),
        headers={"X-Request-ID": request_id} if request_id else None,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catches any unexpected Python exception, logging full traceback securely."""
    request_id = _get_request_id(request)
    logger.error(
        "unhandled_server_exception",
        exc_info=exc,
        status_code=500,
    )

    return JSONResponse(
        status_code=500,
        content=_format_error_body(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred while processing the request.",
            request_id=request_id,
        ),
        headers={"X-Request-ID": request_id} if request_id else None,
    )


def register_error_handlers(app: FastAPI) -> None:
    """Registers unified error handlers on the FastAPI application instance."""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(StarletteHTTPException, starlette_http_exception_handler)
    app.add_exception_handler(RequestValidationError, request_validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)