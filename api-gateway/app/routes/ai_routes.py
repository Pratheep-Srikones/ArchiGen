import json
import logging
from typing import AsyncGenerator

import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse

from app.config.app import settings

logger = logging.getLogger(__name__)

router = APIRouter()

AI_SERVICE = settings.AI_SERVICE_URL

# Hop-by-hop and connection headers to strip before proxying upstream
STRIP_HEADERS = {
    "host",
    "content-length",
    "transfer-encoding",
    "connection",
    "upgrade",
    "http2-settings",
    "proxy-connection",
}


def _prepare_proxy_headers(request: Request, user: dict) -> dict:
    headers = {
        k: v for k, v in request.headers.items() if k.lower() not in STRIP_HEADERS
    }
    headers["X-User-Id"] = user.get("sub", "")
    headers["X-Scopes"] = user.get("scope", "")
    return headers


async def _stream_upstream(
    client: httpx.AsyncClient,
    response: httpx.Response,
) -> AsyncGenerator[bytes, None]:
    try:
        async for chunk in response.aiter_raw():
            yield chunk
    finally:
        await response.aclose()
        await client.aclose()


@router.post("/ai/generate-architecture/stream")
async def proxy_generate_architecture_stream(request: Request):
    user = getattr(request.state, "user", {}) or {}
    target_url = f"{AI_SERVICE}/generate-architecture/stream"

    headers = _prepare_proxy_headers(request, user)
    body = await request.body()

    timeout = httpx.Timeout(
        connect=10.0,
        read=300.0,
        write=300.0,
        pool=10.0,
    )

    client = httpx.AsyncClient(timeout=timeout)
    try:
        req = client.build_request(
            method="POST",
            url=target_url,
            headers=headers,
            content=body,
            params=dict(request.query_params),
        )
        response = await client.send(req, stream=True)

        content_type = response.headers.get("content-type", "")

        # If backend returned an error status with non-streaming JSON (e.g. 400, 401, 502)
        if response.status_code >= 400 and not content_type.startswith("text/event-stream"):
            content = await response.aread()
            await response.aclose()
            await client.aclose()
            try:
                data = json.loads(content)
                return JSONResponse(content=data, status_code=response.status_code)
            except Exception:
                return Response(
                    content=content,
                    status_code=response.status_code,
                    media_type=content_type or "application/json",
                )

        return StreamingResponse(
            _stream_upstream(client, response),
            status_code=response.status_code,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        await client.aclose()
        logger.error("Failed to proxy streaming request to AI service: %s", e, exc_info=True)
        return JSONResponse(
            status_code=502,
            content={"detail": f"Failed to connect to AI streaming service: {str(e)}"},
        )


@router.api_route("/ai/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_ai(path: str, request: Request):
    user = getattr(request.state, "user", {}) or {}
    target_url = f"{AI_SERVICE}/{path}"

    headers = _prepare_proxy_headers(request, user)
    body = await request.body()

    timeout = httpx.Timeout(
        connect=10.0,
        read=300.0,
        write=300.0,
        pool=10.0,
    )

    client = httpx.AsyncClient(timeout=timeout)
    try:
        req = client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
            params=dict(request.query_params),
        )
        response = await client.send(req, stream=True)

        content_type = response.headers.get("content-type", "")
        # If response is SSE stream, stream it
        if "text/event-stream" in content_type:
            return StreamingResponse(
                _stream_upstream(client, response),
                status_code=response.status_code,
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                },
            )

        # Standard buffered response
        content = await response.aread()
        await response.aclose()
        await client.aclose()

        try:
            return JSONResponse(
                content=json.loads(content),
                status_code=response.status_code,
            )
        except Exception:
            return Response(
                content=content,
                status_code=response.status_code,
                media_type=content_type or "application/json",
            )
    except Exception as e:
        await client.aclose()
        logger.error("Error proxying request to %s: %s", target_url, e, exc_info=True)
        return JSONResponse(
            status_code=502,
            content={"detail": f"Error proxying request to AI service: {str(e)}"},
        )
