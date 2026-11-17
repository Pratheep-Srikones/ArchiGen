from typing import Literal

from pydantic import BaseModel, Field


class ValidationVerdict(BaseModel):
    verdict: Literal["ok", "retry"]
    issues: list[str] = Field(
        default_factory=list,
        description="List of specific, actionable issues or missing components if retry is needed.",
    )
    score: int = Field(
        ge=0,
        le=10,
        default=10,
        description="Quality and readiness score between 0 and 10 (7+ is acceptable/ok).",
    )


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
    projectId: str | None = None
    title: str
    requirements: str = ""
    architecture: str
    mermaid_code: str
    micro: list[MicroSectionSchema] = Field(default_factory=list)
    tech_stack: list[TechItemSchema] = Field(default_factory=list)
    repo: list[RepoNodeSchema] = Field(default_factory=list)


class GenerateArchitectureRequest(BaseModel):
    user_idea: str
