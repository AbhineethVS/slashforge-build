from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path
from uuid import uuid4

import numpy as np
from fastapi.testclient import TestClient
from numpy.typing import NDArray

from luma_api.main import create_app
from luma_spikes.models import AnswerCitation, Chunk, GroundedAnswer
from tests.demo_fixtures import write_test_demo_assets


class FakeEmbedder:
    model = "test-embeddings"

    def embed(self, texts: Sequence[str]) -> NDArray[np.float32]:
        return np.asarray([[1.0, 1.0] for _ in texts], dtype=np.float32)


def build_client(
    tmp_path: Path,
    generator,
) -> tuple[TestClient, str]:
    catalog = write_test_demo_assets(tmp_path / "demo_assets")
    client = TestClient(
        create_app(
            frontend_dist=None,
            demo_catalog=catalog,
            embedder_factory=FakeEmbedder,
            answer_generator=generator,
        )
    )
    return client, str(catalog.source_id)


def ask(
    client: TestClient,
    session_id: str,
    source_ids: list[str],
    question: str = "What is explicit cost?",
):
    return client.post(
        "/api/v1/chat/messages",
        headers={"X-Session-ID": session_id},
        json={"question": question, "source_ids": source_ids},
    )


def test_grounded_answer_maps_trusted_citation_metadata(tmp_path: Path) -> None:
    def generator(_: str, chunks: Sequence[Chunk]) -> GroundedAnswer:
        return GroundedAnswer(
            answer_markdown="Explicit cost is a direct payment.",
            citations=[
                AnswerCitation(
                    chunk_id=chunks[0].id,
                    claim="Explicit cost is paid directly.",
                )
            ],
            insufficient_evidence=False,
            follow_up_questions=["How does implicit cost differ?"],
        )

    client, source_id = build_client(tmp_path, generator)
    session = client.post("/api/v1/session").json()

    response = ask(client, session["id"], [source_id])

    assert response.status_code == 200
    body = response.json()
    assert body["content_markdown"] == "Explicit cost is a direct payment."
    assert body["citations"][0]["source_id"] == source_id
    assert body["citations"][0]["source_name"] == "Economics - Theory of Cost.pdf"
    assert body["citations"][0]["page_start"] in {1, 2}
    assert body["citations"][0]["viewer_url"].endswith(
        f"/sources/{source_id}/file#page={body['citations'][0]['page_start']}"
    )
    history = client.get(
        "/api/v1/chat/messages",
        headers={"X-Session-ID": session["id"]},
    ).json()
    assert [message["role"] for message in history] == ["user", "assistant"]


def test_fabricated_citation_is_retried_once_then_rejected(tmp_path: Path) -> None:
    calls = 0

    def generator(_: str, __: Sequence[Chunk]) -> GroundedAnswer:
        nonlocal calls
        calls += 1
        return GroundedAnswer(
            answer_markdown="Unsupported answer.",
            citations=[
                AnswerCitation(chunk_id=uuid4(), claim="Unsupported claim.")
            ],
            insufficient_evidence=False,
            follow_up_questions=[],
        )

    client, source_id = build_client(tmp_path, generator)
    session = client.post("/api/v1/session").json()

    response = ask(client, session["id"], [source_id])

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "AI_OUTPUT_INVALID"
    assert calls == 2
    assert client.get(
        "/api/v1/chat/messages",
        headers={"X-Session-ID": session["id"]},
    ).json() == []


def test_insufficient_evidence_has_no_citations(tmp_path: Path) -> None:
    def generator(_: str, chunks: Sequence[Chunk]) -> GroundedAnswer:
        return GroundedAnswer(
            answer_markdown="Invented model text that must not reach the browser.",
            citations=[
                AnswerCitation(
                    chunk_id=chunks[0].id,
                    claim="Irrelevant evidence.",
                )
            ],
            insufficient_evidence=True,
            follow_up_questions=[],
        )

    client, source_id = build_client(tmp_path, generator)
    session = client.post("/api/v1/session").json()

    response = ask(
        client,
        session["id"],
        [source_id],
        "What does this say about quantum mechanics?",
    )

    assert response.status_code == 200
    assert response.json()["insufficient_evidence"] is True
    assert response.json()["citations"] == []
    assert "do not contain enough evidence" in response.json()["content_markdown"]
    assert "Invented model text" not in response.json()["content_markdown"]


def test_unknown_or_cross_session_source_is_rejected(tmp_path: Path) -> None:
    def generator(_: str, __: Sequence[Chunk]) -> GroundedAnswer:
        raise AssertionError("Generation must not run for an invalid source.")

    client, _ = build_client(tmp_path, generator)
    session = client.post("/api/v1/session").json()

    response = ask(client, session["id"], [str(uuid4())])

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "SOURCE_NOT_READY"


def test_question_and_source_selection_are_bounded(tmp_path: Path) -> None:
    def generator(_: str, __: Sequence[Chunk]) -> GroundedAnswer:
        raise AssertionError("Invalid requests must not reach generation.")

    client, source_id = build_client(tmp_path, generator)
    session = client.post("/api/v1/session").json()

    empty = ask(client, session["id"], [source_id], question="  ")
    no_sources = ask(client, session["id"], [])
    duplicate = ask(client, session["id"], [source_id, source_id])

    assert empty.status_code == 422
    assert no_sources.status_code == 422
    assert duplicate.status_code == 422
