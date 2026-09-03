from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path

import numpy as np
from fastapi.testclient import TestClient
from numpy.typing import NDArray

from luma_api.artifacts import InvalidArtifactError
from luma_api.learning import (
    RawTeachBack,
    RawTeachBackPoint,
    classify_attempt,
)
from luma_api.main import create_app
from luma_spikes.models import Chunk
from tests.demo_fixtures import write_test_demo_assets
from tests.test_artifacts import quiz_output


class FakeEmbedder:
    model = "test-embeddings"

    def embed(self, texts: Sequence[str]) -> NDArray[np.float32]:
        return np.asarray([[1.0, 1.0] for _ in texts], dtype=np.float32)


def make_client(tmp_path: Path, *, artifact_generator=quiz_output, teach_back=None):
    catalog = write_test_demo_assets(tmp_path / "demo_assets")
    client = TestClient(
        create_app(
            frontend_dist=None,
            demo_catalog=catalog,
            embedder_factory=FakeEmbedder,
            artifact_generator=lambda kind, chunks: artifact_generator(chunks),
            teach_back_generator=teach_back,
        )
    )
    return client, catalog


def test_deterministic_confidence_classifications() -> None:
    assert classify_attempt(is_correct=True, confidence=2) == "mastered"
    assert classify_attempt(is_correct=True, confidence=1) == "lucky_guess"
    assert classify_attempt(is_correct=False, confidence=2) == "needs_practice"
    assert (
        classify_attempt(is_correct=False, confidence=3)
        == "confident_misconception"
    )
    assert classify_attempt(is_correct=None, confidence=3) == "unscored"


def test_high_confidence_wrong_answer_updates_progress(tmp_path: Path) -> None:
    client, catalog = make_client(tmp_path)
    session = client.post("/api/v1/session").json()
    headers = {"X-Session-ID": session["id"]}
    quiz = client.post(
        "/api/v1/studio/quiz",
        headers=headers,
        json={"source_ids": [str(catalog.source_id)]},
    ).json()
    question = quiz["content"]["questions"][0]

    attempt = client.post(
        f"/api/v1/artifacts/{quiz['id']}/attempts",
        headers=headers,
        json={
            "question_id": question["id"],
            "response_text": "Distractor A",
            "confidence": 3,
        },
    )
    progress = client.get("/api/v1/studio/progress", headers=headers).json()

    assert attempt.status_code == 200
    assert attempt.json()["classification"] == "confident_misconception"
    assert attempt.json()["concept_label"] == "Explicit and implicit cost"
    assert progress["recommended_concept"] == "Explicit and implicit cost"
    assert progress["concepts"][0]["confident_misconception"] == 1
    memory = progress["learning_memory"]
    assert memory["open_misconception"]["concept_label"] == "Explicit and implicit cost"
    assert memory["open_misconception"]["misconception"]["status"] == "open"
    assert memory["suggested_questions"][0].startswith("A firm uses its own building")

    session_body = client.get("/api/v1/session", headers=headers).json()
    assert session_body["suggested_questions"][0].startswith(
        "A firm uses its own building"
    )
    assert session_body["learning_memory"]["open_misconception"]["state"] == "needs_recheck"


def test_short_answer_attempt_remains_formatively_unscored(tmp_path: Path) -> None:
    client, catalog = make_client(tmp_path)
    session = client.post("/api/v1/session").json()
    headers = {"X-Session-ID": session["id"]}
    quiz = client.post(
        "/api/v1/studio/quiz",
        headers=headers,
        json={"source_ids": [str(catalog.source_id)]},
    ).json()
    question = next(
        item for item in quiz["content"]["questions"] if item["type"] == "short_answer"
    )

    response = client.post(
        f"/api/v1/artifacts/{quiz['id']}/attempts",
        headers=headers,
        json={
            "question_id": question["id"],
            "response_text": question["expected_answer"],
            "confidence": 3,
        },
    )

    assert response.status_code == 200
    assert response.json()["classification"] == "unscored"
    assert response.json()["is_correct"] is None


def test_teach_back_feedback_uses_allow_listed_evidence(tmp_path: Path) -> None:
    def teach_back(_, __, chunks: Sequence[Chunk]) -> RawTeachBack:
        point = RawTeachBackPoint(
            text="Explicit costs are direct payments.",
            evidence_chunk_ids=[chunks[0].id],
        )
        return RawTeachBack(
            title="Teach Back: Explicit cost",
            rubric_points=[point, point, point],
            covered=[point],
            missing=[],
            check_this=[],
            next_prompt="How does implicit cost differ?",
        )

    client, catalog = make_client(tmp_path, teach_back=teach_back)
    session = client.post("/api/v1/session").json()
    headers = {"X-Session-ID": session["id"]}

    response = client.post(
        "/api/v1/studio/teach-back",
        headers=headers,
        json={
            "source_ids": [str(catalog.source_id)],
            "concept": "Explicit cost",
            "explanation": "Explicit cost means direct payments made by a firm.",
        },
    )

    assert response.status_code == 200
    assert response.json()["type"] == "teach_back"
    citation = response.json()["content"]["covered"][0]["citations"][0]
    assert citation["source_id"] == str(catalog.source_id)


def test_bundled_demo_uses_cached_artifact_when_generation_fails(
    tmp_path: Path,
) -> None:
    def fail(_):
        raise InvalidArtifactError("bad model output")

    client, catalog = make_client(tmp_path, artifact_generator=fail)
    catalog.fallback_artifacts["quiz"] = {
        "title": "Cached quiz",
        "content": {"fallback": True, "questions": []},
    }
    session = client.post("/api/v1/session").json()

    response = client.post(
        "/api/v1/studio/quiz",
        headers={"X-Session-ID": session["id"]},
        json={"source_ids": [str(catalog.source_id)]},
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Cached quiz"
    assert response.json()["content"]["fallback"] is True
