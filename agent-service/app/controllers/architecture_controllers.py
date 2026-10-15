import json
from typing import Annotated

from fastapi import Depends, HTTPException

from app.utils.ai import agent
from app.utils.auth import get_current_user_id


async def generate_architecture(
    requirement: str, user_id: Annotated[str, Depends(get_current_user_id)]
) -> any:
    if not requirement:
        raise HTTPException(status_code=400, detail="requirement is required")
    try:
        response_text = await agent.run_architecture_generator(requirement, user_id)

        # Attempt to parse the response as JSON
        try:
            response_json = json.loads(response_text)
            return response_json
        except json.JSONDecodeError:
            raise HTTPException(status_code=502, detail="AI response is not valid JSON")
    except Exception as _:  # noqa: BLE001
        # log exception
        raise HTTPException(
            status_code=502, detail="Error during architecture generation"
        )
