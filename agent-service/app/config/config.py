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

AGENT_RETRY_OPTIONS = types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,  # Initial delay before first retry (in seconds)
    http_status_codes=[429, 500, 503, 504],  # Retry on these HTTP errors
)


class Config:
    def __init__(self):
        self.gemini_api_key = GEMINI_API_KEY
        self.port = PORT
        self.agent_retry_options = AGENT_RETRY_OPTIONS
        self.app_name = APP_NAME
        self.redis_host = REDIS_HOST
        self.redis_port = REDIS_PORT
        self.project_service_url = PROJECT_SERVICE_URL


config = Config()
