from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.dashboard import DashboardCharts, DashboardSummary
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
) -> DashboardSummary:
    return dashboard_service.get_dashboard_summary(db)


@router.get("/charts", response_model=DashboardCharts)
def get_charts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
) -> DashboardCharts:
    return dashboard_service.get_dashboard_charts(db)
