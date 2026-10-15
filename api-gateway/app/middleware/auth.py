from app.security.dependencies import verify_token_string
from fastapi import Request
from fastapi.responses import JSONResponse


async def auth_middleware(req: Request, call_next):
    if req.method == "OPTIONS":
        return await call_next(req)

    public_paths = ["/health", "/docs", "/openapi.json"]

    if req.url.path in public_paths:
        return await call_next(req)

    auth_header = req.headers.get("Authorization")

    if not auth_header:
        return JSONResponse(
            status_code=401,
            content={"detail": "Missing Authorization header"},
        )

    if not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid Authorization header"},
        )

    token = auth_header.split(" ")[1]

    payload = verify_token_string(token)

    req.state.user = payload

    return await call_next(req)
