
from fastapi import Depends, HTTPException
from app.security.dependencies import verify_token


def require_scope(required_scope: str):
    async def checker(user=Depends(verify_token)):
        scopes = user.get("scope", "").split()

        if required_scope not in scopes:
            raise HTTPException(status_code=403, detail="Forbidden")

        return user

    return checker