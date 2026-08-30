from fastapi.testclient import TestClient

from luma_api.main import app

client = TestClient(app)


def test_compiled_react_page_is_served() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert '<div id="root"></div>' in response.text


def test_health_does_not_expose_secret(monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "do-not-return-this")

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "openai_configured": True}
    assert "do-not-return-this" not in response.text


def test_multipart_pdf_upload_is_bounded_and_validated() -> None:
    response = client.post(
        "/api/v1/spike/upload",
        files={"file": ("fixture.pdf", b"%PDF-1.7\nspike", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "filename": "fixture.pdf",
        "size_bytes": 14,
        "status": "accepted",
    }


def test_multipart_upload_rejects_false_pdf() -> None:
    response = client.post(
        "/api/v1/spike/upload",
        files={"file": ("fixture.pdf", b"not a PDF", "application/pdf")},
    )

    assert response.status_code == 415

