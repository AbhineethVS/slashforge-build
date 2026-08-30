from __future__ import annotations

import hashlib
from collections.abc import Iterable
from uuid import UUID, uuid5

import tiktoken

from .models import Chunk, ExtractedDocument

TARGET_TOKENS = 550
MAX_TOKENS = 650
OVERLAP_TOKENS = 75
_ENCODING = tiktoken.get_encoding("cl100k_base")


def _token_count(text: str) -> int:
    return len(_ENCODING.encode(text))


def _split_long_text(text: str) -> Iterable[str]:
    tokens = _ENCODING.encode(text)
    if len(tokens) <= MAX_TOKENS:
        yield text
        return

    step = TARGET_TOKENS - OVERLAP_TOKENS
    for start in range(0, len(tokens), step):
        piece = _ENCODING.decode(tokens[start : start + TARGET_TOKENS]).strip()
        if piece:
            yield piece
        if start + TARGET_TOKENS >= len(tokens):
            break


def _page_chunks(text: str) -> list[str]:
    paragraphs = [paragraph.strip() for paragraph in text.splitlines() if paragraph.strip()]
    pieces = [
        piece
        for paragraph in paragraphs
        for piece in _split_long_text(paragraph)
    ]
    if not pieces:
        return []

    chunks: list[str] = []
    current: list[str] = []
    for piece in pieces:
        candidate = "\n".join([*current, piece])
        if current and _token_count(candidate) > MAX_TOKENS:
            rendered = "\n".join(current)
            chunks.append(rendered)
            overlap = _ENCODING.decode(
                _ENCODING.encode(rendered)[-OVERLAP_TOKENS:]
            ).strip()
            current = [overlap, piece] if overlap else [piece]
            if _token_count("\n".join(current)) > MAX_TOKENS:
                current = [piece]
        else:
            current.append(piece)

    if current:
        chunks.append("\n".join(current))
    return chunks


def chunk_document(document: ExtractedDocument, source_id: UUID) -> tuple[Chunk, ...]:
    chunks: list[Chunk] = []
    position = 0
    for page in document.pages:
        for content in _page_chunks(page.text):
            digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
            chunks.append(
                Chunk(
                    id=uuid5(source_id, f"{page.number}:{position}:{digest}"),
                    source_id=source_id,
                    page_start=page.number,
                    page_end=page.number,
                    position=position,
                    content=content,
                    content_hash=digest,
                    token_count=_token_count(content),
                )
            )
            position += 1
    return tuple(chunks)

