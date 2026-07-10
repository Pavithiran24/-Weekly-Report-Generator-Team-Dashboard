from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.report import Report
from app.schemas.report import AnalyticsResponse, ReportCreate, ReportUpdate


def _load_report(db: Session, report_id: int) -> Optional[Report]:
    return (
        db.query(Report)
        .options(joinedload(Report.user), joinedload(Report.project))
        .filter(Report.id == report_id)
        .first()
    )


def get_reports(
    db: Session,
    user_id: int,
    role: str,
    filters: Dict[str, Any],
) -> List[Report]:
    query = db.query(Report).options(
        joinedload(Report.user), joinedload(Report.project)
    )

    # Role-based visibility
    if role != "manager":
        query = query.filter(Report.user_id == user_id)
    else:
        # Manager can filter by a specific user
        if filters.get("user_id"):
            query = query.filter(Report.user_id == filters["user_id"])

    if filters.get("week_start"):
        query = query.filter(Report.week_start >= filters["week_start"])

    if filters.get("project_id"):
        query = query.filter(Report.project_id == filters["project_id"])

    if filters.get("status"):
        query = query.filter(Report.status == filters["status"])

    return query.order_by(Report.created_at.desc()).all()


def get_report_by_id(
    db: Session, report_id: int, user_id: int, role: str
) -> Report:
    report = _load_report(db, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )
    if role != "manager" and report.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this report",
        )
    return report


def create_report(db: Session, data: ReportCreate, user_id: int) -> Report:
    tasks_json = json.dumps(data.tasks_completed)
    report = Report(
        user_id=user_id,
        project_id=data.project_id,
        week_start=data.week_start,
        week_end=data.week_end,
        tasks_completed=tasks_json,
        tasks_planned=data.tasks_planned,
        blockers=data.blockers,
        hours_worked=data.hours_worked,
        status="draft",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return _load_report(db, report.id)


def update_report(
    db: Session, report_id: int, data: ReportUpdate, user_id: int
) -> Report:
    report = _load_report(db, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )
    if report.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this report",
        )
    if report.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft reports can be edited",
        )

    update_data = data.model_dump(exclude_unset=True)
    if "tasks_completed" in update_data:
        update_data["tasks_completed"] = json.dumps(update_data["tasks_completed"])

    for field, value in update_data.items():
        setattr(report, field, value)

    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    return _load_report(db, report.id)


def submit_report(db: Session, report_id: int, user_id: int) -> Report:
    report = _load_report(db, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )
    if report.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit this report",
        )
    if report.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft reports can be submitted",
        )
    report.status = "submitted"
    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    return _load_report(db, report.id)


def get_analytics(db: Session) -> AnalyticsResponse:
    now = datetime.utcnow().date()

    # ── tasks_trend: last 8 weeks ──────────────────────────────────────────
    tasks_trend: List[Dict[str, Any]] = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i + 1)
        week_end = now - timedelta(weeks=i)
        reports_in_week = (
            db.query(Report)
            .filter(Report.week_start >= week_start, Report.week_start < week_end)
            .all()
        )
        total_tasks = 0
        for r in reports_in_week:
            try:
                tasks = json.loads(r.tasks_completed) if r.tasks_completed else []
                total_tasks += len(tasks)
            except (json.JSONDecodeError, TypeError):
                pass
        tasks_trend.append(
            {
                "week": week_start.isoformat(),
                "total_tasks": total_tasks,
                "report_count": len(reports_in_week),
            }
        )

    # ── submission_status ─────────────────────────────────────────────────
    all_reports = db.query(Report).all()
    status_counts: Dict[str, int] = {}
    for r in all_reports:
        status_counts[r.status] = status_counts.get(r.status, 0) + 1

    # ── project_workload: hours per project ────────────────────────────────
    from sqlalchemy import func

    from app.models.project import Project

    workload_rows = (
        db.query(
            Project.id,
            Project.name,
            func.sum(Report.hours_worked).label("total_hours"),
            func.count(Report.id).label("report_count"),
        )
        .join(Report, Report.project_id == Project.id)
        .group_by(Project.id, Project.name)
        .all()
    )
    project_workload = [
        {
            "project_id": row.id,
            "project_name": row.name,
            "total_hours": float(row.total_hours or 0),
            "report_count": row.report_count,
        }
        for row in workload_rows
    ]

    # ── recent_activity: last 10 report events ────────────────────────────
    recent_reports = (
        db.query(Report)
        .options(joinedload(Report.user), joinedload(Report.project))
        .order_by(Report.updated_at.desc())
        .limit(10)
        .all()
    )
    recent_activity = [
        {
            "report_id": r.id,
            "user_name": r.user.name if r.user else "",
            "project_name": r.project.name if r.project else "",
            "status": r.status,
            "week_start": r.week_start.isoformat(),
            "updated_at": r.updated_at.isoformat(),
        }
        for r in recent_reports
    ]

    return AnalyticsResponse(
        tasks_trend=tasks_trend,
        submission_status=status_counts,
        project_workload=project_workload,
        recent_activity=recent_activity,
    )
