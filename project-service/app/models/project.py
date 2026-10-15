import uuid
from datetime import datetime
from typing import Optional

from app.db.database import Base
from sqlalchemy import VARCHAR, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql.base import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    title: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationship to the architecture snapshot
    architecture: Mapped[Optional["Architecture"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class Architecture(Base):
    __tablename__ = "architectures"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), unique=True
    )

    title: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    architecture: Mapped[str] = mapped_column(Text, nullable=False)
    mermaid_code: Mapped[str] = mapped_column(Text, nullable=False)

    micro: Mapped[list[dict]] = mapped_column(JSONB, default=list, server_default="[]")
    tech_stack: Mapped[list[dict]] = mapped_column(
        JSONB, default=list, server_default="[]"
    )
    repo: Mapped[list[dict]] = mapped_column(JSONB, default=list, server_default="[]")

    project: Mapped["Project"] = relationship(back_populates="architecture")


class Diagram(Base):
    __tablename__ = "diagrams"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )

    type: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    mermaid_code: Mapped[str] = mapped_column(Text, nullable=False)
