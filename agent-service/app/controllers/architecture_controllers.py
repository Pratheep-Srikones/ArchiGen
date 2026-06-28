import asyncio
import json
from app.utils.ai import agent
# pyrefly: ignore [missing-import]
from fastapi import HTTPException
async def generate_architecture(requirement: str) -> any:
    if not requirement:
        raise HTTPException(status_code=400, detail="requirement is required")
    try:
        # For simplicity, we're using a fixed user_id and session_id here.
        # In a real application, these would be dynamic based on the user and conversation.
        user_id = "test_user"
        
        response_text = await agent.run_architecture_generator(requirement, user_id)
        
        # Attempt to parse the response as JSON
        try:
            response_json = json.loads(response_text)
            return response_json
        except json.JSONDecodeError:
            raise HTTPException(status_code=502, detail="AI response is not valid JSON")
    except Exception as e:
        raise HTTPException(status_code=502, detail="Error during architecture generation")

    