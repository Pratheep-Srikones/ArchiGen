# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import JSONB
# pyrefly: ignore [missing-import]
from sqlalchemy import ForeignKey
from typing import List
# pyrefly: ignore [missing-import]
from sqlalchemy import func
# pyrefly: ignore [missing-import]
from sqlalchemy import DateTime
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import VARCHAR
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
# pyrefly: ignore [missing-import]
from sqlalchemy import Text
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql.base import UUID
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import mapped_column
import uuid
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped
from typing import Optional
from app.db.database import Base

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    title: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to the architecture snapshot
    architecture: Mapped[Optional["Architecture"]] = relationship(
        back_populates="project", 
        cascade="all, delete-orphan"
    )

class Architecture(Base):
    __tablename__ = "architectures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), unique=True)
    
    title: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    architecture: Mapped[str] = mapped_column(Text, nullable=False)
    mermaid_code: Mapped[str] = mapped_column(Text, nullable=False)
    
    micro: Mapped[List[dict]] = mapped_column(JSONB, default=list, server_default='[]')
    tech_stack: Mapped[List[dict]] = mapped_column(JSONB, default=list, server_default='[]')
    repo: Mapped[List[dict]] = mapped_column(JSONB, default=list, server_default='[]')
    
    project: Mapped["Project"] = relationship(back_populates="architecture")

class Diagram(Base):
    __tablename__ = "diagrams"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    type: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    mermaid_code: Mapped[str] = mapped_column(Text, nullable=False)


    
    