import os
import sys

# Ensure agent-service root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

from app.core.error_handlers import register_error_handlers
from app.core.exceptions import (
    AppException,
    EntityNotFoundError,
    GeminiRateLimitError,
    SessionExpiredError,
    UnauthorizedError,
)
from app.middleware.correlation import RequestLoggingMiddleware


class SampleItem(BaseModel):
    name: str = Field(..., min_length=2)
    quantity: int = Field(..., gt=0)


def create_error_test_app() -> FastAPI:
    app = FastAPI()
    register_error_handlers(app)
    app.add_middleware(RequestLoggingMiddleware)

    @app.get("/trigger-app-exception")
    async def trigger_app_exception():
        raise SessionExpiredError(details={"session_id": "sess-abc"})

    @app.get("/trigger-rate-limit")
    async def trigger_rate_limit():
        raise GeminiRateLimitError(retry_after_seconds=45)

    @app.get("/trigger-unauthorized")
    async def trigger_unauthorized():
        raise UnauthorizedError()

    @app.get("/trigger-not-found")
    async def trigger_not_found():
        raise EntityNotFoundError("Project 42 not found")

    @app.get("/trigger-http-exception")
    async def trigger_http_exception():
        raise HTTPException(status_code=400, detail="Missing requirement")

    @app.post("/trigger-validation")
    async def trigger_validation(item: SampleItem):
        return {"status": "ok"}

    @app.get("/trigger-unhandled")
    async def trigger_unhandled():
        raise ValueError("Critical DB connection failure")

    return app


@pytest.fixture
def client():
    app = create_error_test_app()
    return TestClient(app, raise_server_exceptions=False)


def test_session_expired_error(client):
    """Verify custom DomainException returns structured RFC 7807 schema with 404."""
    resp = client.get("/trigger-app-exception", headers={"X-Request-ID": "test-req-err-1"})
    assert resp.status_code == 404
    assert resp.headers.get("x-request-id") == "test-req-err-1"

    data = resp.json()
    assert "error" in data
    assert data["error"]["code"] == "SESSION_EXPIRED"
    assert "Session expired" in data["error"]["message"]
    assert data["error"]["request_id"] == "test-req-err-1"
    assert data["error"]["details"]["session_id"] == "sess-abc"
    assert "timestamp" in data["error"]


def test_rate_limit_error(client):
    """Verify rate limit exception returns 429 and Retry-After header."""
    resp = client.get("/trigger-rate-limit", headers={"X-Request-ID": "test-req-err-2"})
    assert resp.status_code == 429
    assert resp.headers.get("x-request-id") == "test-req-err-2"
    assert resp.headers.get("retry-after") == "45"

    data = resp.json()
    assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert data["error"]["details"]["retry_after_seconds"] == 45


def test_unauthorized_error(client):
    """Verify UnauthorizedError returns 401 with standard code."""
    resp = client.get("/trigger-unauthorized")
    assert resp.status_code == 401
    data = resp.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["message"] == "Unauthorized"


def test_not_found_error(client):
    """Verify EntityNotFoundError returns 404."""
    resp = client.get("/trigger-not-found")
    assert resp.status_code == 404
    data = resp.json()
    assert data["error"]["code"] == "NOT_FOUND"
    assert data["error"]["message"] == "Project 42 not found"


def test_standard_http_exception(client):
    """Verify standard Starlette/FastAPI HTTPException is normalized into standard error format."""
    resp = client.get("/trigger-http-exception")
    assert resp.status_code == 400
    data = resp.json()
    assert data["error"]["code"] == "BAD_REQUEST"
    assert data["error"]["message"] == "Missing requirement"


def test_validation_error_format(client):
    """Verify Pydantic validation failure returns 422 with structured field details."""
    resp = client.post("/trigger-validation", json={"name": "a", "quantity": 0})
    assert resp.status_code == 422
    data = resp.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in data["error"]
    assert "errors" in data["error"]["details"]
    assert len(data["error"]["details"]["errors"]) > 0


def test_unhandled_exception_masked_in_response(client):
    """Verify unexpected server exception returns masked 500 without leaking stack trace."""
    resp = client.get("/trigger-unhandled")
    assert resp.status_code == 500
    data = resp.json()
    assert data["error"]["code"] == "INTERNAL_SERVER_ERROR"
    assert "An unexpected error occurred while processing the request" in data["error"]["message"]
    assert "ValueError" not in resp.text
    assert "Critical DB connection failure" not in resp.text
