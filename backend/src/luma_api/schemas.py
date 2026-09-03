from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from .memory import LearningMemoryResponse
from luma_spikes.models import AnswerFormat, AnswerSection, ResolvedAnswerFormat


class SourceSummary(BaseModel):
    id: UUID
    display_name: str = Field(min_length=1, max_length=255)
    kind: Literal["bundled", "uploaded"]
    page_count: int = Field(ge=0)
    status: Literal["uploading", "extracting", "embedding", "ready", "failed"]
    error_code: str | None = None


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2_000)
    source_ids: list[UUID] = Field(min_length=1, max_length=3)
    answer_format: AnswerFormat = "auto"

    @field_validator("question")
    @classmethod
    def normalize_question(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("Question cannot be empty.")
        return normalized

    @field_validator("source_ids")
    @classmethod
    def require_unique_sources(cls, value: list[UUID]) -> list[UUID]:
        if len(set(value)) != len(value):
            raise ValueError("Source IDs must be unique.")
        return value


class CitationResponse(BaseModel):
    id: str
    chunk_id: UUID
    source_id: UUID
    source_name: str
    page_start: int = Field(ge=1)
    page_end: int = Field(ge=1)
    excerpt: str
    claim: str
    viewer_url: str


class ChatMessageResponse(BaseModel):
    id: UUID
    role: Literal["assistant"]
    content_markdown: str
    answer_format: ResolvedAnswerFormat = "paragraph"
    sections: list[AnswerSection] = Field(default_factory=list)
    citations: list[CitationResponse]
    insufficient_evidence: bool
    follow_up_questions: list[str] = Field(max_length=3)
    status: Literal["complete"]
    created_at: datetime


class ArtifactRequest(BaseModel):
    source_ids: list[UUID] = Field(min_length=1, max_length=3)

    @field_validator("source_ids")
    @classmethod
    def require_unique_artifact_sources(cls, value: list[UUID]) -> list[UUID]:
        if len(set(value)) != len(value):
            raise ValueError("Source IDs must be unique.")
        return value


class VisualDeckRequest(ArtifactRequest):
    prompt: str = Field(min_length=20, max_length=2_000)

    @field_validator("prompt")
    @classmethod
    def normalize_visual_deck_prompt(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 20:
            raise ValueError("Describe the visual deck in at least 20 characters.")
        return normalized


class ArtifactResponse(BaseModel):
    id: UUID
    type: Literal[
        "summary",
        "flashcards",
        "quiz",
        "teach_back",
        "audio_overview",
        "visual_deck",
    ]
    title: str
    content: dict[str, Any]
    source_ids: list[UUID]
    created_at: datetime


class SessionResponse(BaseModel):
    id: UUID
    created_at: datetime
    expires_at: datetime
    sources: list[SourceSummary]
    messages: list[dict[str, Any]]
    artifacts: list[dict[str, Any]]
    attempts: list[dict[str, Any]]
    suggested_questions: list[str] = []
    learning_memory: LearningMemoryResponse | None = None


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
    speech_configured: bool


class TranscriptionResponse(BaseModel):
    transcript: str
    language_code: str | None = None


class AudioClipResponse(BaseModel):
    id: UUID
    url: str
    mime_type: str
    sequence: int
    section_index: int | None = None


class NarrationResponse(BaseModel):
    resource_id: UUID
    clips: list[AudioClipResponse]

