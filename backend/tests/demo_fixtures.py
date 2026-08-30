from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import numpy as np
import pymupdf

from luma_api.demo_assets import (
    BUNDLED_DEMO_SOURCE_ID,
    BundledDemoCatalog,
    DemoManifest,
    load_catalog,
)
from luma_spikes.models import Chunk
from luma_spikes.retrieval import VectorIndex


def write_test_demo_assets(root: Path) -> BundledDemoCatalog:
    root.mkdir(parents=True, exist_ok=True)
    pdf_path = root / "source.pdf"
    _write_pdf(pdf_path, ["Explicit cost is a direct payment.", "Implicit cost uses owned inputs."])

    source_id = BUNDLED_DEMO_SOURCE_ID
    chunks = (
        Chunk(
            id=uuid4(),
            source_id=source_id,
            page_start=1,
            page_end=1,
            position=0,
            content="Explicit cost is a direct payment.",
            content_hash="hash-one",
            token_count=8,
        ),
        Chunk(
            id=uuid4(),
            source_id=source_id,
            page_start=2,
            page_end=2,
            position=1,
            content="Implicit cost uses owned inputs.",
            content_hash="hash-two",
            token_count=7,
        ),
    )
    matrix = np.asarray([[1.0, 0.0], [0.0, 1.0]], dtype=np.float32)
    manifest = DemoManifest(
        version="1",
        source_id=source_id,
        display_name="Economics - Theory of Cost.pdf",
        page_count=2,
        chunk_count=2,
        embedding_model="test-embeddings",
        extraction_version="test-v1",
        embedding_version="test-v1",
        built_at=datetime(2026, 8, 30, tzinfo=timezone.utc),
        suggested_questions=[
            "What is explicit cost?",
            "What is implicit cost?",
        ],
    )
    (root / "manifest.json").write_text(
        manifest.model_dump_json(indent=2),
        encoding="utf-8",
    )
    (root / "chunks.json").write_text(
        json.dumps(
            [
                {
                    "id": str(chunk.id),
                    "source_id": str(chunk.source_id),
                    "page_start": chunk.page_start,
                    "page_end": chunk.page_end,
                    "position": chunk.position,
                    "content": chunk.content,
                    "content_hash": chunk.content_hash,
                    "token_count": chunk.token_count,
                }
                for chunk in chunks
            ],
            indent=2,
        ),
        encoding="utf-8",
    )
    np.save(root / "embeddings.npy", matrix)
    return load_catalog(root)


def _write_pdf(path: Path, pages: list[str]) -> None:
    document = pymupdf.open()
    for text in pages:
        page = document.new_page()
        page.insert_textbox(pymupdf.Rect(50, 50, 550, 790), text, fontsize=12)
    document.save(path)
    document.close()
