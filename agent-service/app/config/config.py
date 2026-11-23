import os

from dotenv import load_dotenv
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", "8010"))
APP_NAME = "agents"
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
PROJECT_SERVICE_URL = os.getenv("PROJECT_SERVICE_URL", "http://project_service:8001")
MODEL = os.getenv("MODEL", "gemini-2.5-flash")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = os.getenv("LOG_FORMAT", "console" if ENVIRONMENT == "development" else "json").lower()

# Rate-limiting & Pacing Configuration (Free Tier Resiliency)
INTER_AGENT_DELAY_SECONDS = float(os.getenv("INTER_AGENT_DELAY_SECONDS", "2.0"))
GEMINI_RETRY_ATTEMPTS = int(os.getenv("GEMINI_RETRY_ATTEMPTS", "5"))
GEMINI_RETRY_INITIAL_DELAY = float(os.getenv("GEMINI_RETRY_INITIAL_DELAY", "5.0"))
GEMINI_RETRY_MAX_DELAY = float(os.getenv("GEMINI_RETRY_MAX_DELAY", "60.0"))

RATE_LIMIT_RETRY_OPTIONS = types.HttpRetryOptions(
    attempts=GEMINI_RETRY_ATTEMPTS,
    initial_delay=GEMINI_RETRY_INITIAL_DELAY,
    max_delay=GEMINI_RETRY_MAX_DELAY,
    exp_base=2.0,
    jitter=0.5,
    http_status_codes=[408, 429, 500, 502, 503, 504],
)


class Config:
    def __init__(self):
        self.gemini_api_key = GEMINI_API_KEY
        self.port = PORT
        self.model = MODEL
        self.app_name = APP_NAME
        self.redis_host = REDIS_HOST
        self.redis_port = REDIS_PORT
        self.project_service_url = PROJECT_SERVICE_URL
        self.environment = ENVIRONMENT
        self.log_level = LOG_LEVEL
        self.log_format = LOG_FORMAT
        self.inter_agent_delay_seconds = INTER_AGENT_DELAY_SECONDS
        self.rate_limit_retry_options = RATE_LIMIT_RETRY_OPTIONS
        # Backward-compatibility alias
        self.agent_retry_options = RATE_LIMIT_RETRY_OPTIONS


config = Config()
