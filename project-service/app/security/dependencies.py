import jwt 
from app.security.jwks import get_signing_key
from app.security.config import CLIENT_ID, ASGARDEO_ISSUER

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        signing_key = get_signing_key(token)

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=CLIENT_ID,
            issuer=ASGARDEO_ISSUER,
        )
        print("Token payload: ",payload)
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid audience")

    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid issuer")

    except Exception as e:
        print(e)
        raise HTTPException(status_code=401, detail="Invalid token")