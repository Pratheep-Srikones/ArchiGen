from app.config.app import settings
# pyrefly: ignore [missing-import]
import httpx
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Request

router = APIRouter()

AI_SERVICE=settings.AI_SERVICE_URL

@router.api_route("/ai/{path:path}",methods=["GET","POST","PUT","DELETE","PATCH"])
async def proxy_ai(path: str, request: Request):
    user = request.state.user
    target_url = f"{AI_SERVICE}/{path}"

    headers = dict(request.headers)

    headers["X-User-Id"] = user["sub"]
    headers["X-Scopes"] = user.get("scope","")

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
