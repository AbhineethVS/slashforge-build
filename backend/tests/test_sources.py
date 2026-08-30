from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from uuid import UUID

import numpy as np
import pymupdf
from fastapi.testclient import TestClient
from numpy.typing import NDArray

from luma_api.main import create_app
from luma_api.sessions import SessionStore
from luma_spikes.retrieval import EMBEDDING_MODEL
from tests.demo_fixtures import write_test_demo_assets


class FakeEmbedder:
    model = EMBEDDING_MODEL

    def embed(self, texts: Sequence[str]) -> NDArray[np.float32]:
        return np.asarray(
            [[float(index + 1), 1.0] for index, _ in enumerate(texts)],
            dtype=np.float32,
        )


def pdf_bytes(pages: list[str]) -> bytes:
    document = pymupdf.open()
    for text in pages:
        page = document.new_page()
        if text:
            page.insert_textbox(pymupdf.Rect(50, 50, 550, 790), text, fontsize=12)
    stream = BytesIO()
    document.save(stream)
    document.close()
    return stream.getvalue()


def make_client(tmp_path: Path) -> TestClient:
    catalog = write_test_demo_assets(tmp_path / "demo_assets")
    return TestClient(
        create_app(
            frontend_dist=None,
            demo_catalog=catalog,
            embedder_factory=FakeEmbedder,
        )
    )


def create_session(client: TestClient) -> dict:
    return client.post("/api/v1/session").json()


def upload(
    client: TestClient,
    session: dict,
    *,
    filename: str = "notes.pdf",
    content: bytes | None = None,
    content_type: str = "application/pdf",
):
    return client.post(
        "/api/v1/sources",
        headers={"X-Session-ID": session["id"]},
        files={
            "file": (
                filename,
                content or pdf_bytes(["Readable economics notes " * 10]),
                content_type,
            )
        },
    )


def test_upload_becomes_ready_and_is_listed(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    session = create_session(client)

    response = upload(client, session, filename="../unit-costs.pdf")

    assert response.status_code == 201
    assert response.json()["display_name"] == "unit-costs.pdf"
    assert response.json()["kind"] == "uploaded"
    assert response.json()["status"] == "ready"
    listed = client.get(
        "/api/v1/sources",
        headers={"X-Session-ID": session["id"]},
    ).json()
    assert [source["kind"] for source in listed] == ["bundled", "uploaded"]


def test_uploaded_pdf_is_session_scoped(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    owner = create_session(client)
    other = create_session(client)
    source_id = upload(client, owner).json()["id"]

    owner_response = client.get(
        f"/api/v1/sources/{source_id}/file",
        headers={"X-Session-ID": owner["id"]},
    )
    other_response = client.get(
        f"/api/v1/sources/{source_id}/file",
        headers={"X-Session-ID": other["id"]},
    )

    assert owner_response.status_code == 200
    assert owner_response.content.startswith(b"%PDF")
    assert other_response.status_code == 404
    assert other_response.json()["error"]["code"] == "SOURCE_NOT_READY"


def test_failed_upload_is_not_attached(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    session = create_session(client)

    response = upload(client, session, content=pdf_bytes([""]))

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "SOURCE_TEXT_NOT_FOUND"
    restored = client.get(
        "/api/v1/session",
        headers={"X-Session-ID": session["id"]},
    ).json()
    assert [source["kind"] for source in restored["sources"]] == ["bundled"]


def test_delete_and_reset_remove_temporary_files(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    session = create_session(client)
    first_id = upload(client, session, filename="first.pdf").json()["id"]
    store = client.app.state.session_store
    stored_session = store.get(UUID(session["id"]))
    first_path = stored_session.uploaded_sources[UUID(first_id)].file_path
    assert first_path.is_file()

    deleted = client.delete(
        f"/api/v1/sources/{first_id}",
        headers={"X-Session-ID": session["id"]},
    )
    assert deleted.status_code == 204
    assert not first_path.exists()

    upload(client, session, filename="second.pdf")
    temporary_directory = stored_session.temporary_directory
    assert temporary_directory is not None and temporary_directory.is_dir()
    reset = client.delete(
        "/api/v1/session",
        headers={"X-Session-ID": session["id"]},
    )
    assert reset.status_code == 204
    assert not temporary_directory.exists()


def test_upload_count_and_type_are_bounded(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    session = create_session(client)
    assert upload(client, session, filename="one.pdf").status_code == 201
    assert upload(client, session, filename="two.pdf").status_code == 201

    third = upload(client, session, filename="three.pdf")
    assert third.status_code == 409
    assert third.json()["error"]["code"] == "REQUEST_RATE_LIMITED"

    another_session = create_session(client)
    wrong_type = upload(
        client,
        another_session,
        filename="notes.txt",
        content=b"%PDF-not-really",
        content_type="text/plain",
    )
    assert wrong_type.status_code == 415
    assert wrong_type.json()["error"]["code"] == "SOURCE_TYPE_UNSUPPORTED"


def test_expiry_removes_temporary_source_files(tmp_path: Path) -> None:
    now = [datetime(2026, 8, 30, tzinfo=timezone.utc)]
    store = SessionStore(clock=lambda: now[0])
    catalog = write_test_demo_assets(tmp_path / "demo_assets")
    client = TestClient(
        create_app(
            session_store=store,
            frontend_dist=None,
            demo_catalog=catalog,
            embedder_factory=FakeEmbedder,
        )
    )
    session = create_session(client)
    source_id = upload(client, session).json()["id"]
    temporary_path = store.get(UUID(session["id"])).uploaded_sources[
        UUID(source_id)
    ].file_path

    now[0] += timedelta(minutes=61)
    response = client.get(
        "/api/v1/session",
        headers={"X-Session-ID": session["id"]},
    )

    assert response.status_code == 410
    assert not temporary_path.exists()
