from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any, Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.project import Project
from app.models.report import Report
from app.schemas.dashboard import DashboardCharts, DashboardSummary


def get_dashboard_summary(db: Session) -> DashboardSummary:
    reports = db.query(Report).all()
    projects = db.query(Project).filter(Project.is_active == True).count()

    submitted_reports = sum(1 for report in reports if report.status == "submitted")
    pending_reports = sum(1 for report in reports if report.status == "draft")
    late_reports = 0
    open_blockers = 0

    today = datetime.utcnow().date()
    for report in reports:
        if report.week_end and report.week_end < today and report.status != "submitted":
            late_reports += 1
        if report.blockers:
            try:
                blockers = json.loads(report.blockers)
                if isinstance(blockers, list):
                    open_blockers += len([item for item in blockers if item])
                elif str(blockers).strip():
                    open_blockers += 1
            except (json.JSONDecodeError, TypeError):
                if str(report.blockers).strip():
                    open_blockers += 1

    return DashboardSummary(
        total_reports=len(reports),
        submitted_reports=submitted_reports,
        pending_reports=pending_reports,
        late_reports=late_reports,
        open_blockers=open_blockers,
        active_projects=projects,
    )


def get_dashboard_charts(db: Session) -> DashboardCharts:
    now = datetime.utcnow().date()
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
        for report in reports_in_week:
            try:
                tasks = json.loads(report.tasks_completed) if report.tasks_completed else []
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

    status_counts: Dict[str, int] = {}
    for report in db.query(Report).all():
        status_counts[report.status] = status_counts.get(report.status, 0) + 1

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

    recent_reports = (
        db.query(Report)
        .options(joinedload(Report.user), joinedload(Report.project))
        .order_by(Report.updated_at.desc())
        .limit(10)
        .all()
    )
    recent_activity = [
        {
            "report_id": report.id,
            "user_name": report.user.name if report.user else "",
            "project_name": report.project.name if report.project else "",
            "status": report.status,
            "week_start": report.week_start.isoformat(),
            "updated_at": report.updated_at.isoformat(),
        }
        for report in recent_reports
    ]

    return DashboardCharts(
        tasks_trend=tasks_trend,
        submission_status=status_counts,
        project_workload=project_workload,
        recent_activity=recent_activity,
    )
