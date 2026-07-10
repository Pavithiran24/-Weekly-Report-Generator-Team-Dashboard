from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenData

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta is not None:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: Optional[int] = payload.get("sub")
        email: Optional[str] = payload.get("email")
        role: Optional[str] = payload.get("role")
        if user_id is None or email is None or role is None:
            raise JWTError("Missing fields in token")
        return TokenData(user_id=int(user_id), email=email, role=role)
    except JWTError as exc:
        raise exc


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if user is None:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def register_user(db: Session, data: RegisterRequest) -> User:
    from fastapi import HTTPException, status

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    role = db.query(Role).filter(Role.name == data.role_name).first()
    if role is None:
        # Fall back to 'member' if role_name not found
        role = db.query(Role).filter(Role.name == "member").first()
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role '{data.role_name}' not found",
            )

    hashed = get_password_hash(data.password)
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hashed,
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
