from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.schemas.user import UserResponse
from app.services import user_service

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    dependencies=[Depends(require_role("manager"))],
)


@router.get("/", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)) -> List[UserResponse]:
    users = user_service.get_all_users(db)
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role.name if u.role else "",
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)) -> UserResponse:
    user = user_service.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.name if user.role else "",
        is_active=user.is_active,
        created_at=user.created_at,
    )
