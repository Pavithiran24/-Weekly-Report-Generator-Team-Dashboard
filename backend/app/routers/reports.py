from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.report import AnalyticsResponse, ReportCreate, ReportResponse, ReportUpdate
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
) -> AnalyticsResponse:
    return report_service.get_analytics(db)


@router.get("/", response_model=List[ReportResponse])
def list_reports(
    week_start: Optional[date] = None,
    project_id: Optional[int] = None,
    user_id: Optional[int] = None,
    report_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ReportResponse]:
    filters = {
        "week_start": week_start,
        "project_id": project_id,
        "user_id": user_id,
        "status": report_status,
    }
    role = current_user.role.name if current_user.role else "member"
    reports = report_service.get_reports(db, current_user.id, role, filters)
    return [ReportResponse.model_validate(r) for r in reports]


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    role = current_user.role.name if current_user.role else "member"
    report = report_service.get_report_by_id(db, report_id, current_user.id, role)
    return ReportResponse.model_validate(report)


@router.post(
    "/",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_report(
    data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    report = report_service.create_report(db, data, current_user.id)
    return ReportResponse.model_validate(report)


@router.put("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: int,
    data: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    report = report_service.update_report(db, report_id, data, current_user.id)
    return ReportResponse.model_validate(report)


@router.patch("/{report_id}/submit", response_model=ReportResponse)
def submit_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    report = report_service.submit_report(db, report_id, current_user.id)
    return ReportResponse.model_validate(report)
