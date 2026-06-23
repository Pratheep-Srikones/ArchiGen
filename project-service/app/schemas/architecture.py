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

class ProjectSaveRequest(BaseModel):
    project_id: str
    user_id: str
    title: str
    requirements: str
    architecture: str
    mermaid_code: str
    micro: List[MicroSectionSchema]
    tech_stack: List[TechItemSchema]
    repo: List[RepoNodeSchema]