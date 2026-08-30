from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

import numpy as np
from numpy.typing import NDArray
from openai import OpenAI

from .models import Chunk, RetrievalHit

EMBEDDING_MODEL = "text-embedding-3-small"


class Embedder(Protocol):
    model: str

    def embed(self, texts: Sequence[str]) -> NDArray[np.float32]: ...


@dataclass(slots=True)
class OpenAIEmbedder:
    client: OpenAI
    model: str = EMBEDDING_MODEL

    def embed(self, texts: Sequence[str]) -> NDArray[np.float32]:
        response = self.client.embeddings.create(model=self.model, input=list(texts))
        ordered = sorted(response.data, key=lambda item: item.index)
        return np.asarray([item.embedding for item in ordered], dtype=np.float32)


@dataclass(frozen=True, slots=True)
class VectorIndex:
    chunks: tuple[Chunk, ...]
    matrix: NDArray[np.float32]
    embedding_model: str

    def __post_init__(self) -> None:
        if self.matrix.ndim != 2 or self.matrix.shape[0] != len(self.chunks):
            raise ValueError("Embedding rows must align exactly with chunks.")


def build_index(chunks: Sequence[Chunk], embedder: Embedder) -> VectorIndex:
    if not chunks:
        raise ValueError("Cannot build an index without chunks.")
    matrix = _normalize_rows(embedder.embed([chunk.content for chunk in chunks]))
    return VectorIndex(tuple(chunks), matrix, embedder.model)


def retrieve(
    question: str,
    *,
    index: VectorIndex,
    embedder: Embedder,
    selected_source_ids: set[UUID],
    limit: int = 5,
) -> tuple[RetrievalHit, ...]:
    normalized_question = " ".join(question.split())
    if not normalized_question:
        raise ValueError("Question cannot be empty.")
    if embedder.model != index.embedding_model:
        raise ValueError("Query and index embedding models must match.")

    eligible = np.asarray(
        [chunk.source_id in selected_source_ids for chunk in index.chunks],
        dtype=np.bool_,
    )
    if not eligible.any():
        return ()

    query = _normalize_rows(embedder.embed([normalized_question]))[0]
    scores = index.matrix @ query
    candidate_indices = np.flatnonzero(eligible)
    ranked = candidate_indices[np.argsort(scores[candidate_indices])[::-1]][:limit]
    return tuple(
        RetrievalHit(chunk=index.chunks[index_value], score=float(scores[index_value]))
        for index_value in ranked
    )


def _normalize_rows(matrix: NDArray[np.float32]) -> NDArray[np.float32]:
    values = np.asarray(matrix, dtype=np.float32)
    if values.ndim != 2:
        raise ValueError("Embeddings must be a two-dimensional matrix.")
    norms = np.linalg.norm(values, axis=1, keepdims=True)
    if np.any(norms == 0):
        raise ValueError("Embeddings cannot contain zero-length vectors.")
    return values / norms

