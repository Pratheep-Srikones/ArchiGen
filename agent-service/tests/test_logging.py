import io
import json
import logging
import os
import sys

# Ensure agent-service root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import structlog

from app.core.logging import (
    MASKED_STRING,
    get_logger,
    redact_secrets_processor,
    setup_logging,
)
from app.config.config import config


def test_redact_secrets_keys():
    """Verify that sensitive keys are automatically masked."""
    event_dict = {
        "event": "user_auth_attempt",
        "api_key": "AIzaSySecret1234567890",
        "authorization": "Bearer secret_jwt_token_here",
        "password": "supersecretpassword",
        "gemini_api_key": "some_gemini_key",
        "safe_key": "safe_value",
    }
    sanitized = redact_secrets_processor(None, "info", event_dict)

    assert sanitized["api_key"] == MASKED_STRING
    assert sanitized["authorization"] == MASKED_STRING
    assert sanitized["password"] == MASKED_STRING
    assert sanitized["gemini_api_key"] == MASKED_STRING
    assert sanitized["safe_key"] == "safe_value"


def test_redact_secrets_in_arbitrary_string_values():
    """Verify that sensitive token patterns inside nested/untyped strings are masked."""
    event_dict = {
        "event": "tool_executed",
        "error_message": "Failed calling API with AIzaSyBe6qydTjsgaprH4tF_Gdp6CMNoQRPt2XA for user",
        "headers": "Authorization: Bearer my-secret-jwt-token-value",
    }
    sanitized = redact_secrets_processor(None, "error", event_dict)

    assert MASKED_STRING in sanitized["error_message"]
    assert "AIzaSyBe6qydTjsgaprH4tF_Gdp6CMNoQRPt2XA" not in sanitized["error_message"]
    assert MASKED_STRING in sanitized["headers"]


def test_contextvars_propagation():
    """Verify contextvars bind_contextvars properly attaches metadata to logger calls."""
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id="test-req-1234",
        user_id="test-user-5678",
    )

    logger = get_logger("test_context")
    context = structlog.contextvars.get_contextvars()

    assert context.get("request_id") == "test-req-1234"
    assert context.get("user_id") == "test-user-5678"

    structlog.contextvars.clear_contextvars()
    assert "request_id" not in structlog.contextvars.get_contextvars()


def test_json_and_stdlib_logging(monkeypatch):
    """Verify stdlib logging bridge works and outputs valid structured JSON."""
    monkeypatch.setattr(config, "log_format", "json")
    monkeypatch.setattr(config, "log_level", "INFO")
    setup_logging()

    # Capture stdout
    stream = io.StringIO()
    handler = logging.StreamHandler(stream)
    formatter = logging.getLogger().handlers[0].formatter
    handler.setFormatter(formatter)
    logging.getLogger().addHandler(handler)

    try:
        stdlib_logger = logging.getLogger("app.test_stdlib")
        stdlib_logger.info("Testing stdlib bridge log entry", extra={"custom_field": "val123"})

        output = stream.getvalue().strip()
        assert output, "Expected log output in stream"
        log_json = json.loads(output.splitlines()[-1])

        assert log_json["event"] == "Testing stdlib bridge log entry"
        assert log_json["level"] == "info"
        assert log_json["logger"] == "app.test_stdlib"
        assert log_json["service"] == config.app_name
        assert "timestamp" in log_json
    finally:
        logging.getLogger().removeHandler(handler)
        # Restore default console logging
        monkeypatch.setattr(config, "log_format", "console")
        setup_logging()