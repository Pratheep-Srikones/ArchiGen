from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from fastapi import status
import uuid

from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy import select

from app.models.project import Architecture, Project
from app.schemas.architecture import ProjectSaveRequest


async def get_projects(user_id: str, start: int, count: int, search: str | None, db: AsyncSession):
    try:
        user_uuid = uuid.UUID(user_id)

        filters = [Project.user_id == user_uuid]

        if search:
            filters.append(Project.title.ilike(f"%{search}%"))

        stmt = (
            select(Project)
            .where(*filters)
            .order_by(Project.created_at.desc())
            .offset(start)
            .limit(count)
        )

        result = await db.execute(stmt)
        projects = result.scalars().all()

        count_stmt = select(func.count()).select_from(Project).where(*filters)
        total_count = await db.scalar(count_stmt)

        return {
            "status": "success",
            "message": "Projects fetched successfully.",
            "data": {
                "projects": [
                    {
                        "id": str(p.id),
                        "user_id": str(p.user_id),
                        "title": p.title,
                        "requirements": p.requirements,
                        "created_at": p.created_at.isoformat() if p.created_at else None,
                    }
                    for p in projects
                ],
                "total_count": total_count,
            },
        }

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error")

async def get_architecture_by_project_id(
    project_id: str,
    user_id: str,
    db: AsyncSession
):
    try:
        project_uuid = uuid.UUID(project_id)
        user_uuid = uuid.UUID(user_id)

        stmt = (
            select(Architecture)
            .join(Project, Architecture.project_id == Project.id)
            .where(
                Architecture.project_id == project_uuid,
                Project.user_id == user_uuid
            )
        )

        result = await db.execute(stmt)
        architecture = result.scalars().first()

        if not architecture:
            raise HTTPException(
                status_code=404,
                detail="Architecture not found or access denied"
            )

        return {
            "status": "success",
            "message": "Architecture fetched successfully.",
            "data": architecture,
        }

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error")


async def save_project_and_architecture(payload: ProjectSaveRequest, user_id: str, db: AsyncSession):
    if user_id != payload.user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    try:
        user_uuid = uuid.UUID(user_id)
        project_uuid = uuid.UUID(payload.project_id)

        new_project = Project(
            id=project_uuid,
            user_id=user_uuid,
            title=payload.title,
            requirements=payload.requirements,
        )

        new_architecture = Architecture(
            title=payload.title,
            requirements=payload.requirements,
            architecture=payload.architecture,
            mermaid_code=payload.mermaid_code,
            micro=[item.model_dump() for item in payload.micro],
            tech_stack=[item.model_dump() for item in payload.tech_stack],
            repo=[item.model_dump() for item in payload.repo],
        )

        new_project.architecture = new_architecture

        db.add(new_project)
        await db.commit()

        return {
            "status": "success",
            "message": "Project and architecture stored atomically.",
            "project_id": str(new_project.id),
        }

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format provided for user_id or project_id.",
        )
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A project with this ID might already exist.",
        )
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        )

async def update_architecture(payload: ProjectSaveRequest, user_id: str, db: AsyncSession):
    try:
        user_uuid = uuid.UUID(user_id)
        project_uuid = uuid.UUID(payload.project_id)

        architecture = await db.execute(
            select(Architecture)
            .where(Architecture.project_id == project_uuid)
        )
        architecture = architecture.scalars().first()

        if not architecture:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Architecture not found",
            )

        architecture.title = payload.title
        architecture.requirements = payload.requirements
        architecture.architecture = payload.architecture
        architecture.mermaid_code = payload.mermaid_code
        architecture.micro = [item.model_dump() for item in payload.micro]
        architecture.tech_stack = [item.model_dump() for item in payload.tech_stack]
        architecture.repo = [item.model_dump() for item in payload.repo]

        await db.commit()

        return {
            "status": "success",
            "message": "Architecture updated successfully.",
        }

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format provided for user_id or project_id.",
        )
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        )