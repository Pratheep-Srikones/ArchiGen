import json
from app.config.redis import get_redis_client
from app.utils.uuid import generate_uuid
from app.schemas.chat import ArchitectureData
from app.utils.ai import agent_utils

async def get_chat_response(user_question: str, session_id: str, user_id:str):
    response =  await agent_utils.get_chat_reponse(user_id,session_id,user_question)
    return {
        "message":"Chat response received successfully",
        "data":{
            "response":response
        },
        "error":None
    }

async def create_new_chat(architecture: ArchitectureData, user_id: str):
    new_session_id = generate_uuid()
    redis_client = await get_redis_client()
    await redis_client.set(f"chat:arch:{user_id}:{new_session_id}",json.dumps(architecture.model_dump()), ex=60*60*24)

    return {
        "message":"New chat created successfully",
        "data":{
            "session_id":new_session_id
        },
        "error":None
    }