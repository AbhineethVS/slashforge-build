from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path
from uuid import uuid4

import numpy as np
from fastapi.testclient import TestClient
from numpy.typing import NDArray

from luma_api.artifacts import (
    RawFlashcard,
    RawFlashcardDeck,
    RawQuiz,
    RawQuizQuestion,
    RawSummary,
    RawSummarySection,
)
from luma_api.main import create_app
from luma_spikes.models import Chunk
from tests.demo_fixtures import write_test_demo_assets


class FakeEmbedder:
    model = "test-embeddings"

    def embed(self, texts: Sequence[str]) -> NDArray[np.float32]:
        return np.asarray([[1.0, 1.0] for _ in texts], dtype=np.float32)


def summary_output(chunks: Sequence[Chunk]) -> RawSummary:
    return RawSummary(
        title="Theory of Cost revision brief",
        sections=[
            RawSummarySection(
                title="Explicit cost",
                content_markdown="Explicit costs are direct payments.",
                evidence_chunk_ids=[chunks[0].id],
            ),
            RawSummarySection(
                title="Implicit cost",
                content_markdown="Implicit costs concern owned inputs.",
                evidence_chunk_ids=[chunks[-1].id],
            ),
        ],
        revision_questions=[
            "How do explicit and implicit costs differ?",
            "Why do both matter?",
        ],
    )


def flashcard_output(chunks: Sequence[Chunk]) -> RawFlashcardDeck:
    return RawFlashcardDeck(
        title="Cost flashcards",
        cards=[
            RawFlashcard(
                front=f"Cost question {index + 1}",
                back_markdown=f"Cost answer {index + 1}",
                concept_label="Costs",
                difficulty="recall",
                evidence_chunk_ids=[chunks[index % len(chunks)].id],
            )
            for index in range(6)
        ],
    )


def quiz_output(chunks: Sequence[Chunk]) -> RawQuiz:
    return RawQuiz(
        title="Cost quiz",
        questions=[
            RawQuizQuestion(
                type="mcq" if index < 4 else "short_answer",
                prompt=f"Quiz question {index + 1}?",
                options=(
                    ["Correct", "Distractor A", "Distractor B", "Distractor C"]
                    if index < 4
                    else []
                ),
                expected_answer=(
                    "Correct" if index < 4 else f"Expected response {index + 1}"
                ),
                explanation_markdown=f"Explanation {index + 1}",
                demo_response=(
                    "Correct" if index < 4 else f"Expected response {index + 1}"
                ),
                concept_label="Costs",
                difficulty="understanding",
                evidence_chunk_ids=[chunks[index % len(chunks)].id],
            )
            for index in range(7)
        ],
    )


def make_client(tmp_path: Path, generator) -> tuple[TestClient, str]:
    catalog = write_test_demo_assets(tmp_path / "demo_assets")
    client = TestClient(
        create_app(
            frontend_dist=None,
            demo_catalog=catalog,
            embedder_factory=FakeEmbedder,
            artifact_generator=generator,
        )
    )
    return client, str(catalog.source_id)


def generate(
    client: TestClient,
    session_id: str,
    source_id: str,
    kind: str,
):
    return client.post(
        f"/api/v1/studio/{kind}",
        headers={"X-Session-ID": session_id},
        json={"source_ids": [source_id]},
    )


def test_summary_is_stored_with_trusted_citations(tmp_path: Path) -> None:
    client, source_id = make_client(
        tmp_path,
        lambda kind, chunks: summary_output(chunks),
    )
    session = client.post("/api/v1/session").json()

    response = generate(client, session["id"], source_id, "summary")

    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "summary"
    assert len(body["content"]["sections"]) == 2
    assert body["content"]["sections"][0]["citations"][0]["source_id"] == source_id
    listed = client.get(
        "/api/v1/studio/artifacts",
        headers={"X-Session-ID": session["id"]},
    ).json()
    assert [artifact["id"] for artifact in listed] == [body["id"]]


def test_flashcards_and_quiz_have_validated_content(tmp_path: Path) -> None:
    def generator(kind, chunks):
        if kind == "flashcards":
            return flashcard_output(chunks)
        return quiz_output(chunks)

    client, source_id = make_client(tmp_path, generator)
    session = client.post("/api/v1/session").json()

    cards = generate(client, session["id"], source_id, "flashcards").json()
    quiz = generate(client, session["id"], source_id, "quiz").json()

    assert len(cards["content"]["cards"]) == 6
    assert all(card["citations"] for card in cards["content"]["cards"])
    assert len(quiz["content"]["questions"]) == 5
    assert quiz["content"]["questions"][0]["demo_response"] == "Correct"
    assert all(question["citations"] for question in quiz["content"]["questions"])


def test_artifact_with_unknown_evidence_is_retried_then_rejected(
    tmp_path: Path,
) -> None:
    calls = 0

    def generator(_, chunks):
        nonlocal calls
        calls += 1
        output = summary_output(chunks)
        output.sections[0].evidence_chunk_ids = [uuid4()]
        return output

    client, source_id = make_client(tmp_path, generator)
    session = client.post("/api/v1/session").json()

    response = generate(client, session["id"], source_id, "summary")

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "AI_OUTPUT_INVALID"
    assert calls == 2
    assert client.get(
        "/api/v1/studio/artifacts",
        headers={"X-Session-ID": session["id"]},
    ).json() == []


def test_quiz_discards_invalid_candidates_and_keeps_five(
    tmp_path: Path,
) -> None:
    def generator(_, chunks):
        output = quiz_output(chunks)
        output.questions[0].evidence_chunk_ids = [uuid4()]
        output.questions[1].evidence_chunk_ids = [uuid4()]
        return output

    client, source_id = make_client(tmp_path, generator)
    session = client.post("/api/v1/session").json()

    response = generate(client, session["id"], source_id, "quiz")

    assert response.status_code == 200
    assert len(response.json()["content"]["questions"]) == 5


def test_artifacts_are_session_scoped_and_deletable(tmp_path: Path) -> None:
    client, source_id = make_client(
        tmp_path,
        lambda kind, chunks: flashcard_output(chunks),
    )
    owner = client.post("/api/v1/session").json()
    other = client.post("/api/v1/session").json()
    artifact = generate(client, owner["id"], source_id, "flashcards").json()

    denied = client.get(
        f"/api/v1/artifacts/{artifact['id']}",
        headers={"X-Session-ID": other["id"]},
    )
    deleted = client.delete(
        f"/api/v1/artifacts/{artifact['id']}",
        headers={"X-Session-ID": owner["id"]},
    )

    assert denied.status_code == 404
    assert deleted.status_code == 204
    assert client.get(
        "/api/v1/studio/artifacts",
        headers={"X-Session-ID": owner["id"]},
    ).json() == []


def test_visual_deck_is_session_scoped_and_serves_the_cached_pdf(
    tmp_path: Path,
) -> None:
    client, source_id = make_client(
        tmp_path,
        lambda kind, chunks: summary_output(chunks),
    )
    owner = client.post("/api/v1/session").json()
    other = client.post("/api/v1/session").json()
    prompt = "Create a visual presentation that explains the core economic graphs."

    created = client.post(
        "/api/v1/studio/visual-deck",
        headers={"X-Session-ID": owner["id"]},
        json={"source_ids": [source_id], "prompt": prompt},
    )

    assert created.status_code == 200
    artifact = created.json()
    assert artifact["type"] == "visual_deck"
    assert artifact["content"]["fallback"] is True
    assert artifact["content"]["prompt"] == prompt
    assert artifact["content"]["page_count"] == 15

    owned_file = client.get(
        artifact["content"]["file_url"],
        headers={"X-Session-ID": owner["id"]},
    )
    denied_file = client.get(
        artifact["content"]["file_url"],
        headers={"X-Session-ID": other["id"]},
    )

    assert owned_file.status_code == 200
    assert owned_file.content.startswith(b"%PDF")
    assert denied_file.status_code == 404


def test_visual_deck_validates_prompt_before_creating_an_artifact(
    tmp_path: Path,
) -> None:
    client, source_id = make_client(
        tmp_path,
        lambda kind, chunks: summary_output(chunks),
    )
    session = client.post("/api/v1/session").json()

    response = client.post(
        "/api/v1/studio/visual-deck",
        headers={"X-Session-ID": session["id"]},
        json={"source_ids": [source_id], "prompt": "Too short"},
    )

    assert response.status_code == 422
