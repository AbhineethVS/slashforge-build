from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID

import numpy as np
from pydantic import BaseModel, Field

from luma_spikes.chunking import chunk_document
from luma_spikes.config import load_project_environment
from luma_spikes.models import Chunk
from luma_spikes.pdf import extract_pdf
from luma_spikes.retrieval import OpenAIEmbedder, VectorIndex, build_index

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DEMO_DIR = PROJECT_ROOT / "demo_assets"
EXTRACTION_VERSION = "pymupdf-page-v1"
MANIFEST_VERSION = "1"
BUNDLED_DEMO_SOURCE_ID = UUID("8f4d0f62-5b8a-4f1e-9c2d-6a7b1c3d4e5f")
BUNDLED_DSA_SOURCE_ID = UUID("c3e8a914-7f2b-4d91-9e55-2b6f0a8d1c47")
LIBRARY_SOURCE_ORDER = ("economics", "dsa")


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
    fallback_artifacts: dict[str, dict[str, Any]]

    @property
    def source_id(self) -> UUID:
        return self.manifest.source_id

    @property
    def pdf_path(self) -> Path:
        return self.root / "source.pdf"

    @property
    def visual_deck_fallback_path(self) -> Path:
        return self.root / "economic-blueprint-fallback.pdf"

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

    def fallback_artifact(self, kind: str) -> dict[str, Any] | None:
        artifact = self.fallback_artifacts.get(kind)
        return json.loads(json.dumps(artifact)) if artifact is not None else None


@dataclass(frozen=True, slots=True)
class BundledDemoLibrary:
    root: Path
    sources: tuple[BundledDemoCatalog, ...]

    def get(self, source_id: UUID) -> BundledDemoCatalog | None:
        for source in self.sources:
            if source.source_id == source_id:
                return source
        return None

    def source_summaries(self) -> list[dict[str, Any]]:
        return [source.source_summary() for source in self.sources]

    def suggested_questions(self) -> list[str]:
        questions: list[str] = []
        for source in self.sources:
            questions.extend(source.suggested_questions())
        return questions


def demo_assets_dir(path: Path | None = None) -> Path:
    configured = path or Path(
        __import__("os").getenv("LUMA_DEMO_ASSETS_DIR", DEFAULT_DEMO_DIR)
    )
    return configured


def as_library(
    value: BundledDemoLibrary | BundledDemoCatalog | None,
) -> BundledDemoLibrary | None:
    if value is None:
        return None
    if isinstance(value, BundledDemoLibrary):
        return value
    return BundledDemoLibrary(root=value.root.parent, sources=(value,))


def load_catalog(root: Path | None = None) -> BundledDemoCatalog:
    assets_root = demo_assets_dir(root)
    manifest_path = assets_root / "manifest.json"
    chunks_path = assets_root / "chunks.json"
    embeddings_path = assets_root / "embeddings.npy"
    pdf_path = assets_root / "source.pdf"
    fallback_path = assets_root / "fallback_artifacts.json"
    visual_deck_path = assets_root / "economic-blueprint-fallback.pdf"

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
    fallback_artifacts: dict[str, dict[str, Any]] = {}
    if fallback_path.is_file():
        loaded = json.loads(fallback_path.read_text(encoding="utf-8"))
        if not isinstance(loaded, dict):
            raise ValueError("Demo fallback artifacts must be a JSON object.")
        allowed_chunk_ids = {str(chunk.id) for chunk in chunks}
        for kind, artifact in loaded.items():
            if kind not in {
                "summary",
                "flashcards",
                "quiz",
                "audio_overview",
            } or not isinstance(artifact, dict):
                raise ValueError("Demo fallback artifact has an unsupported shape.")
            _validate_fallback_citations(
                artifact,
                allowed_chunk_ids=allowed_chunk_ids,
                source_id=str(manifest.source_id),
            )
            fallback_artifacts[kind] = artifact

    if visual_deck_path.is_file() is False and manifest.source_id == BUNDLED_DEMO_SOURCE_ID:
        raise FileNotFoundError(f"Demo asset missing: {visual_deck_path}")

    return BundledDemoCatalog(
        assets_root,
        manifest,
        chunks,
        index,
        fallback_artifacts,
    )


def load_library(root: Path | None = None) -> BundledDemoLibrary:
    assets_root = demo_assets_dir(root)
    if not assets_root.is_dir():
        raise FileNotFoundError(f"Demo asset missing: {assets_root}")

    if (assets_root / "manifest.json").is_file():
        return BundledDemoLibrary(root=assets_root, sources=(load_catalog(assets_root),))

    source_dirs = _library_source_dirs(assets_root)
    if not source_dirs:
        raise FileNotFoundError(f"Demo asset missing: no source catalogs under {assets_root}")

    sources = tuple(load_catalog(path) for path in source_dirs)
    return BundledDemoLibrary(root=assets_root, sources=sources)


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

    resolved_name = display_name or pdf.name
    questions = suggested_questions or [
        "What are the key definitions in this source?",
        "Summarize the main concepts covered early in the material.",
        "Which ideas are most important to revise first?",
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


def _library_source_dirs(assets_root: Path) -> list[Path]:
    registry_path = assets_root / "library.json"
    if registry_path.is_file():
        payload = json.loads(registry_path.read_text(encoding="utf-8"))
        names = payload.get("sources")
        if not isinstance(names, list) or not names:
            raise ValueError("library.json must list at least one source directory.")
        return [assets_root / str(name) for name in names]

    discovered = [
        path
        for path in sorted(assets_root.iterdir())
        if path.is_dir() and (path / "manifest.json").is_file()
    ]
    ordered: list[Path] = []
    by_name = {path.name: path for path in discovered}
    for name in LIBRARY_SOURCE_ORDER:
        if name in by_name:
            ordered.append(by_name.pop(name))
    ordered.extend(by_name[name] for name in sorted(by_name))
    return ordered


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


def _validate_fallback_citations(
    value: object,
    *,
    allowed_chunk_ids: set[str],
    source_id: str,
) -> None:
    if isinstance(value, dict):
        if "chunk_id" in value:
            if value.get("chunk_id") not in allowed_chunk_ids:
                raise ValueError("Demo fallback cites an unknown chunk.")
            if value.get("source_id") != source_id:
                raise ValueError("Demo fallback cites a different source.")
        for child in value.values():
            _validate_fallback_citations(
                child,
                allowed_chunk_ids=allowed_chunk_ids,
                source_id=source_id,
            )
    elif isinstance(value, list):
        for child in value:
            _validate_fallback_citations(
                child,
                allowed_chunk_ids=allowed_chunk_ids,
                source_id=source_id,
            )


def _cli() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Build LUMA bundled demo assets.")
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--output", type=Path, default=DEFAULT_DEMO_DIR)
    parser.add_argument("--display-name", default=None)
    parser.add_argument("--source-id", default=None)
    args = parser.parse_args()

    catalog = build_demo_assets(
        args.pdf,
        output_dir=args.output,
        display_name=args.display_name or args.pdf.name,
        source_id=UUID(args.source_id) if args.source_id else BUNDLED_DEMO_SOURCE_ID,
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
