from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models.user import User


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.id == user_id)
        .first()
    )


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.email == email)
        .first()
    )


def get_all_users(db: Session) -> List[User]:
    return (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.is_active == True)
        .all()
    )


def get_user_with_role(db: Session, user_id: int) -> Optional[User]:
    return (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.id == user_id)
        .first()
    )
