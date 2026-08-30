from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

from pydantic import BaseModel, Field


@dataclass(frozen=True, slots=True)
class ExtractedPage:
    number: int
    text: str
    character_count: int


@dataclass(frozen=True, slots=True)
class ExtractedDocument:
    path: Path
    page_count: int
    pages: tuple[ExtractedPage, ...]


@dataclass(frozen=True, slots=True)
class Chunk:
    id: UUID
    source_id: UUID
    page_start: int
    page_end: int
    position: int
    content: str
    content_hash: str
    token_count: int


@dataclass(frozen=True, slots=True)
class RetrievalHit:
    chunk: Chunk
    score: float


class AnswerCitation(BaseModel):
    chunk_id: UUID
    claim: str = Field(min_length=1, max_length=500)


class GroundedAnswer(BaseModel):
    answer_markdown: str
    citations: list[AnswerCitation]
    insufficient_evidence: bool
    follow_up_questions: list[str] = Field(max_length=3)


class CitationView(BaseModel):
    id: str
    chunk_id: UUID
    source_id: UUID
    source_name: str
    page_start: int
    page_end: int
    excerpt: str
    claim: str
    viewer_url: str

