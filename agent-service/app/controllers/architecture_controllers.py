import json
import logging

from fastapi import HTTPException

from app.utils.ai import agent
from app.utils.uuid import generate_uuid

logger = logging.getLogger(__name__)


async def generate_architecture(requirement: str, user_id: str) -> dict:
    if not requirement:
        raise HTTPException(status_code=400, detail="requirement is required")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        response_text = await agent.run_architecture_generator(requirement, user_id)

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as err:
            run_id = str(generate_uuid())
            logger.error(
                "AI response was not valid JSON [run_id=%s]: %s", run_id, err
            )
            raise HTTPException(
                status_code=502,
                detail=f"AI response is not valid JSON (run_id: {run_id})",
            ) from err

    except HTTPException:
        raise
    except Exception as e:
        run_id = str(generate_uuid())
        logger.error(
            "Error during architecture generation [run_id=%s]: %s",
            run_id,
            e,
            exc_info=True,
        )
        raise HTTPException(
            status_code=502,
            detail=f"Error during architecture generation (run_id: {run_id}): {str(e)}",
        ) from e
