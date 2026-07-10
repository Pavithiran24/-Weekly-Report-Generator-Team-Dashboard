from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, model_validator


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_by: int
    creator_name: str = ""
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def extract_creator_name(cls, values: Any) -> Any:
        # When values is an ORM object, extract the creator name from the relationship
        if hasattr(values, "creator") and values.creator is not None:
            # Build a dict-like object that pydantic can use
            obj = {
                "id": values.id,
                "name": values.name,
                "description": values.description,
                "created_by": values.created_by,
                "creator_name": values.creator.name,
                "is_active": values.is_active,
                "created_at": values.created_at,
            }
            return obj
        return values
