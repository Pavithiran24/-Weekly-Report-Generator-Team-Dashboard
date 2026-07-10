from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_reports: int
    submitted_reports: int
    pending_reports: int
    late_reports: int
    open_blockers: int
    active_projects: int


class DashboardCharts(BaseModel):
    tasks_trend: List[Dict[str, Any]]
    submission_status: Dict[str, Any]
    project_workload: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
