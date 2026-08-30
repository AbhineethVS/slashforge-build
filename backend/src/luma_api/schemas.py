from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel


class SessionResponse(BaseModel):
    id: UUID
    created_at: datetime
    expires_at: datetime
    sources: list[dict[str, Any]]
    messages: list[dict[str, Any]]
    artifacts: list[dict[str, Any]]
    attempts: list[dict[str, Any]]


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

