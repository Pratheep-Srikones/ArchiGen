from typing import Literal

from pydantic import BaseModel, Field


class TechItemSchema(BaseModel):
    name: str
    layer: Literal[
        "Frontend", "Backend", "Database", "Infrastructure", "DevOps", "Messaging"
    ]
    role: str
    justification: str


class MicroSectionSchema(BaseModel):
    title: str
    body: str


# Recursive Model for Directory Structure
class RepoNodeSchema(BaseModel):
    name: str
    type: Literal["directory", "file"]
    annotation: str | None = None
    children: list["RepoNodeSchema"] | None = Field(default_factory=list)


class ArchitectureData(BaseModel):
    title: str
    requirements: str
    architecture: str
    mermaid_code: str
    micro: list[MicroSectionSchema]
    tech_stack: list[TechItemSchema]
    repo: list[RepoNodeSchema]


class ChatRequest(BaseModel):
    session_id: str
    user_question: str


class CreateChatRequest(BaseModel):
    architecture: ArchitectureData


class GenerateDiagramRequest(BaseModel):
    context: ArchitectureData
    diagram_type: Literal[
        "sequence",
        "class",
        "component",
        "deployment",
        "usecase",
        "activity",
        "state",
        "flowchart",
        "er",
    ]
    prompt: str


class ModifyDiagramRequest(BaseModel):
    context: ArchitectureData
    diagram_type: Literal[
        "sequence",
        "class",
        "component",
        "deployment",
        "usecase",
        "activity",
        "state",
        "flowchart",
        "er",
    ]
    prompt: str
    diagram_code: str
    change: str
