from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal
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


AnswerFormat = Literal["auto", "paragraph", "bullets", "steps", "table", "code"]
ResolvedAnswerFormat = Literal["paragraph", "bullets", "steps", "table", "code"]
AnswerSectionKind = Literal["paragraph", "bullets", "steps", "table", "code"]


class AnswerSection(BaseModel):
    kind: AnswerSectionKind
    title: str | None = Field(default=None, max_length=120)
    content_markdown: str | None = Field(default=None, max_length=2_000)
    code_language: str | None = Field(default=None, max_length=40)
    items: list[str] = Field(default_factory=list, max_length=8)
    columns: list[str] = Field(default_factory=list, max_length=4)
    rows: list[list[str]] = Field(default_factory=list, max_length=8)
    evidence_chunk_ids: list[UUID] = Field(default_factory=list, max_length=5)


class GroundedAnswer(BaseModel):
    answer_markdown: str
    citations: list[AnswerCitation]
    insufficient_evidence: bool
    follow_up_questions: list[str] = Field(max_length=3)
    answer_format: ResolvedAnswerFormat = "paragraph"
    sections: list[AnswerSection] = Field(default_factory=list, max_length=6)


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

