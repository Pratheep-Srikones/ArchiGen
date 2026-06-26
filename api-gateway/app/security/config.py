from app.config.app import settings

ASGARDEO_ORG=settings.ASGARDEO_ORG
ASGARDEO_ISSUER = f"https://api.asgardeo.io/t/{ASGARDEO_ORG}/oauth2/token"
OPENID_CONFIG_URL = (
    f"{ASGARDEO_ISSUER}/.well-known/openid-configuration"
)

CLIENT_ID = settings.ASGARDEO_CLIENT_ID