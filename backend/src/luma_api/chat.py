from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass
from uuid import UUID

import numpy as np

from luma_spikes.citations import (
    InvalidCitationError,
    map_citations,
    validate_citation_allow_list,
)
from luma_spikes.models import Chunk, CitationView, GroundedAnswer
from luma_spikes.retrieval import Embedder, VectorIndex, retrieve

RETRIEVAL_LIMIT = 5


@dataclass(frozen=True, slots=True)
class SelectedIndex:
    source_id: UUID
    source_name: str
    index: VectorIndex


@dataclass(frozen=True, slots=True)
class GroundedResult:
    answer: GroundedAnswer
    citations: tuple[CitationView, ...]
    retrieved_chunk_ids: tuple[UUID, ...]


def combine_indexes(sources: Sequence[SelectedIndex]) -> VectorIndex:
    if not sources:
        raise ValueError("At least one source index is required.")
    embedding_model = sources[0].index.embedding_model
    if any(source.index.embedding_model != embedding_model for source in sources):
        raise ValueError("Selected sources use incompatible embedding models.")
    chunks = tuple(
        chunk for source in sources for chunk in source.index.chunks
    )
    if not chunks:
        raise ValueError("Selected sources do not contain searchable chunks.")
    matrix = np.concatenate(
        [source.index.matrix for source in sources],
        axis=0,
    ).astype(np.float32, copy=False)
    return VectorIndex(chunks, matrix, embedding_model)


def answer_from_sources(
    *,
    question: str,
    sources: Sequence[SelectedIndex],
    embedder: Embedder,
    generate: Callable[[str, Sequence[Chunk]], GroundedAnswer],
) -> GroundedResult:
    index = combine_indexes(sources)
    selected_ids = {source.source_id for source in sources}
    hits = retrieve(
        question,
        index=index,
        embedder=embedder,
        selected_source_ids=selected_ids,
        limit=RETRIEVAL_LIMIT,
    )
    chunks = tuple(hit.chunk for hit in hits)
    if not chunks:
        raise ValueError("No searchable evidence was found.")

    answer: GroundedAnswer | None = None
    last_error: InvalidCitationError | None = None
    for _ in range(2):
        try:
            candidate = generate(question, chunks)
            if candidate.insufficient_evidence:
                candidate.answer_markdown = (
                    "The selected sources do not contain enough evidence "
                    "to answer that question."
                )
                candidate.citations = []
            validate_citation_allow_list(
                candidate,
                {chunk.id for chunk in chunks},
            )
        except InvalidCitationError as error:
            last_error = error
            continue
        answer = candidate
        break
    if answer is None:
        raise last_error or InvalidCitationError(
            "The answer could not be validated."
        )

    names = {source.source_id: source.source_name for source in sources}
    citations = tuple(map_citations(answer, chunks=chunks, source_names=names))
    return GroundedResult(
        answer=answer,
        citations=citations,
        retrieved_chunk_ids=tuple(chunk.id for chunk in chunks),
    )
