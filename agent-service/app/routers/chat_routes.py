from app.controllers.chat_controllers import get_chat_response
from fastapi import APIRouter

from app.schemas.chat import ChatRequest

router = APIRouter()

@router.post(
    "/chat",
    response_model=dict,
    status_code=200)
async def chat_route(req: ChatRequest):
    user_question = req.user_question
    response = await get_chat_response(user_question)
    return {
        "data": response,
        "message": "Chat response generated successfully",
        "error": None,
    }
