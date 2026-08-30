from __future__ import annotations

from collections import deque
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
import shutil
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

if TYPE_CHECKING:
    from .sources import UploadedSource

SESSION_TTL = timedelta(minutes=60)
MAX_ACTIVE_SESSIONS = 100
MAX_EXPIRED_MARKERS = 1_000


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(slots=True)
class DemoSession:
    id: UUID
    created_at: datetime
    expires_at: datetime
    sources: list[dict[str, object]] = field(default_factory=list)
    messages: list[dict[str, object]] = field(default_factory=list)
    artifacts: list[dict[str, object]] = field(default_factory=list)
    attempts: list[dict[str, object]] = field(default_factory=list)
    uploaded_sources: dict[UUID, UploadedSource] = field(default_factory=dict)
    temporary_directory: Path | None = None
    upload_in_progress: bool = False

    def cleanup(self) -> None:
        self.uploaded_sources.clear()
        if self.temporary_directory is not None:
            shutil.rmtree(self.temporary_directory, ignore_errors=True)
            self.temporary_directory = None


class SessionNotFoundError(LookupError):
    pass


class SessionExpiredError(LookupError):
    pass


class SessionCapacityError(RuntimeError):
    pass


class SessionStore:
    def __init__(
        self,
        *,
        ttl: timedelta = SESSION_TTL,
        max_sessions: int = MAX_ACTIVE_SESSIONS,
        clock: Callable[[], datetime] = utc_now,
    ) -> None:
        self._ttl = ttl
        self._max_sessions = max_sessions
        self._clock = clock
        self._sessions: dict[UUID, DemoSession] = {}
        self._expired_order: deque[UUID] = deque()
        self._expired_ids: set[UUID] = set()

    def create(self) -> DemoSession:
        now = self._clock()
        self.cleanup_expired(now=now)
        if len(self._sessions) >= self._max_sessions:
            raise SessionCapacityError("The temporary session limit was reached.")

        session = DemoSession(
            id=uuid4(),
            created_at=now,
            expires_at=now + self._ttl,
        )
        self._sessions[session.id] = session
        return session

    def get(self, session_id: UUID, *, refresh: bool = True) -> DemoSession:
        now = self._clock()
        session = self._sessions.get(session_id)
        if session is None:
            if session_id in self._expired_ids:
                raise SessionExpiredError("The temporary session expired.")
            raise SessionNotFoundError("The temporary session was not found.")
        if session.expires_at <= now:
            session.cleanup()
            del self._sessions[session_id]
            self._mark_expired(session_id)
            raise SessionExpiredError("The temporary session expired.")
        if refresh:
            session.expires_at = now + self._ttl
        return session

    def delete(self, session_id: UUID) -> None:
        session = self.get(session_id, refresh=False)
        session.cleanup()
        del self._sessions[session_id]

    def cleanup_expired(self, *, now: datetime | None = None) -> int:
        comparison_time = now or self._clock()
        expired = [
            session_id
            for session_id, session in self._sessions.items()
            if session.expires_at <= comparison_time
        ]
        for session_id in expired:
            self._sessions[session_id].cleanup()
            del self._sessions[session_id]
            self._mark_expired(session_id)
        return len(expired)

    def _mark_expired(self, session_id: UUID) -> None:
        if session_id in self._expired_ids:
            return
        self._expired_ids.add(session_id)
        self._expired_order.append(session_id)
        while len(self._expired_order) > MAX_EXPIRED_MARKERS:
            self._expired_ids.remove(self._expired_order.popleft())

