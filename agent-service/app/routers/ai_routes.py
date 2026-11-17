from typing import Annotated

from fastapi import APIRouter, Depends

from app.controllers.architecture_controllers import generate_architecture
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
