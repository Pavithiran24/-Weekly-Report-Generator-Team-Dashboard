from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role
from app.models.user import User
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_service import generate_assistant_reply

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.post("/chat", response_model=AssistantChatResponse)
def chat_with_assistant(
    payload: AssistantChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager")),
) -> AssistantChatResponse:
    return generate_assistant_reply(db, payload)