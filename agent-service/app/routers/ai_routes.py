from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.controllers.architecture_controllers import (
    generate_architecture,
    generate_architecture_stream,
)
from app.schemas.architecture import GenerateArchitectureRequest
from app.utils.auth import get_current_user_id

router = APIRouter()


@router.post(
    "/generate-architecture",
    status_code=200,
)
async def generate_architecture_route(
    req: GenerateArchitectureRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    result = await generate_architecture(req.user_idea, user_id)

    return {
        "data": result,
        "message": "Architecture generated successfully",
        "error": None,
    }


@router.post(
    "/generate-architecture/stream",
    status_code=200,
)
async def generate_architecture_stream_route(
    req: GenerateArchitectureRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    if not req.user_idea or not req.user_idea.strip():
        raise HTTPException(status_code=400, detail="requirement is required")

    return StreamingResponse(
        generate_architecture_stream(req.user_idea, user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )