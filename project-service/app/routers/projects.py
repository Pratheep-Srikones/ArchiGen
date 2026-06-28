from app.schemas.architecture import CreateDiagramRequest
from app.utils.auth import get_current_user_id
from app.schemas.architecture import UpdateMermaidCodeRequest
# pyrefly: ignore [missing-import]
from fastapi import Query
from typing import Optional
from app.db.database import get_db_session
# pyrefly: ignore [missing-import]
from fastapi import Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio.session import AsyncSession
from app.schemas.architecture import ProjectSaveRequest
# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from app.controllers.projects import (
    get_architecture_by_project_id as get_architecture_by_project_id_controller,
    get_projects as get_projects_controller,
    save_project_and_architecture as save_project_and_architecture_controller,
    update_architecture as update_architecture_controller,
    save_diagram as save_diagram_controller,
    get_diagrams as get_diagrams_controller
)

router = APIRouter()

@router.get("/")
async def get_projects(
    start: int = Query(0, ge=0),
    count: int = Query(6, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db_session),
    user_id= Depends(get_current_user_id)
):
    return await get_projects_controller(user_id, start, count, search, db)

@router.get("/architecture/{project_id}")
async def get_architecture_by_project_id(
    project_id: str, 
    db: AsyncSession = Depends(get_db_session),
    user_id= Depends(get_current_user_id)
):
    return await get_architecture_by_project_id_controller(project_id, user_id, db)

@router.post("/")
async def save_project_and_architecture(payload: ProjectSaveRequest, db: AsyncSession = Depends(get_db_session), user_id= Depends(get_current_user_id)):
    return await save_project_and_architecture_controller(payload, user_id, db)

@router.patch("/{project_id}/architecture")
async def update_architecture(project_id: str, payload: UpdateMermaidCodeRequest, db: AsyncSession = Depends(get_db_session), user_id= Depends(get_current_user_id)):
    return await update_architecture_controller(project_id, payload.mermaid_code, user_id, db)

@router.get("/diagram/{project_id}")
async def get_diagram(
    project_id: str, 
    db: AsyncSession = Depends(get_db_session),
    user_id= Depends(get_current_user_id)
):
    return await get_diagrams_controller(project_id, user_id, db)
    
@router.post("/diagram/{project_id}")
async def save_diagram(project_id: str, payload: CreateDiagramRequest, db: AsyncSession = Depends(get_db_session), user_id= Depends(get_current_user_id)):
    return await save_diagram_controller(project_id, payload.type, payload.mermaid_code, user_id, db)
    