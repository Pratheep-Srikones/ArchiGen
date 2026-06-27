# pyrefly: ignore [missing-import]
from fastapi import APIRouter

from app.schemas.chat import GenerateDiagramRequest
from app.controllers.chat_controllers import generate_diagram

router = APIRouter()

@router.post("/diagram", status_code=200)
async def generate_diagram_route(request:GenerateDiagramRequest, user_id="user-123-xyz"): #user_id= Depends(get_current_user_id)
    return await generate_diagram(request)