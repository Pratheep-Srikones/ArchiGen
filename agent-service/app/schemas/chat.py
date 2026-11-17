from typing import Literal

from pydantic import BaseModel

from app.schemas.architecture import (
    ArchitectureData,
    MicroSectionSchema,
    RepoNodeSchema,
    TechItemSchema,
    ValidationVerdict,
)

__all__ = [
    "ArchitectureData",
    "ChatRequest",
    "CreateChatRequest",
    "GenerateDiagramRequest",
    "MicroSectionSchema",
    "ModifyDiagramRequest",
    "RepoNodeSchema",
    "TechItemSchema",
    "ValidationVerdict",
]


class ChatRequest(BaseModel):
    session_id: str
    user_question: str


class CreateChatRequest(BaseModel):
    architecture: ArchitectureData


class GenerateDiagramRequest(BaseModel):
    project_id: str | None = None
    session_id: str | None = None
    context: ArchitectureData | None = None
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
    project_id: str | None = None
    session_id: str | None = None
    context: ArchitectureData | None = None
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
