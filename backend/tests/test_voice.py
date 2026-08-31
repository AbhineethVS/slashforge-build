from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path
from uuid import UUID, uuid4

import numpy as np
from fastapi.testclient import TestClient
from numpy.typing import NDArray

from luma_api.audio_overview import RawAudioOverview, RawAudioOverviewSection
from luma_api.main import create_app
from luma_api.voice import MAX_AUDIO_UPLOAD_BYTES, VoiceProviderError
from luma_spikes.models import Chunk
from tests.demo_fixtures import write_test_demo_assets


class FakeEmbedder:
    model = "test-embeddings"

    def embed(self, texts: Sequence[str]) -> NDArray[np.float32]:
        return np.asarray([[1.0, 1.0] for _ in texts], dtype=np.float32)


class FakeVoice:
    def __init__(self, *, fail_on_synthesis: int | None = None) -> None:
        self.transcriptions = 0
        self.syntheses = 0
        self.fail_on_synthesis = fail_on_synthesis

    async def transcribe(
        self,
        *,
        audio: bytes,
        filename: str,
        content_type: str,
    ) -> tuple[str, str | None]:
        self.transcriptions += 1
        assert audio
        assert filename
        assert content_type
        return "What is total cost?", "en-IN"

    async def synthesize(self, text: str) -> bytes:
        self.syntheses += 1
        if self.syntheses == self.fail_on_synthesis:
            raise VoiceProviderError("provider failed", retryable=True)
        return b"ID3" + text.encode("utf-8")


def overview_output(chunks: Sequence[Chunk]) -> RawAudioOverview:
    section_text = " ".join(
        ["This grounded section explains an important cost relationship clearly."]
        * 18
    )
    return RawAudioOverview(
        title="Grounded cost overview",
        sections=[
            RawAudioOverviewSection(
                title=f"Cost section {index + 1}",
                narration_text=section_text,
                evidence_chunk_ids=[chunks[index % len(chunks)].id],
            )
            for index in range(3)
        ],
    )


def make_client(
    tmp_path: Path,
    voice: FakeVoice,
    overview_generator=overview_output,
) -> tuple[TestClient, str]:
    catalog = write_test_demo_assets(tmp_path / "demo_assets")
    client = TestClient(
        create_app(
            frontend_dist=None,
            demo_catalog=catalog,
            embedder_factory=FakeEmbedder,
            audio_overview_generator=overview_generator,
            voice_provider=voice,
        )
    )
    return client, str(catalog.source_id)


def test_voice_transcription_is_session_scoped_and_review_only(
    tmp_path: Path,
) -> None:
    voice = FakeVoice()
    client, _ = make_client(tmp_path, voice)
    session = client.post("/api/v1/session").json()

    response = client.post(
        "/api/v1/voice/transcriptions",
        headers={"X-Session-ID": session["id"]},
        files={"file": ("question.webm", b"recorded speech", "audio/webm")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "transcript": "What is total cost?",
        "language_code": "en-IN",
    }
    restored = client.get(
        "/api/v1/session",
        headers={"X-Session-ID": session["id"]},
    ).json()
    assert restored["messages"] == []


def test_voice_transcription_rejects_type_and_size(tmp_path: Path) -> None:
    client, _ = make_client(tmp_path, FakeVoice())
    session = client.post("/api/v1/session").json()
    headers = {"X-Session-ID": session["id"]}

    unsupported = client.post(
        "/api/v1/voice/transcriptions",
        headers=headers,
        files={"file": ("notes.txt", b"not audio", "text/plain")},
    )
    oversized = client.post(
        "/api/v1/voice/transcriptions",
        headers=headers,
        files={
            "file": (
                "long.webm",
                b"x" * (MAX_AUDIO_UPLOAD_BYTES + 1),
                "audio/webm",
            )
        },
    )

    assert unsupported.status_code == 415
    assert unsupported.json()["error"]["code"] == "VOICE_UNSUPPORTED"
    assert oversized.status_code == 413
    assert oversized.json()["error"]["code"] == "AUDIO_TOO_LARGE"


def test_answer_narration_is_owned_and_cached(tmp_path: Path) -> None:
    voice = FakeVoice()
    client, _ = make_client(tmp_path, voice)
    owner = client.post("/api/v1/session").json()
    other = client.post("/api/v1/session").json()
    message_id = uuid4()
    owner_session = client.app.state.session_store.get(UUID(owner["id"]))
    owner_session.messages.append(
        {
            "id": str(message_id),
            "role": "assistant",
            "content_markdown": "**Total cost** combines fixed and variable cost.",
        }
    )

    response = client.post(
        f"/api/v1/chat/messages/{message_id}/audio",
        headers={"X-Session-ID": owner["id"]},
    )
    repeated = client.post(
        f"/api/v1/chat/messages/{message_id}/audio",
        headers={"X-Session-ID": owner["id"]},
    )
    denied = client.post(
        f"/api/v1/chat/messages/{message_id}/audio",
        headers={"X-Session-ID": other["id"]},
    )

    assert response.status_code == 200
    assert repeated.json() == response.json()
    assert voice.syntheses == 1
    assert denied.status_code == 404
    audio = client.get(
        response.json()["clips"][0]["url"],
        headers={"X-Session-ID": owner["id"]},
    )
    cross_session_audio = client.get(
        response.json()["clips"][0]["url"],
        headers={"X-Session-ID": other["id"]},
    )
    assert audio.status_code == 200
    assert audio.headers["content-type"].startswith("audio/mpeg")
    assert cross_session_audio.status_code == 404


def test_grounded_overview_stores_transcript_citations_and_audio(
    tmp_path: Path,
) -> None:
    client, source_id = make_client(tmp_path, FakeVoice())
    session = client.post("/api/v1/session").json()

    response = client.post(
        "/api/v1/studio/audio-overview",
        headers={"X-Session-ID": session["id"]},
        json={"source_ids": [source_id]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "audio_overview"
    assert body["content"]["audio_status"] == "ready"
    assert len(body["content"]["sections"]) == 3
    assert all(section["citations"] for section in body["content"]["sections"])
    assert all(
        section["citations"][0]["source_id"] == source_id
        for section in body["content"]["sections"]
    )
    assert all(
        section["audio_clip_ids"] for section in body["content"]["sections"]
    )


def test_overview_keeps_transcript_when_tts_fails(tmp_path: Path) -> None:
    client, source_id = make_client(
        tmp_path,
        FakeVoice(fail_on_synthesis=2),
    )
    session = client.post("/api/v1/session").json()

    response = client.post(
        "/api/v1/studio/audio-overview",
        headers={"X-Session-ID": session["id"]},
        json={"source_ids": [source_id]},
    )
    stored = client.app.state.session_store.get(UUID(session["id"]))

    assert response.status_code == 200
    assert response.json()["content"]["audio_status"] == "unavailable"
    assert response.json()["content"]["sections"][0]["transcript"]
    assert stored.audio_assets == {}


def test_artifact_delete_and_reset_remove_audio(tmp_path: Path) -> None:
    client, source_id = make_client(tmp_path, FakeVoice())
    session = client.post("/api/v1/session").json()
    headers = {"X-Session-ID": session["id"]}
    overview = client.post(
        "/api/v1/studio/audio-overview",
        headers=headers,
        json={"source_ids": [source_id]},
    ).json()
    stored = client.app.state.session_store.get(UUID(session["id"]))
    paths = [asset.path for asset in stored.audio_assets.values()]

    deleted = client.delete(
        f"/api/v1/artifacts/{overview['id']}",
        headers=headers,
    )

    assert deleted.status_code == 204
    assert stored.audio_assets == {}
    assert all(not path.exists() for path in paths)

    second = client.post(
        "/api/v1/studio/audio-overview",
        headers=headers,
        json={"source_ids": [source_id]},
    )
    assert second.status_code == 200
    reset_paths = [asset.path for asset in stored.audio_assets.values()]
    reset = client.delete("/api/v1/session", headers=headers)
    assert reset.status_code == 204
    assert all(not path.exists() for path in reset_paths)


def test_voice_concurrency_is_bounded(tmp_path: Path) -> None:
    client, _ = make_client(tmp_path, FakeVoice())
    session = client.post("/api/v1/session").json()
    stored = client.app.state.session_store.get(UUID(session["id"]))
    message_id = uuid4()
    stored.messages.append(
        {
            "id": str(message_id),
            "role": "assistant",
            "content_markdown": "Owned grounded answer.",
        }
    )
    assert stored.voice_lock.acquire(blocking=False)
    try:
        response = client.post(
            f"/api/v1/chat/messages/{message_id}/audio",
            headers={"X-Session-ID": session["id"]},
        )
    finally:
        stored.voice_lock.release()

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "REQUEST_RATE_LIMITED"


def test_overview_rejects_fabricated_citations_without_fallback(
    tmp_path: Path,
) -> None:
    def invalid(chunks: Sequence[Chunk]) -> RawAudioOverview:
        output = overview_output(chunks)
        output.sections[0].evidence_chunk_ids = [uuid4()]
        return output

    client, source_id = make_client(tmp_path, FakeVoice(), invalid)
    client.app.state.demo_catalog.fallback_artifacts.pop("audio_overview", None)
    session = client.post("/api/v1/session").json()

    response = client.post(
        "/api/v1/studio/audio-overview",
        headers={"X-Session-ID": session["id"]},
        json={"source_ids": [source_id]},
    )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "AI_OUTPUT_INVALID"
