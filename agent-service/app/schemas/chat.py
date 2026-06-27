# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class TechItemSchema(BaseModel):
    name: str
    layer: Literal["Frontend", "Backend", "Database", "Infrastructure", "DevOps", "Messaging"]
    role: str
    justification: str

class MicroSectionSchema(BaseModel):
    title: str
    body: str

# Recursive Model for Directory Structure
class RepoNodeSchema(BaseModel):
    name: str
    type: Literal["directory", "file"]
    annotation: Optional[str] = None
    children: Optional[List["RepoNodeSchema"]] = Field(default_factory=list)


class ArchitectureData(BaseModel):
    title: str
    requirements: str
    architecture: str
    mermaid_code: str
    micro: List[MicroSectionSchema]
    tech_stack: List[TechItemSchema]
    repo: List[RepoNodeSchema]

class ChatRequest(BaseModel):
    session_id: str
    user_question: str

class CreateChatRequest(BaseModel):
    architecture: ArchitectureData

class GenerateDiagramRequest(BaseModel):
    context: ArchitectureData
    diagram_type: Literal["sequence", "class", "component", "deployment", "usecase", "activity", "state","flowchart", "er"]
    prompt: str 

class ModifyDiagramRequest(BaseModel):
    context: ArchitectureData
    diagram_type: Literal["sequence", "class", "component", "deployment", "usecase", "activity", "state","flowchart", "er"]
    prompt: str 
    diagram_code: str
    change: str
