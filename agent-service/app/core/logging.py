import logging
import re
import sys
from typing import Any, MutableMapping

import structlog
from structlog.types import EventDict, WrappedLogger

from app.config.config import config

# Patterns to identify sensitive keys and values for automatic masking
SENSITIVE_KEY_PATTERNS = re.compile(
    r"(?i)(api[_-]?key|token|secret|password|authorization|auth|cookie|bearer|private[_-]?key)"
)

# Detect common token/key signatures in string values (e.g., Google AIza keys, JWT-like tokens)
SENSITIVE_VALUE_REGEXES = [
    re.compile(r"AIza[0-9A-Za-z_-]{35}"),
    re.compile(r"(?i)bearer\s+[a-zA-Z0-9\-_.]+\b"),
]

MASKED_STRING = "[REDACTED]"
MAX_STRING_LENGTH = 10000  # Truncate overly long values (e.g. gigantic raw prompts) in logs


def _sanitize_value(key: str, val: Any) -> Any:
    """Recursively redacts sensitive values and truncates excessively long strings."""
    if isinstance(key, str) and SENSITIVE_KEY_PATTERNS.search(key):
        return MASKED_STRING

    if isinstance(val, str):
        # Check known regex patterns for sensitive tokens inside arbitrary string values
        for regex in SENSITIVE_VALUE_REGEXES:
            val = regex.sub(MASKED_STRING, val)
        if len(val) > MAX_STRING_LENGTH:
            return f"{val[:MAX_STRING_LENGTH]}... [TRUNCATED len={len(val)}]"
        return val

    if isinstance(val, dict):
        return {k: _sanitize_value(k, v) for k, v in val.items()}

    if isinstance(val, list):
        return [_sanitize_value(key, v) for v in val]

    return val


def redact_secrets_processor(
    logger: WrappedLogger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Structlog processor that traverses the event dict and masks sensitive keys and values."""
    sanitized: EventDict = {}
    for key, value in event_dict.items():
        sanitized[key] = _sanitize_value(key, value)
    return sanitized


def add_service_context_processor(
    logger: WrappedLogger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Injects static service metadata into every log entry."""
    event_dict.setdefault("service", config.app_name)
    event_dict.setdefault("environment", config.environment)
    return event_dict


def setup_logging() -> None:
    """
    Initializes industry-grade structured logging for the application.
    
    1. Configures structlog pipeline with contextvars, timestamps, secret masking.
    2. Bridges Python's standard library logging and uvicorn handlers to structlog.
    3. Renders clean, colorized output in local development, and structured JSON in production.
    """
    is_json = config.log_format == "json"
    log_level = getattr(logging, config.log_level.upper(), logging.INFO)

    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        add_service_context_processor,
        redact_secrets_processor,
    ]

    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    if is_json:
        formatter_renderer = structlog.processors.JSONRenderer()
    else:
        formatter_renderer = structlog.dev.ConsoleRenderer(
            colors=sys.stderr.isatty() or True,
            pad_event_to=30,
        )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            formatter_renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level)

    # Re-route uvicorn loggers so access and server logs share the exact same format
    for uvicorn_logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        u_logger = logging.getLogger(uvicorn_logger_name)
        u_logger.handlers.clear()
        u_logger.addHandler(handler)
        u_logger.setLevel(log_level)
        u_logger.propagate = False


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Returns a structured logger instance bound to the caller module."""
    return structlog.get_logger(name)