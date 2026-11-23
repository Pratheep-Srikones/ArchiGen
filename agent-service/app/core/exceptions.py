from typing import Any, Optional
from fastapi import HTTPException


class AppException(HTTPException):
    """
    Base application exception.
    Subclasses FastAPI's HTTPException to maintain backwards compatibility
    with existing status_code and detail consumers while providing structured
    codes and metadata.
    """

    def __init__(
        self,
        status_code: int = 500,
        code: str = "INTERNAL_SERVER_ERROR",
        message: str = "An unexpected error occurred.",
        details: Optional[dict[str, Any]] = None,
        headers: Optional[dict[str, str]] = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.code = code
        self.message = message
        self.details = details or {}


# ── Domain Exceptions (Client / Business Errors: 4xx) ─────────────────────────


class DomainException(AppException):
    """Base class for business rule or domain entity errors."""
    pass


class EntityNotFoundError(DomainException):
    def __init__(
        self,
        message: str = "Requested resource was not found.",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=404,
            code="NOT_FOUND",
            message=message,
            details=details,
        )


class SessionExpiredError(DomainException):
    def __init__(
        self,
        message: str = "Session expired or architecture not found. Please start a new chat session.",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=404,
            code="SESSION_EXPIRED",
            message=message,
            details=details,
        )


class InvalidPayloadError(DomainException):
    def __init__(
        self,
        message: str = "The provided request payload is invalid.",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=400,
            code="INVALID_PAYLOAD",
            message=message,
            details=details,
        )


class UnauthorizedError(DomainException):
    def __init__(
        self,
        message: str = "Unauthorized",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=401,
            code="UNAUTHORIZED",
            message=message,
            details=details,
        )


class ForbiddenError(DomainException):
    def __init__(
        self,
        message: str = "Forbidden: insufficient permissions.",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=403,
            code="FORBIDDEN",
            message=message,
            details=details,
        )


# ── Upstream / Infrastructure Exceptions (502 / 503 / 504 / 429) ───────────────


class UpstreamServiceException(AppException):
    """Base class for third-party or dependent microservice failures."""
    pass


class RedisUnavailableError(UpstreamServiceException):
    def __init__(
        self,
        message: str = "Redis cache service is temporarily unavailable.",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=503,
            code="REDIS_UNAVAILABLE",
            message=message,
            details=details,
        )


class ProjectServiceCallError(UpstreamServiceException):
    def __init__(
        self,
        message: str = "Failed to communicate with project service.",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=502,
            code="PROJECT_SERVICE_ERROR",
            message=message,
            details=details,
        )


class GeminiRateLimitError(UpstreamServiceException):
    def __init__(
        self,
        message: str = "Gemini API rate limit exceeded. Please wait before retrying.",
        retry_after_seconds: int = 30,
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        merged_details = details or {}
        merged_details.setdefault("retry_after_seconds", retry_after_seconds)
        super().__init__(
            status_code=429,
            code="RATE_LIMIT_EXCEEDED",
            message=message,
            details=merged_details,
            headers={"Retry-After": str(retry_after_seconds)},
        )


class GeminiAPIError(UpstreamServiceException):
    def __init__(
        self,
        message: str = "External Gemini API encountered an error.",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=502,
            code="GEMINI_API_ERROR",
            message=message,
            details=details,
        )


# ── Agent & Orchestration Exceptions ──────────────────────────────────────────


class WorkflowExecutionException(AppException):
    """Base class for agent loop or orchestration errors."""
    pass


class AgentParsingError(WorkflowExecutionException):
    def __init__(
        self,
        message: str = "Failed to parse structured output from agent execution.",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=502,
            code="AGENT_PARSING_ERROR",
            message=message,
            details=details,
        )


class MaxRetriesExceededError(WorkflowExecutionException):
    def __init__(
        self,
        message: str = "Agent workflow exceeded maximum validation retry limits.",
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            status_code=500,
            code="MAX_RETRIES_EXCEEDED",
            message=message,
            details=details,
        )

