from pydantic import BaseModel

class GenerateArchitectureRequest(BaseModel):
    user_idea: str
