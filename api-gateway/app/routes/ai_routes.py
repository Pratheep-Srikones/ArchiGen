import httpx
from app.config.app import settings
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()

AI_SERVICE = settings.AI_SERVICE_URL


@router.api_route("/ai/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_ai(path: str, request: Request):
    user = request.state.user
    target_url = f"{AI_SERVICE}/{path}"

    headers = dict(request.headers)

    headers["X-User-Id"] = user["sub"]
    headers["X-Scopes"] = user.get("scope", "")

    body = await request.body()

    timeout = httpx.Timeout(
        connect=10.0,
        read=300.0,
        write=300.0,
        pool=10.0,
    )

    async with httpx.AsyncClient(timeout=timeout) as client:
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
