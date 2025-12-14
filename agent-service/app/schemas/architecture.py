from pydantic import BaseModel

class GenerateArchitectureRequest(BaseModel):
    user_idea: str

class GenerateArchitectureResponse(BaseModel):
    requirements: object
    architecture: object
    tech_stack: object
    mermaid_code: str

class ArchitectureAPIResponse(BaseModel):
    data: GenerateArchitectureResponse | None
    message: str
    error: str | None