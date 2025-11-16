import os
from dotenv import load_dotenv
from google.genai import types


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", 8010))

AGENT_RETRY_OPTIONS=types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1, # Initial delay before first retry (in seconds)
    http_status_codes=[429, 500, 503, 504] # Retry on these HTTP errors
)

def validate_config():
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in environment variables. Please set it before running the application.")
    
class Config:
    def __init__(self):
        validate_config()
        self.gemini_api_key = GEMINI_API_KEY
        self.port = PORT
        self.agent_retry_options = AGENT_RETRY_OPTIONS


config = Config()

