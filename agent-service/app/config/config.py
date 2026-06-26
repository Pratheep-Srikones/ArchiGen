import os
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from google.genai import types


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_KEY_2 = os.getenv("GEMINI_API_KEY_2")
PORT = int(os.getenv("PORT", 8010))
APP_NAME = "agents"
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

AGENT_RETRY_OPTIONS=types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1, # Initial delay before first retry (in seconds)
    http_status_codes=[429, 500, 503, 504] # Retry on these HTTP errors
)

def validate_config():
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in environment variables. Please set it before running the application.")
    if not GEMINI_API_KEY_2:
        raise ValueError("GEMINI_API_KEY_2 is not set in environment variables. Please set it before running the application.")
    
class Config:
    def __init__(self):
        validate_config()
        self.gemini_api_key = GEMINI_API_KEY
        self.gemini_api_key_2 = GEMINI_API_KEY_2
        self.port = PORT
        self.agent_retry_options = AGENT_RETRY_OPTIONS
        self.app_name = APP_NAME
        self.redis_host = REDIS_HOST 
        self.redis_port = REDIS_PORT


config = Config()

