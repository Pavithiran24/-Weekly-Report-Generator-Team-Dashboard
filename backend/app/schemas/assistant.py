from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AssistantMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[AssistantMessage] = Field(default_factory=list)


class AssistantChatResponse(BaseModel):
    answer: str
    summary: str
    suggested_questions: list[str]
    provider: str
    generated_at: datetime