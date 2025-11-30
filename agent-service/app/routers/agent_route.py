from fastapi import APIRouter, HTTPException, Response, Request

from app.services.agent import run_agent

router = APIRouter()

@router.get("/")
async def health_check():
    """
    Health check endpoint to verify that the agent service is running.
    """
    return {"status": "Agent service is healthy"}

@router.post("/query")
async def query_agent(request: Request, response: Response):
    """
    Endpoint to handle user queries related to system architecture design.
    Expects a JSON payload with 'user_prompt' and 'user_id'.
    """
    try:
        data = await request.json()
        user_prompt = data.get("user_prompt")
        user_id = data.get("user_id")

        if not user_prompt or not user_id:
            response.status_code = 400
            return {"data": None, "error":"missing required fields", "message": "Both 'user_prompt' and 'user_id' are required."}

        # Run the agent with the provided prompt and user ID
        agent_response = await run_agent(user_prompt, user_id)

        return {"data": agent_response, "error": None, "message": "Success"}

    except Exception as e:
        response.status_code = 500
        return {"data": None, "error": str(e), "message": "An error occurred while processing the request."}
