import json

from app.config.redis import get_redis_client
from app.schemas.chat import ArchitectureData, GenerateDiagramRequest
from app.utils.ai import chat_utils
from app.utils.uuid import generate_uuid


async def get_chat_response(user_question: str, session_id: str, user_id: str):
    response = await chat_utils.get_chat_response(user_id, session_id, user_question)
    return {
        "message": "Chat response received successfully",
        "data": {"response": response},
        "error": None,
    }


async def create_new_chat(architecture: ArchitectureData, user_id: str):
    new_session_id = generate_uuid()
    redis_client = await get_redis_client()
    await redis_client.set(
        f"chat:arch:{user_id}:{new_session_id}",
        json.dumps(architecture.model_dump()),
        ex=60 * 60 * 24,
    )

    return {
        "message": "New chat created successfully",
        "data": {"session_id": new_session_id},
        "error": None,
    }


async def generate_diagram(request: GenerateDiagramRequest):
    response = await chat_utils.generate_diagram(
        request.context, request.diagram_type, request.prompt
    )
    return {
        "message": "Diagram generated successfully",
        "data": {"diagram": response},
        "error": None,
    }
