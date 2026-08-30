from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

from luma_spikes.chunking import chunk_document
from luma_spikes.models import ExtractedDocument
from luma_spikes.retrieval import Embedder, VectorIndex, build_index

MAX_UPLOADED_SOURCES = 2
MAX_UPLOADED_PAGES = 100
MAX_CHUNKS_PER_SOURCE = 250
MAX_EMBEDDING_BYTES_PER_SESSION = 5 * 1024 * 1024


@dataclass(frozen=True, slots=True)
class UploadedSource:
    id: UUID
    display_name: str
    file_path: Path
    mime_type: str
    size_bytes: int
    page_count: int
    index: VectorIndex

    def summary(self) -> dict[str, object]:
        return {
            "id": str(self.id),
            "display_name": self.display_name,
            "kind": "uploaded",
            "page_count": self.page_count,
            "status": "ready",
            "error_code": None,
        }


def build_uploaded_source(
    *,
    source_id: UUID,
    display_name: str,
    file_path: Path,
    mime_type: str,
    size_bytes: int,
    document: ExtractedDocument,
    embedder: Embedder,
) -> UploadedSource:
    chunks = chunk_document(document, source_id)
    if len(chunks) > MAX_CHUNKS_PER_SOURCE:
        raise SourceLimitError(
            "This PDF creates too many searchable sections.",
            "Upload a shorter or less densely formatted PDF.",
        )
    index = build_index(chunks, embedder)
    return UploadedSource(
        id=source_id,
        display_name=display_name,
        file_path=file_path,
        mime_type=mime_type,
        size_bytes=size_bytes,
        page_count=document.page_count,
        index=index,
    )


class SourceLimitError(ValueError):
    def __init__(self, message: str, action: str) -> None:
        super().__init__(message)
        self.action = action
