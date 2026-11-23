import json
from typing import AsyncGenerator

from fastapi import HTTPException

from app.core.exceptions import AgentParsingError, InvalidPayloadError, UnauthorizedError
from app.core.logging import get_logger
from app.utils.ai import agent
from app.utils.uuid import generate_uuid

logger = get_logger(__name__)


async def generate_architecture(requirement: str, user_id: str) -> dict:
    if not requirement:
        raise InvalidPayloadError(message="requirement is required")
    if not user_id:
        raise UnauthorizedError()

    try:
        response_text = await agent.run_architecture_generator(requirement, user_id)

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as err:
            run_id = str(generate_uuid())
            logger.error(
                "ai_response_invalid_json",
                run_id=run_id,
                error=str(err),
            )
            raise AgentParsingError(
                message=f"AI response is not valid JSON (run_id: {run_id})",
                details={"run_id": run_id, "error": str(err)},
            ) from err

    except HTTPException:
        raise
    except Exception as e:
        run_id = str(generate_uuid())
        logger.error(
            "architecture_generation_failed",
            run_id=run_id,
            error=str(e),
            exc_info=True,
        )
        raise AgentParsingError(
            message=f"Error during architecture generation (run_id: {run_id}): {str(e)}",
            details={"run_id": run_id, "error": str(e)},
        ) from e


async def generate_architecture_stream(
    requirement: str, user_id: str
) -> AsyncGenerator[str, None]:
    if not requirement or not requirement.strip():
        raise InvalidPayloadError(message="requirement is required")
    if not user_id:
        raise UnauthorizedError()

    async for chunk in agent.run_architecture_generator_stream(requirement, user_id):
        yield chunk

