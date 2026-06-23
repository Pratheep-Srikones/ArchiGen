from sqlalchemy.exc import IntegrityError
from fastapi import status
from fastapi import HTTPException
import uuid
from app.db.database import get_db_session
from app.models.project import Project, Architecture
from fastapi import Depends
from sqlalchemy.ext.asyncio.session import AsyncSession
from app.schemas.architecture import ProjectSaveRequest
from fastapi import APIRouter
router = APIRouter()

@router.get("/{user_id}")
async def get_projects(user_id: str):
    return {"message": "Projects list", "user_id": user_id}

@router.get("/architecture/{project_id}")
async def get_architecture_by_project_id(project_id: str):
    return {"message": "Architecture details", "project_id": project_id}

@router.post("/")
async def save_project_and_architecture(payload: ProjectSaveRequest, db: AsyncSession = Depends(get_db_session)):
    try:
        user_uuid = uuid.UUID(payload.user_id)
        project_uuid = uuid.UUID(payload.project_id)

        new_project = Project(
            id=project_uuid,
            user_id=user_uuid,
            title=payload.title,
            requirements=payload.requirements
        )

        new_architecture = Architecture(
            title=payload.title,
            requirements=payload.requirements,
            architecture=payload.architecture,
            mermaid_code=payload.mermaid_code,
            micro=[item.model_dump() for item in payload.micro],
            tech_stack=[item.model_dump() for item in payload.tech_stack],
            repo=[item.model_dump() for item in payload.repo]
        )

        new_project.architecture = new_architecture

        db.add(new_project)
        await db.commit()
        
        return {
            "status": "success",
            "message": "Project and architecture stored atomically.",
            "project_id": str(new_project.id)
        }

    except ValueError:
        # Catches cases where payload contains malformed UUID strings
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format provided for user_id or project_id."
        )
        
    except IntegrityError as e:
        # Handles database unique constraint or foreign key violations gracefully
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Data integrity violation. A project with this ID might already exist."
        )
        
    except Exception as e:
        # Catch-all failsafe to guarantee no hanging/stale connection sessions
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected storage error occurred: {str(e)}"
        )
        
     