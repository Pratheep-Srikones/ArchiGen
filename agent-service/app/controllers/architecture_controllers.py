import asyncio
import json
from app.exceptions.architecture_exceptions import InvalidInputError, AIServiceError
from app.utils.ai import agent

async def generate_architecture(requirement: str) -> any:
    if not requirement:
        raise InvalidInputError("requirement is required")
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
            raise AIServiceError(f"AI response is not valid JSON: {response_text}")
    except Exception as e:
        raise AIServiceError(f"Error during architecture generation: {str(e)}")

    