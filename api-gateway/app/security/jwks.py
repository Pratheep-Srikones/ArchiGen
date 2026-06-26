from app.security.config import OPENID_CONFIG_URL
import requests

from jwt import PyJWKClient

def get_jwks_client():
    oidc_config = requests.get(OPENID_CONFIG_URL).json()
    jwks_uri = oidc_config["jwks_uri"]

    return PyJWKClient(jwks_uri, cache_keys=True)

jwks_client = get_jwks_client()

def get_signing_key(token: str):
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    return signing_key.key