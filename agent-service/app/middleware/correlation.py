import time
from typing import Callable
from starlette.datastructures import Headers, MutableHeaders
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send
import structlog

from app.core.logging import get_logger
from app.utils.uuid import generate_uuid

logger = get_logger("app.access")


class RequestLoggingMiddleware:
    """
    High-performance ASGI middleware for:
    1. Extracting or generating X-Request-ID and X-Correlation-ID.
    2. Extracting X-User-Id when present.
    3. Binding request context to structlog.contextvars for end-to-end tracing across async tasks.
    4. Injecting X-Request-ID into response headers.
    5. Measuring request duration and logging completion without buffering streaming responses.
    6. Catching any unhandled exceptions to ensure X-Request-ID and structured error are always returned.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)

        # 1. Resolve Request & Correlation IDs
        request_id = (
            headers.get("x-request-id")
            or headers.get("x-correlation-id")
            or generate_uuid()
        )
        user_id = headers.get("x-user-id")
        method = scope.get("method", "UNKNOWN")
        path = scope.get("path", "")

        # 2. Store in ASGI scope state for direct handler access (request.state.request_id)
        if "state" not in scope:
            scope["state"] = {}
        scope["state"]["request_id"] = request_id
        if user_id:
            scope["state"]["user_id"] = user_id

        # 3. Bind to structlog contextvars
        structlog.contextvars.clear_contextvars()
        context_bindings = {
            "request_id": request_id,
            "http_method": method,
            "http_path": path,
        }
        if user_id:
            context_bindings["user_id"] = user_id

        structlog.contextvars.bind_contextvars(**context_bindings)

        start_time = time.monotonic()
        status_code = 500
        response_started = False

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code, response_started
            if message["type"] == "http.response.start":
                response_started = True
                status_code = message.get("status", 200)
                # Inject X-Request-ID into outgoing response headers
                mutable_headers = MutableHeaders(scope=message)
                mutable_headers["X-Request-ID"] = request_id

            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            duration_ms = round((time.monotonic() - start_time) * 1000, 2)
            logger.error(
                "unhandled_server_exception",
                exc_info=exc,
                status_code=500,
                duration_ms=duration_ms,
                path=path,
                method=method,
            )
            if not response_started:
                status_code = 500
                fallback_error_response = JSONResponse(
                    status_code=500,
                    content={
                        "error": {
                            "code": "INTERNAL_SERVER_ERROR",
                            "message": "An unexpected error occurred while processing the request.",
                            "request_id": request_id,
                        }
                    },
                    headers={"X-Request-ID": request_id},
                )
                await fallback_error_response(scope, receive, send)
            else:
                raise
        finally:
            duration_ms = round((time.monotonic() - start_time) * 1000, 2)
            log_kwargs = {
                "status_code": status_code,
                "duration_ms": duration_ms,
                "path": path,
                "method": method,
            }

            # Health checks kept quiet at DEBUG level; others at INFO/WARN/ERROR
            if path == "/health":
                logger.debug("http_request_finished", **log_kwargs)
            elif status_code >= 500:
                logger.error("http_request_finished", **log_kwargs)
            elif status_code >= 400:
                logger.warning("http_request_finished", **log_kwargs)
            else:
                logger.info("http_request_finished", **log_kwargs)

            # Clean contextvars to avoid leak between reused worker threads/tasks
            structlog.contextvars.clear_contextvars()
