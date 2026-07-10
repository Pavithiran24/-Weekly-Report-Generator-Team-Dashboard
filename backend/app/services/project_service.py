from __future__ import annotations

from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def get_all_projects(db: Session, include_inactive: bool = False) -> List[Project]:
    query = db.query(Project).options(joinedload(Project.creator))
    if not include_inactive:
        query = query.filter(Project.is_active == True)
    return query.order_by(Project.created_at.desc()).all()


def get_project_by_id(db: Session, project_id: int) -> Optional[Project]:
    return (
        db.query(Project)
        .options(joinedload(Project.creator))
        .filter(Project.id == project_id)
        .first()
    )


def create_project(db: Session, data: ProjectCreate, user_id: int) -> Project:
    project = Project(
        name=data.name,
        description=data.description,
        created_by=user_id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    # Reload with creator relationship
    db.expire(project)
    project = get_project_by_id(db, project.id)
    return project


def update_project(
    db: Session, project_id: int, data: ProjectUpdate
) -> Project:
    project = get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    project = get_project_by_id(db, project.id)
    return project


def delete_project(db: Session, project_id: int) -> Project:
    project = get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    project.is_active = False
    db.commit()
    db.refresh(project)
    project = get_project_by_id(db, project.id)
    return project
