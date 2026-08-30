from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from luma_api.main import create_app
from luma_api.sessions import SessionStore


@dataclass
class MutableClock:
    value: datetime

    def __call__(self) -> datetime:
        return self.value


def test_session_create_restore_and_reset() -> None:
    client = TestClient(create_app(frontend_dist=None))

    created = client.post("/api/v1/session")
    session_id = created.json()["id"]
    headers = {"X-Session-ID": session_id}
    restored = client.get("/api/v1/session", headers=headers)
    deleted = client.delete("/api/v1/session", headers=headers)
    missing = client.get("/api/v1/session", headers=headers)

    assert created.status_code == 201
    assert created.json()["sources"] == []
    assert restored.status_code == 200
    assert restored.json()["id"] == session_id
    assert deleted.status_code == 204
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "SESSION_NOT_FOUND"


def test_session_access_refreshes_the_ttl() -> None:
    clock = MutableClock(datetime(2026, 8, 30, tzinfo=timezone.utc))
    store = SessionStore(ttl=timedelta(minutes=60), clock=clock)
    client = TestClient(create_app(session_store=store, frontend_dist=None))
    created = client.post("/api/v1/session").json()

    clock.value += timedelta(minutes=30)
    restored = client.get(
        "/api/v1/session",
        headers={"X-Session-ID": created["id"]},
    )

    assert restored.status_code == 200
    assert datetime.fromisoformat(restored.json()["expires_at"]) == (
        clock.value + timedelta(minutes=60)
    )


def test_expired_session_returns_stable_error() -> None:
    clock = MutableClock(datetime(2026, 8, 30, tzinfo=timezone.utc))
    store = SessionStore(ttl=timedelta(minutes=60), clock=clock)
    client = TestClient(create_app(session_store=store, frontend_dist=None))
    session_id = client.post("/api/v1/session").json()["id"]

    clock.value += timedelta(minutes=61)
    response = client.get(
        "/api/v1/session",
        headers={"X-Session-ID": session_id},
    )

    assert response.status_code == 410
    assert response.json()["error"]["code"] == "SESSION_EXPIRED"


def test_active_sessions_are_bounded() -> None:
    store = SessionStore(max_sessions=1)
    client = TestClient(create_app(session_store=store, frontend_dist=None))
    assert client.post("/api/v1/session").status_code == 201

    response = client.post("/api/v1/session")

    assert response.status_code == 429
    assert response.json()["error"]["code"] == "REQUEST_RATE_LIMITED"


def test_malformed_session_id_is_not_accepted() -> None:
    client = TestClient(create_app(frontend_dist=None))

    response = client.get(
        "/api/v1/session",
        headers={"X-Session-ID": "not-a-session"},
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "SESSION_NOT_FOUND"

