from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class SourceSummary(BaseModel):
    id: UUID
    display_name: str = Field(min_length=1, max_length=255)
    kind: Literal["bundled", "uploaded"]
    page_count: int = Field(ge=0)
    status: Literal["uploading", "extracting", "embedding", "ready", "failed"]
    error_code: str | None = None


class SessionResponse(BaseModel):
    id: UUID
    created_at: datetime
    expires_at: datetime
    sources: list[SourceSummary]
    messages: list[dict[str, Any]]
    artifacts: list[dict[str, Any]]
    attempts: list[dict[str, Any]]
    suggested_questions: list[str] = []


class ErrorBody(BaseModel):
    code: str
    message: str
    request_id: UUID
    retryable: bool
    action: str


class ErrorResponse(BaseModel):
    error: ErrorBody


class HealthResponse(BaseModel):
    status: Literal["ok"]
    openai_configured: bool

