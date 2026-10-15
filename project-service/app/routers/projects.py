from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio.session import AsyncSession

from app.controllers.projects import (
    get_architecture_by_project_id as get_architecture_by_project_id_controller,
)
from app.controllers.projects import get_diagrams as get_diagrams_controller
from app.controllers.projects import get_projects as get_projects_controller
from app.controllers.projects import save_diagram as save_diagram_controller
from app.controllers.projects import (
    save_project_and_architecture as save_project_and_architecture_controller,
)
from app.controllers.projects import (
    update_architecture as update_architecture_controller,
)
from app.db.database import get_db_session
from app.schemas.architecture import (
    CreateDiagramRequest,
    ProjectSaveRequest,
    UpdateMermaidCodeRequest,
)
from app.utils.auth import get_current_user_id

router = APIRouter()


@router.get("/")
async def get_projects(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    user_id: Annotated[str, Depends(get_current_user_id)],
    start: int = Query(0, ge=0),
    count: int = Query(6, ge=1, le=100),
    search: str | None = Query(None),
):
    return await get_projects_controller(user_id, start, count, search, db)


@router.get("/architecture/{project_id}")
async def get_architecture_by_project_id(
    project_id: str,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    return await get_architecture_by_project_id_controller(project_id, user_id, db)


@router.post("/")
async def save_project_and_architecture(
    payload: ProjectSaveRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    return await save_project_and_architecture_controller(payload, user_id, db)


@router.patch("/{project_id}/architecture")
async def update_architecture(
    project_id: str,
    payload: UpdateMermaidCodeRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    return await update_architecture_controller(
        project_id, payload.mermaid_code, user_id, db
    )


@router.get("/diagram/{project_id}")
async def get_diagram(
    project_id: str,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    return await get_diagrams_controller(project_id, user_id, db)


@router.post("/diagram/{project_id}")
async def save_diagram(
    project_id: str,
    payload: CreateDiagramRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    return await save_diagram_controller(
        project_id, payload.type, payload.mermaid_code, user_id, db
    )

