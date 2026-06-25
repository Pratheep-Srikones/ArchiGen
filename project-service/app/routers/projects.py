from app.schemas.architecture import UpdateMermaidCodeRequest
from app.security.dependencies import verify_token
from fastapi import Query
from typing import Optional
from app.db.database import get_db_session
from fastapi import Depends
from sqlalchemy.ext.asyncio.session import AsyncSession
from app.schemas.architecture import ProjectSaveRequest
from fastapi import APIRouter
from app.controllers.projects import (
    get_architecture_by_project_id as get_architecture_by_project_id_controller,
    get_projects as get_projects_controller,
    save_project_and_architecture as save_project_and_architecture_controller,
    update_architecture as update_architecture_controller,
)

router = APIRouter()

@router.get("/")
async def get_projects(
    start: int = Query(0, ge=0),
    count: int = Query(6, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db_session),
    user= Depends(verify_token)
):
    user_id = user.get("sub")
    return await get_projects_controller(user_id, start, count, search, db)

@router.get("/architecture/{project_id}")
async def get_architecture_by_project_id(
    project_id: str, 
    db: AsyncSession = Depends(get_db_session),
    user= Depends(verify_token)
):
    user_id = user.get("sub")
    return await get_architecture_by_project_id_controller(project_id, user_id, db)

@router.post("/")
async def save_project_and_architecture(payload: ProjectSaveRequest, db: AsyncSession = Depends(get_db_session), user= Depends(verify_token)):
    user_id = user.get("sub")
    return await save_project_and_architecture_controller(payload, user_id, db)

@router.patch("/{project_id}/architecture")
async def update_architecture(project_id: str, payload: UpdateMermaidCodeRequest, db: AsyncSession = Depends(get_db_session), user= Depends(verify_token)):
    user_id = user.get("sub")
    return await update_architecture_controller(project_id, payload.mermaid_code, user_id, db)
        
     