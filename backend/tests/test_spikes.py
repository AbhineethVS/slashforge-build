from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

import numpy as np
import pymupdf
import pytest

from luma_spikes.chunking import MAX_TOKENS, chunk_document
from luma_spikes.citations import (
    InvalidCitationError,
    map_citations,
    validate_citation_allow_list,
)
from luma_spikes import config
from luma_spikes.models import (
    AnswerCitation,
    ExtractedDocument,
    ExtractedPage,
    GroundedAnswer,
)
from luma_spikes.pdf import PdfSpikeError, extract_pdf, normalize_text
from luma_spikes.retrieval import build_index, retrieve


def _write_text_pdf(path: Path, pages: list[str], *, password: str | None = None) -> None:
    document = pymupdf.open()
    for text in pages:
        page = document.new_page()
        page.insert_textbox(pymupdf.Rect(50, 50, 550, 790), text, fontsize=10)
    options = {}
    if password:
        options = {
            "encryption": pymupdf.PDF_ENCRYPT_AES_256,
            "owner_pw": password,
            "user_pw": password,
        }
    document.save(path, **options)
    document.close()


def test_extraction_preserves_one_based_pages(tmp_path: Path) -> None:
    pdf = tmp_path / "two-pages.pdf"
    _write_text_pdf(
        pdf,
        [
            "First page explains virtual memory and address translation.",
            "Second page explains deadlock prevention and safe allocation.",
        ],
    )

    extracted = extract_pdf(pdf)

    assert extracted.page_count == 2
    assert [page.number for page in extracted.pages] == [1, 2]
    assert "virtual memory" in extracted.pages[0].text
    assert "deadlock prevention" in extracted.pages[1].text


@pytest.mark.parametrize(
    ("fixture", "expected_code"),
    [
        ("corrupt", "SOURCE_PROCESSING_FAILED"),
        ("not_pdf", "SOURCE_TYPE_UNSUPPORTED"),
        ("empty", "SOURCE_TEXT_NOT_FOUND"),
        ("encrypted", "SOURCE_ENCRYPTED"),
    ],
)
def test_extraction_rejects_unsupported_documents(
    tmp_path: Path,
    fixture: str,
    expected_code: str,
) -> None:
    path = tmp_path / f"{fixture}.pdf"
    if fixture == "corrupt":
        path.write_bytes(b"%PDF-this-is-not-a-real-document")
    elif fixture == "not_pdf":
        path.write_text("plain text", encoding="utf-8")
    elif fixture == "empty":
        _write_text_pdf(path, [""])
    else:
        _write_text_pdf(path, ["Enough encrypted text to cross the extraction limit."], password="secret")

    with pytest.raises(PdfSpikeError) as caught:
        extract_pdf(path)

    assert caught.value.code == expected_code


def test_normalization_removes_unstable_characters() -> None:
    assert normalize_text("  soft\u00adware \x00  \n\n  systems  ") == "software\nsystems"


def test_project_environment_loads_dotenv_without_overriding_shell(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    (tmp_path / ".env").write_text(
        "OPENAI_API_KEY=from-file\nOPENAI_CHAT_MODEL=file-model\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(config, "PROJECT_ROOT", tmp_path)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_CHAT_MODEL", "shell-model")

    config.load_project_environment()

    assert os.getenv("OPENAI_API_KEY") == "from-file"
    assert os.getenv("OPENAI_CHAT_MODEL") == "shell-model"


def test_chunks_never_cross_pages(tmp_path: Path) -> None:
    page_one = "\n".join(
        f"Memory paragraph {index} " + "address " * 80 for index in range(10)
    )
    page_two = "\n".join(
        f"Process paragraph {index} " + "scheduler " * 80 for index in range(10)
    )
    document = ExtractedDocument(
        path=tmp_path / "long.pdf",
        page_count=2,
        pages=(
            ExtractedPage(1, page_one, len(page_one)),
            ExtractedPage(2, page_two, len(page_two)),
        ),
    )

    chunks = chunk_document(document, uuid4())

    assert chunks
    assert all(chunk.page_start == chunk.page_end for chunk in chunks)
    assert all(chunk.token_count <= MAX_TOKENS for chunk in chunks)
    assert {chunk.page_start for chunk in chunks} == {1, 2}


class KeywordEmbedder:
    model = "test-keywords"

    def embed(self, texts):
        return np.asarray(
            [
                [
                    float("memory" in text.lower()),
                    float("deadlock" in text.lower()),
                    float("unrelated" in text.lower()),
                ]
                for text in texts
            ],
            dtype=np.float32,
        )


def test_retrieval_filters_sources_and_ranks_expected_evidence(tmp_path: Path) -> None:
    pdf = tmp_path / "topics.pdf"
    _write_text_pdf(
        pdf,
        [
            "Memory paging maps virtual addresses to physical frames.",
            "Deadlock requires mutual exclusion, hold and wait, no preemption, and circular wait.",
        ],
    )
    document = extract_pdf(pdf)
    selected_source = uuid4()
    other_source = uuid4()
    selected_chunks = chunk_document(document, selected_source)
    other_chunks = chunk_document(document, other_source)
    embedder = KeywordEmbedder()
    index = build_index([*selected_chunks, *other_chunks], embedder)

    hits = retrieve(
        "What conditions cause deadlock?",
        index=index,
        embedder=embedder,
        selected_source_ids={selected_source},
        limit=5,
    )

    assert hits[0].chunk.page_start == 2
    assert all(hit.chunk.source_id == selected_source for hit in hits)


def test_fabricated_citation_is_rejected() -> None:
    answer = GroundedAnswer(
        answer_markdown="Unsupported answer.",
        citations=[AnswerCitation(chunk_id=uuid4(), claim="Unsupported claim")],
        insufficient_evidence=False,
        follow_up_questions=[],
    )

    with pytest.raises(InvalidCitationError):
        validate_citation_allow_list(answer, {uuid4()})


def test_mapped_citation_uses_trusted_page_metadata(tmp_path: Path) -> None:
    pdf = tmp_path / "citation.pdf"
    _write_text_pdf(pdf, ["Page one filler text.", "The trusted evidence is on page two."])
    source_id = uuid4()
    chunk = chunk_document(extract_pdf(pdf), source_id)[1]
    answer = GroundedAnswer(
        answer_markdown="The evidence is on the second page.",
        citations=[AnswerCitation(chunk_id=chunk.id, claim="Evidence location")],
        insufficient_evidence=False,
        follow_up_questions=[],
    )

    citation = map_citations(
        answer,
        chunks=[chunk],
        source_names={source_id: pdf.name},
    )[0]

    assert citation.page_start == 2
    assert citation.viewer_url.endswith("#page=2")

