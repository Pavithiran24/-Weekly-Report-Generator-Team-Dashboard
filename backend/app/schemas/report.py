from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class ReportBase(BaseModel):
    project_id: int
    week_start: date
    week_end: date
    tasks_completed: List[str]
    tasks_planned: str
    blockers: Optional[str] = None
    hours_worked: float


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    project_id: Optional[int] = None
    week_start: Optional[date] = None
    week_end: Optional[date] = None
    tasks_completed: Optional[List[str]] = None
    tasks_planned: Optional[str] = None
    blockers: Optional[str] = None
    hours_worked: Optional[float] = None


class ReportResponse(BaseModel):
    id: int
    user_id: int
    project_id: int
    week_start: date
    week_end: date
    tasks_completed: List[str]
    tasks_planned: Optional[str] = None
    blockers: Optional[str] = None
    hours_worked: float
    status: str
    created_at: datetime
    updated_at: datetime
    user_name: str = ""
    project_name: str = ""

    model_config = ConfigDict(from_attributes=True)

    @field_validator("tasks_completed", mode="before")
    @classmethod
    def parse_tasks_completed(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            # Treat as a single item if plain string
            return [v] if v else []
        if isinstance(v, list):
            return v
        return []

    @model_validator(mode="before")
    @classmethod
    def extract_related_names(cls, values: Any) -> Any:
        if hasattr(values, "user") and hasattr(values, "project"):
            user_name = values.user.name if values.user is not None else ""
            project_name = values.project.name if values.project is not None else ""
            obj = {
                "id": values.id,
                "user_id": values.user_id,
                "project_id": values.project_id,
                "week_start": values.week_start,
                "week_end": values.week_end,
                "tasks_completed": values.tasks_completed,
                "tasks_planned": values.tasks_planned,
                "blockers": values.blockers,
                "hours_worked": values.hours_worked,
                "status": values.status,
                "created_at": values.created_at,
                "updated_at": values.updated_at,
                "user_name": user_name,
                "project_name": project_name,
            }
            return obj
        return values


class ReportStatusUpdate(BaseModel):
    status: str


class AnalyticsResponse(BaseModel):
    tasks_trend: List[Dict[str, Any]]
    submission_status: Dict[str, Any]
    project_workload: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
