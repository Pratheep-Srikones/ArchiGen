from typing import Annotated

from fastapi import APIRouter, Depends

from app.controllers.chat_controllers import generate_diagram
from app.schemas.chat import GenerateDiagramRequest
from app.utils.auth import get_current_user_id

router = APIRouter()


@router.post("/diagram", status_code=200)
async def generate_diagram_route(
    request: GenerateDiagramRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    return await generate_diagram(request)
