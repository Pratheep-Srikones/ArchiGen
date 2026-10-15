import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.config.app import settings

router = APIRouter()

PROJECT_SERVICE = settings.PROJECT_SERVICE_URL


@router.api_route(
    "/projects/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"]
)
async def proxy_projects(path: str, request: Request):
    user = request.state.user
    target_url = f"{PROJECT_SERVICE}/{path}"

    headers = dict(request.headers)

    headers["X-User-Id"] = user["sub"]
    headers["X-Scopes"] = user.get("scope", "")

    body = await request.body()

    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
            params=dict(request.query_params),
        )

    return JSONResponse(
        content=response.json(),
        status_code=response.status_code,
    )
