import os
import sys

# Ensure agent-service root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import structlog
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.testclient import TestClient

from app.middleware.correlation import RequestLoggingMiddleware


def create_test_app() -> FastAPI:
    test_app = FastAPI()
    test_app.add_middleware(RequestLoggingMiddleware)

    @test_app.get("/test-context")
    async def sample_endpoint(request: Request):
        context = structlog.contextvars.get_contextvars()
        return {
            "state_request_id": getattr(request.state, "request_id", None),
            "state_user_id": getattr(request.state, "user_id", None),
            "context_request_id": context.get("request_id"),
            "context_user_id": context.get("user_id"),
        }

    @test_app.get("/test-stream")
    async def sample_stream():
        async def event_generator():
            yield "data: chunk 1\n\n"
            yield "data: chunk 2\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    @test_app.get("/test-error")
    async def sample_error():
        raise RuntimeError("Something exploded")

    return test_app


@pytest.fixture
def client():
    app = create_test_app()
    return TestClient(app, raise_server_exceptions=False)


def test_generated_request_id_when_missing(client):
    """When no request ID header is sent, a fresh UUID is generated and returned."""
    resp = client.get("/test-context")
    assert resp.status_code == 200

    resp_request_id = resp.headers.get("x-request-id")
    assert resp_request_id is not None
    assert len(resp_request_id) == 36  # Standard UUID length

    data = resp.json()
    assert data["state_request_id"] == resp_request_id
    assert data["context_request_id"] == resp_request_id

    # Verify contextvars cleaned up after request completes
    assert "request_id" not in structlog.contextvars.get_contextvars()


def test_custom_x_request_id_preserved(client):
    """When client passes X-Request-ID, the same ID is bound and echoed back."""
    custom_id = "req-custom-abc-123"
    resp = client.get("/test-context", headers={"X-Request-ID": custom_id})

    assert resp.status_code == 200
    assert resp.headers.get("x-request-id") == custom_id

    data = resp.json()
    assert data["state_request_id"] == custom_id
    assert data["context_request_id"] == custom_id


def test_x_correlation_id_fallback(client):
    """When client passes X-Correlation-ID without X-Request-ID, it is honored."""
    correlation_id = "corr-xyz-987"
    resp = client.get("/test-context", headers={"X-Correlation-ID": correlation_id})

    assert resp.status_code == 200
    assert resp.headers.get("x-request-id") == correlation_id

    data = resp.json()
    assert data["state_request_id"] == correlation_id
    assert data["context_request_id"] == correlation_id


def test_x_user_id_propagation(client):
    """When X-User-Id is provided, it is bound to state and contextvars."""
    user_id = "usr_authenticated_42"
    resp = client.get("/test-context", headers={"X-User-Id": user_id})

    assert resp.status_code == 200
    data = resp.json()
    assert data["state_user_id"] == user_id
    assert data["context_user_id"] == user_id


def test_streaming_response_header_injection(client):
    """Verify that streaming endpoints properly receive X-Request-ID header without buffering issues."""
    resp = client.get("/test-stream", headers={"X-Request-ID": "stream-test-id"})
    assert resp.status_code == 200
    assert resp.headers.get("x-request-id") == "stream-test-id"
    assert "data: chunk 1" in resp.text
    assert "data: chunk 2" in resp.text


def test_server_error_still_includes_request_id(client):
    """Verify that even when an unhandled 500 error occurs, X-Request-ID header is present."""
    custom_id = "error-test-req-id"
    resp = client.get("/test-error", headers={"X-Request-ID": custom_id})
    assert resp.status_code == 500
    assert resp.headers.get("x-request-id") == custom_id

