from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.security.config import ASGARDEO_ISSUER, CLIENT_ID
from app.security.jwks import get_signing_key

security = HTTPBearer()


async def verify_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
):
    token = credentials.credentials
    return verify_token_string(token)


def verify_token_string(token: str):
    try:
        signing_key = get_signing_key(token)

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=CLIENT_ID,
            issuer=ASGARDEO_ISSUER,
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid audience")

    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid issuer")

    except Exception as e:  # noqa: BLE001
        print(e)
        raise HTTPException(status_code=401, detail="Invalid token")
