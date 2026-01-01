from app.utils.ai import agent_utils

async def get_chat_response(user_question: str):
    return await agent_utils.get_chat_reponse("123","456",user_question)