from pathlib import Path

from fastapi.testclient import TestClient
import pytest

from luma_api.main import create_app


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    (tmp_path / "index.html").write_text(
        '<div id="root"></div>',
        encoding="utf-8",
    )
    return TestClient(create_app(frontend_dist=tmp_path))


def _session_headers(client: TestClient) -> dict[str, str]:
    session_id = client.post("/api/v1/session").json()["id"]
    return {"X-Session-ID": session_id}


def test_compiled_react_page_and_spa_fallback_are_served(
    client: TestClient,
) -> None:
    response = client.get("/")
    workspace_response = client.get("/workspace")

    assert response.status_code == 200
    assert '<div id="root"></div>' in response.text
    assert workspace_response.status_code == 200
    assert '<div id="root"></div>' in workspace_response.text


def test_health_does_not_expose_secret(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "do-not-return-this")

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "openai_configured": True}
    assert "do-not-return-this" not in response.text


def test_multipart_pdf_upload_is_bounded_and_validated(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/spike/upload",
        files={"file": ("fixture.pdf", b"%PDF-1.7\nspike", "application/pdf")},
        headers=_session_headers(client),
    )

    assert response.status_code == 200
    assert response.json() == {
        "filename": "fixture.pdf",
        "size_bytes": 14,
        "status": "accepted",
    }


def test_multipart_upload_rejects_false_pdf(client: TestClient) -> None:
    response = client.post(
        "/api/v1/spike/upload",
        files={"file": ("fixture.pdf", b"not a PDF", "application/pdf")},
        headers=_session_headers(client),
    )

    assert response.status_code == 415
    assert response.json()["error"]["code"] == "SOURCE_TYPE_UNSUPPORTED"


def test_upload_requires_a_session(client: TestClient) -> None:
    response = client.post(
        "/api/v1/spike/upload",
        files={"file": ("fixture.pdf", b"%PDF-1.7", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "SESSION_NOT_FOUND"

