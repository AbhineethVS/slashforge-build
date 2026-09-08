from __future__ import annotations

from pathlib import Path
from uuid import UUID

import numpy as np
import pytest
from fastapi.testclient import TestClient

from luma_api.demo_assets import load_catalog
from luma_api.main import create_app
from tests.demo_fixtures import write_test_demo_assets


@pytest.fixture
def demo_catalog(tmp_path: Path):
    return write_test_demo_assets(tmp_path / "demo_assets")


@pytest.fixture
def client(demo_catalog) -> TestClient:
    return TestClient(create_app(frontend_dist=None, demo_catalog=demo_catalog))


def test_new_session_includes_ready_bundled_source(client: TestClient) -> None:
    response = client.post("/api/v1/session")

    assert response.status_code == 201
    body = response.json()
    assert len(body["sources"]) == 1
    assert body["sources"][0]["kind"] == "bundled"
    assert body["sources"][0]["status"] == "ready"
    assert body["sources"][0]["page_count"] == 2
    assert len(body["suggested_questions"]) == 2


def test_reset_returns_a_fresh_bundled_session(client: TestClient) -> None:
    created = client.post("/api/v1/session").json()
    headers = {"X-Session-ID": created["id"]}
    assert client.delete("/api/v1/session", headers=headers).status_code == 204

    reset = client.post("/api/v1/session")

    assert reset.status_code == 201
    assert reset.json()["id"] != created["id"]
    assert reset.json()["sources"][0]["status"] == "ready"


def test_bundled_pdf_is_served_for_the_active_session(
    client: TestClient,
    demo_catalog,
) -> None:
    session = client.post("/api/v1/session").json()
    source_id = session["sources"][0]["id"]
    response = client.get(
        f"/api/v1/sources/{source_id}/file",
        headers={"X-Session-ID": session["id"]},
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_unknown_source_id_is_rejected(client: TestClient) -> None:
    from uuid import uuid4

    session = client.post("/api/v1/session").json()
    response = client.get(
        f"/api/v1/sources/{uuid4()}/file",
        headers={"X-Session-ID": session["id"]},
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "SOURCE_NOT_READY"


def test_library_loads_economics_and_dsa_catalogs() -> None:
    from luma_api.demo_assets import (
        BUNDLED_DEMO_SOURCE_ID,
        BUNDLED_DSA_SOURCE_ID,
        DEFAULT_DEMO_DIR,
        load_library,
    )

    if not (DEFAULT_DEMO_DIR / "library.json").is_file():
        pytest.skip("Packaged demo library is unavailable in this environment.")

    library = load_library(DEFAULT_DEMO_DIR)

    assert [source.source_id for source in library.sources] == [
        BUNDLED_DEMO_SOURCE_ID,
        BUNDLED_DSA_SOURCE_ID,
    ]
    assert library.get(BUNDLED_DSA_SOURCE_ID) is not None
    assert len(library.source_summaries()) == 2
    assert len(library.suggested_questions()) >= 4


def test_manifest_and_embeddings_stay_compatible(demo_catalog) -> None:
    reloaded = load_catalog(demo_catalog.root)

    assert reloaded.manifest.chunk_count == 2
    assert reloaded.index.matrix.shape == (2, 2)
    assert isinstance(reloaded.chunks[0].id, UUID)
