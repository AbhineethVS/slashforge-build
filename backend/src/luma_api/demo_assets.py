from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID

import numpy as np
from numpy.typing import NDArray
from pydantic import BaseModel, Field

from luma_spikes.chunking import chunk_document
from luma_spikes.config import load_project_environment
from luma_spikes.models import Chunk
from luma_spikes.pdf import extract_pdf
from luma_spikes.retrieval import EMBEDDING_MODEL, OpenAIEmbedder, VectorIndex, build_index

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DEMO_DIR = PROJECT_ROOT / "demo_assets"
EXTRACTION_VERSION = "pymupdf-page-v1"
MANIFEST_VERSION = "1"
BUNDLED_DEMO_SOURCE_ID = UUID("8f4d0f62-5b8a-4f1e-9c2d-6a7b1c3d4e5f")


class DemoManifest(BaseModel):
    version: str
    source_id: UUID
    display_name: str
    page_count: int
    chunk_count: int
    embedding_model: str
    extraction_version: str
    embedding_version: str
    built_at: datetime
    suggested_questions: list[str] = Field(min_length=1)


@dataclass(frozen=True, slots=True)
class BundledDemoCatalog:
    root: Path
    manifest: DemoManifest
    chunks: tuple[Chunk, ...]
    index: VectorIndex

    @property
    def source_id(self) -> UUID:
        return self.manifest.source_id

    @property
    def pdf_path(self) -> Path:
        return self.root / "source.pdf"

    def source_summary(self) -> dict[str, Any]:
        return {
            "id": str(self.manifest.source_id),
            "display_name": self.manifest.display_name,
            "kind": "bundled",
            "page_count": self.manifest.page_count,
            "status": "ready",
            "error_code": None,
        }

    def suggested_questions(self) -> list[str]:
        return list(self.manifest.suggested_questions)


def demo_assets_dir(path: Path | None = None) -> Path:
    configured = path or Path(
        __import__("os").getenv("LUMA_DEMO_ASSETS_DIR", DEFAULT_DEMO_DIR)
    )
    return configured


def load_catalog(root: Path | None = None) -> BundledDemoCatalog:
    assets_root = demo_assets_dir(root)
    manifest_path = assets_root / "manifest.json"
    chunks_path = assets_root / "chunks.json"
    embeddings_path = assets_root / "embeddings.npy"
    pdf_path = assets_root / "source.pdf"

    for required in (manifest_path, chunks_path, embeddings_path, pdf_path):
        if not required.is_file():
            raise FileNotFoundError(f"Demo asset missing: {required}")

    manifest = DemoManifest.model_validate_json(manifest_path.read_text(encoding="utf-8"))
    chunk_records = json.loads(chunks_path.read_text(encoding="utf-8"))
    matrix = np.load(embeddings_path)
    chunks = tuple(_chunk_from_record(record, manifest.source_id) for record in chunk_records)

    if matrix.shape[0] != len(chunks):
        raise ValueError("Demo embeddings do not align with chunk records.")

    index = VectorIndex(chunks, np.asarray(matrix, dtype=np.float32), manifest.embedding_model)
    return BundledDemoCatalog(assets_root, manifest, chunks, index)


def build_demo_assets(
    pdf: Path,
    *,
    output_dir: Path | None = None,
    display_name: str | None = None,
    source_id: UUID = BUNDLED_DEMO_SOURCE_ID,
    suggested_questions: list[str] | None = None,
) -> BundledDemoCatalog:
    load_project_environment()
    from openai import OpenAI

    assets_root = demo_assets_dir(output_dir)
    assets_root.mkdir(parents=True, exist_ok=True)

    existing_manifest = assets_root / "manifest.json"
    if existing_manifest.is_file():
        source_id = DemoManifest.model_validate_json(
            existing_manifest.read_text(encoding="utf-8")
        ).source_id

    document = extract_pdf(pdf)
    chunks = chunk_document(document, source_id)
    embedder = OpenAIEmbedder(OpenAI(timeout=60.0, max_retries=2))
    index = build_index(chunks, embedder)

    resolved_name = display_name or "Economics - Theory of Cost.pdf"
    questions = suggested_questions or [
        "What is the difference between explicit and implicit cost?",
        "Explain the relation between total cost, total fixed cost, and total variable cost.",
        "What is the kinked demand curve model of oligopoly?",
    ]

    manifest = DemoManifest(
        version=MANIFEST_VERSION,
        source_id=source_id,
        display_name=resolved_name,
        page_count=document.page_count,
        chunk_count=len(chunks),
        embedding_model=embedder.model,
        extraction_version=EXTRACTION_VERSION,
        embedding_version=f"openai-{embedder.model}-v1",
        built_at=datetime.now(timezone.utc),
        suggested_questions=questions,
    )

    shutil.copy2(pdf, assets_root / "source.pdf")
    (assets_root / "manifest.json").write_text(
        manifest.model_dump_json(indent=2),
        encoding="utf-8",
    )
    (assets_root / "chunks.json").write_text(
        json.dumps([_chunk_to_record(chunk) for chunk in chunks], indent=2),
        encoding="utf-8",
    )
    np.save(assets_root / "embeddings.npy", index.matrix)
    return load_catalog(assets_root)


def _chunk_to_record(chunk: Chunk) -> dict[str, Any]:
    return {
        "id": str(chunk.id),
        "source_id": str(chunk.source_id),
        "page_start": chunk.page_start,
        "page_end": chunk.page_end,
        "position": chunk.position,
        "content": chunk.content,
        "content_hash": chunk.content_hash,
        "token_count": chunk.token_count,
    }


def _chunk_from_record(record: dict[str, Any], source_id: UUID) -> Chunk:
    return Chunk(
        id=UUID(record["id"]),
        source_id=source_id,
        page_start=record["page_start"],
        page_end=record["page_end"],
        position=record["position"],
        content=record["content"],
        content_hash=record["content_hash"],
        token_count=record["token_count"],
    )


def _cli() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Build LUMA bundled demo assets.")
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--output", type=Path, default=DEFAULT_DEMO_DIR)
    parser.add_argument("--display-name", default="Economics - Theory of Cost.pdf")
    args = parser.parse_args()

    catalog = build_demo_assets(
        args.pdf,
        output_dir=args.output,
        display_name=args.display_name,
    )
    print(
        json.dumps(
            {
                "output_dir": str(catalog.root),
                "source_id": str(catalog.source_id),
                "page_count": catalog.manifest.page_count,
                "chunk_count": catalog.manifest.chunk_count,
                "embedding_model": catalog.manifest.embedding_model,
            },
            indent=2,
        )
    )


def main() -> None:
    _cli()


if __name__ == "__main__":
    main()
