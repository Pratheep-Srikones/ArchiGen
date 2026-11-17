import json
import logging

from fastapi import HTTPException
import httpx

from app.config.config import config
from app.config.redis import get_redis_client
from app.schemas.chat import ArchitectureData, GenerateDiagramRequest
from app.utils.ai import chat_utils
from app.utils.uuid import generate_uuid

logger = logging.getLogger(__name__)


async def get_chat_response(user_question: str, session_id: str, user_id: str):
    response = await chat_utils.get_chat_response(user_id, session_id, user_question)
    return {
        "message": "Chat response received successfully",
        "data": {"response": response},
        "error": None,
    }


async def create_new_chat(architecture: ArchitectureData, user_id: str):
    new_session_id = str(generate_uuid())
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


async def _resolve_architecture_context(
    request: GenerateDiagramRequest, user_id: str
) -> ArchitectureData:
    """
    B8: Resolves architecture context server-side from Redis session or Project Service,
    falling back to client-provided context for unsaved draft previews.
    """
    redis_client = await get_redis_client()

    # 1. Fetch from Redis active chat session if session_id is provided
    if request.session_id:
        arch_data = await redis_client.get(f"chat:arch:{user_id}:{request.session_id}")
        if arch_data:
            try:
                return ArchitectureData.model_validate_json(arch_data)
            except Exception as e:
                logger.warning(
                    "Failed to parse cached architecture from Redis session %s: %s",
                    request.session_id,
                    e,
                )

    # 2. Fetch from Redis or Project Service if project_id is provided
    if request.project_id:
        # Check Redis cache first
        cached = await redis_client.get(f"chat:arch:{user_id}:{request.project_id}")
        if cached:
            try:
                return ArchitectureData.model_validate_json(cached)
            except Exception as e:
                logger.warning(
                    "Failed to parse cached architecture from Redis project %s: %s",
                    request.project_id,
                    e,
                )

        # Query project-service server-side
        try:
            url = f"{config.project_service_url}/projects/architecture/{request.project_id}"
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.get(url, headers={"X-User-Id": user_id})
                if resp.status_code == 200:
                    body = resp.json()
                    arch_dict = body.get("data")
                    if arch_dict:
                        return ArchitectureData.model_validate(arch_dict)
                elif resp.status_code == 404:
                    logger.info(
                        "Architecture for project %s not found in project-service",
                        request.project_id,
                    )
        except Exception as e:
            logger.warning("Failed to query project-service for architecture: %s", e)

    # 3. Fallback to client-provided context (for unsaved draft architectures on /result)
    if request.context:
        return request.context

    raise HTTPException(
        status_code=400,
        detail="Architecture context could not be resolved. Please provide a valid project_id, session_id, or context.",
    )


async def generate_diagram(request: GenerateDiagramRequest, user_id: str):
    context = await _resolve_architecture_context(request, user_id)
    response = await chat_utils.generate_diagram(
        context, request.diagram_type, request.prompt
    )
    return {
        "message": "Diagram generated successfully",
        "data": {"diagram": response},
        "error": None,
    }
