# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings,SettingsConfigDict
# pyrefly: ignore [missing-import]
from pydantic import ValidationError  
import sys

class Settings(BaseSettings):
    ASGARDEO_ORG: str
    ASGARDEO_CLIENT_ID: str
    PROJECT_SERVICE_URL: str
    AI_SERVICE_URL: str

    model_config = SettingsConfigDict(env_file=".env")

def load_settings() -> Settings:
    try:
        # Pydantic eagerly validates upon instantiation
        return Settings()
    except ValidationError as e:
        print("Environment variables are missing or invalid")
        
        # Format and log the specific environment fields that are missing/wrong
        for error in e.errors():
            field_name = " -> ".join(str(loc) for loc in error["loc"])  
            print(field_name)
            
            
        # Exit with a non-zero code to let orchestrators know it failed completely
        sys.exit(1)

settings = load_settings()
