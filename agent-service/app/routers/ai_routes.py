from fastapi import APIRouter
from app.schemas.architecture import (
    GenerateArchitectureRequest,
    GenerateArchitectureResponse,
    ArchitectureAPIResponse,
)
from app.controllers.architecture_controllers import generate_architecture

router = APIRouter()

@router.post(
    "/generate-architecture",
    response_model=ArchitectureAPIResponse,
    status_code=200,
)
async def generate_architecture_route(req: GenerateArchitectureRequest):
    result = await generate_architecture(req.user_idea)

    return {
        "data": result,
        "message": "Architecture generated successfully",
        "error": None,
    }
