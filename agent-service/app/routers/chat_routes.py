from app.controllers.chat_controllers import create_new_chat
from app.utils.auth import get_current_user_id
from app.schemas.chat import CreateChatRequest
from app.controllers.chat_controllers import get_chat_response
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends

from app.schemas.chat import ChatRequest

router = APIRouter()

@router.post(
    "/chat",
    response_model=dict,
    status_code=200)
async def chat_route(payload: ChatRequest, user_id= "user-123-xyz"): # user_id= Depends(get_current_user_id)
    return await get_chat_response(payload.user_question, payload.session_id, user_id)

@router.post(
    "/chat/new",
    response_model=dict,
    status_code=201
)
async def create_new_chat_route(payload: CreateChatRequest, user_id= "user-123-xyz"):
    return await create_new_chat(payload, user_id)
    
