from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Sequence

from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.models.report import Report
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse


STOPWORDS = {
    "a",
    "about",
    "after",
    "all",
    "and",
    "are",
    "be",
    "did",
    "do",
    "for",
    "from",
    "how",
    "i",
    "in",
    "is",
    "it",
    "last",
    "of",
    "on",
    "the",
    "this",
    "to",
    "was",
    "what",
    "week",
    "work",
    "worked",
    "working",
    "with",
    "you",
}

FOLLOW_UP_HINTS = (
    "Try asking about a project name, a teammate, blockers, workload, or weekly summary.",
)


@dataclass(frozen=True)
class AssistantIntent:
    kind: str
    keywords: tuple[str, ...] = ()


def _parse_tasks(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except (json.JSONDecodeError, TypeError, ValueError):
            return [value.strip()]
    return []


def _report_text(report: Report) -> str:
    tasks = _parse_tasks(report.tasks_completed)
    return " ".join(
        str(part or "")
        for part in [
            report.user.name if report.user else "",
            report.project.name if report.project else "",
            " ".join(tasks),
            report.tasks_planned or "",
            report.blockers or "",
        ]
    ).lower()


def _score_report(report: Report, terms: Sequence[str]) -> int:
    haystack = _report_text(report)
    return sum(1 for term in terms if term in haystack)


def _extract_terms(message: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9_+-]{1,}", message.lower())
    return [token for token in tokens if token not in STOPWORDS]


def _detect_intent(message: str) -> AssistantIntent:
    lowered = message.lower().strip()
    if any(keyword in lowered for keyword in ["summary", "overall", "team summary", "weekly summary"]):
        return AssistantIntent("summary")
    if any(keyword in lowered for keyword in ["blocker", "issue", "risk", "stuck"]):
        return AssistantIntent("blockers")
    if any(keyword in lowered for keyword in ["workload", "hours", "busy", "imbalance", "capacity"]):
        return AssistantIntent("workload")
    if any(keyword in lowered for keyword in ["what did", "worked on", "did the", "project", "team"]):
        return AssistantIntent("activity")
    if len(_extract_terms(lowered)) == 0:
        return AssistantIntent("clarify")
    return AssistantIntent("search", tuple(_extract_terms(lowered)[:6]))


def _load_reports(db: Session) -> list[Report]:
    return (
        db.query(Report)
        .options(joinedload(Report.user), joinedload(Report.project))
        .order_by(Report.updated_at.desc())
        .limit(100)
        .all()
    )


def _summarize_reports(reports: Sequence[Report]) -> dict[str, Any]:
    total = len(reports)
    submitted = sum(1 for report in reports if report.status == "submitted")
    drafts = sum(1 for report in reports if report.status == "draft")
    reviewers = Counter(report.user.name if report.user else "Unknown" for report in reports)
    projects = Counter(report.project.name if report.project else "Unknown" for report in reports)
    blocker_reports = [report for report in reports if (report.blockers or "").strip()]
    hours_by_person = Counter()
    for report in reports:
        name = report.user.name if report.user else "Unknown"
        hours_by_person[name] += float(report.hours_worked or 0)

    return {
        "total": total,
        "submitted": submitted,
        "drafts": drafts,
        "blockers": len(blocker_reports),
        "top_people": reviewers.most_common(3),
        "top_projects": projects.most_common(3),
        "top_hours": hours_by_person.most_common(3),
        "latest_reports": list(reports[:5]),
        "blocker_reports": blocker_reports[:5],
    }


def _compose_summary(summary: dict[str, Any]) -> str:
    if summary["total"] == 0:
        return "I do not have any report data yet. Once the team submits reports, I can answer questions and generate summaries."

    parts: list[str] = [
        f"I found {summary['total']} reports: {summary['submitted']} submitted, {summary['drafts']} drafts, and {summary['blockers']} reports with blockers."
    ]
    if summary["top_projects"]:
        project_bits = ", ".join(f"{name} ({count})" for name, count in summary["top_projects"])
        parts.append(f"Most active projects: {project_bits}.")
    if summary["top_people"]:
        people_bits = ", ".join(f"{name} ({count})" for name, count in summary["top_people"])
        parts.append(f"Most active contributors: {people_bits}.")
    if summary["blocker_reports"]:
        blocker_names = ", ".join(
            f"{report.user.name if report.user else 'Unknown'} / {report.project.name if report.project else 'Unknown'}"
            for report in summary["blocker_reports"][:3]
        )
        parts.append(f"Reports needing follow-up: {blocker_names}.")
    return " ".join(parts)


def _match_topic_answer(message: str, reports: Sequence[Report], summary: dict[str, Any]) -> str | None:
    lowered = message.lower()
    intent = _detect_intent(lowered)
    terms = intent.keywords or tuple(_extract_terms(lowered))
    scored = sorted(((report, _score_report(report, terms)) for report in reports), key=lambda item: item[1], reverse=True)
    relevant_reports = [report for report, score in scored if score > 0][:5]

    if intent.kind == "summary":
        return _compose_summary(summary)

    if intent.kind == "blockers":
        if not summary["blocker_reports"]:
            return "There are no blocker reports right now."
        lines = []
        for report in summary["blocker_reports"][:3]:
            user_name = report.user.name if report.user else "Unknown"
            project_name = report.project.name if report.project else "Unknown"
            blockers = (report.blockers or "").strip()
            lines.append(f"{user_name} on {project_name}: {blockers}")
        return "Here are the current blockers: " + " | ".join(lines)

    if intent.kind == "workload":
        top_hours = summary["top_hours"]
        if not top_hours:
            return "I do not have enough hours data yet to judge workload."
        return "Workload by hours logged: " + ", ".join(f"{name} ({hours:.1f}h)" for name, hours in top_hours)

    if intent.kind == "activity":
        if not relevant_reports:
            return "I could not find matching reports for that topic. Try mentioning a project name, team member, or blocker keyword."
        lines = []
        for report in relevant_reports:
            user_name = report.user.name if report.user else "Unknown"
            project_name = report.project.name if report.project else "Unknown"
            tasks = ", ".join(_parse_tasks(report.tasks_completed)[:3]) or (report.tasks_planned or "No task details")
            lines.append(f"{user_name} on {project_name} worked on {tasks}")
        return "Here is what I found: " + " | ".join(lines)

    if relevant_reports:
        selected_report = relevant_reports[0]
        user_name = selected_report.user.name if selected_report.user else "Unknown"
        project_name = selected_report.project.name if selected_report.project else "Unknown"
        tasks = ", ".join(_parse_tasks(selected_report.tasks_completed)[:3]) or (selected_report.tasks_planned or "No task details")
        blocker_text = (selected_report.blockers or "").strip()
        answer_parts = [
            f"I found a related report from {user_name} on {project_name}.",
            f"Main work: {tasks}.",
        ]
        if blocker_text:
            answer_parts.append(f"Blockers: {blocker_text}.")
        if intent.kind == "clarify":
            answer_parts.append(FOLLOW_UP_HINTS[0])
        else:
            answer_parts.append(f"That seems relevant to '{message.strip()}'.")
        return " ".join(answer_parts)

    if intent.kind == "clarify":
        return "I can help with weekly summaries, blockers, workload, or project-specific activity. " + FOLLOW_UP_HINTS[0]

    if intent.kind == "search":
        lines = []
        for report in relevant_reports[:3]:
            user_name = report.user.name if report.user else "Unknown"
            project_name = report.project.name if report.project else "Unknown"
            lines.append(f"{user_name} / {project_name} ({report.status})")
        if lines:
            return f"I found reports related to '{message.strip()}': " + "; ".join(lines)
        return (
            f"I could not find a direct match for '{message.strip()}'. "
            + FOLLOW_UP_HINTS[0]
        )

    return None


def _call_openai(messages: list[dict[str, str]]) -> str:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OpenAI key is not configured")

    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(
            {
                "model": settings.OPENAI_MODEL,
                "messages": messages,
                "temperature": 0.2,
            }
        ).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise RuntimeError(str(exc)) from exc

    choices = payload.get("choices") or []
    if not choices:
        raise RuntimeError("No response from OpenAI")
    message = choices[0].get("message") or {}
    content = (message.get("content") or "").strip()
    if not content:
        raise RuntimeError("Empty response from OpenAI")
    return content


def generate_assistant_reply(db: Session, request: AssistantChatRequest) -> AssistantChatResponse:
    reports = _load_reports(db)
    summary = _summarize_reports(reports)
    assistant_summary = _compose_summary(summary)
    suggested_questions = [
        "What did the team work on last week?",
        "Show me the blockers that need follow-up.",
        "Is there any workload imbalance right now?",
    ]

    if settings.AI_ASSISTANT_PROVIDER.lower() in {"auto", "openai"} and settings.OPENAI_API_KEY:
        system_prompt = (
            "You are a concise assistant for managers in a weekly report dashboard. "
            "Answer only from the supplied report data, do not invent facts, and mention when data is missing. "
            "Be helpful, short, and action-oriented."
        )
        messages = [{"role": "system", "content": system_prompt}]
        for item in request.history[-8:]:
            messages.append({"role": item.role, "content": item.content})
        messages.append(
            {
                "role": "user",
                "content": (
                    f"Dashboard summary: {assistant_summary}\n\n"
                    f"Answer this question using the report data: {request.message}"
                ),
            }
        )
        try:
            answer = _call_openai(messages)
            provider = f"openai:{settings.OPENAI_MODEL}"
        except RuntimeError:
            answer = _match_topic_answer(request.message, reports, summary) or assistant_summary
            provider = "local-fallback"
    else:
        answer = _match_topic_answer(request.message, reports, summary) or assistant_summary
        provider = "local"

    if answer == assistant_summary:
        answer = f"{assistant_summary} {FOLLOW_UP_HINTS[0]}"

    return AssistantChatResponse(
        answer=answer,
        summary=assistant_summary,
        suggested_questions=suggested_questions,
        provider=provider,
        generated_at=datetime.utcnow(),
    )