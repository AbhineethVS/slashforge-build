from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager, suppress
from pathlib import Path
from uuid import UUID

from fastapi import Depends, FastAPI, Header, Response, UploadFile, status
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.staticfiles import StaticFiles

from luma_spikes.config import load_project_environment
from luma_spikes.pdf import MAX_PDF_BYTES, PDF_SIGNATURE

from .errors import ApiError, api_error_response
from .schemas import ErrorResponse, HealthResponse, SessionResponse
from .sessions import (
    DemoSession,
    SessionCapacityError,
    SessionExpiredError,
    SessionNotFoundError,
    SessionStore,
)

load_project_environment()


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as error:
            if error.status_code != status.HTTP_404_NOT_FOUND:
                raise
            return await super().get_response("index.html", scope)


def create_app(
    *,
    session_store: SessionStore | None = None,
    frontend_dist: Path | None = None,
) -> FastAPI:
    store = session_store or SessionStore()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        async def cleanup_sessions() -> None:
            while True:
                await asyncio.sleep(60)
                store.cleanup_expired()

        cleanup_task = asyncio.create_task(cleanup_sessions())
        try:
            yield
        finally:
            cleanup_task.cancel()
            with suppress(asyncio.CancelledError):
                await cleanup_task

    application = FastAPI(title="LUMA", version="0.1.0", lifespan=lifespan)
    application.add_exception_handler(ApiError, api_error_response)
    application.state.session_store = store

    def current_session(
        x_session_id: str | None = Header(default=None, alias="X-Session-ID"),
    ) -> DemoSession:
        if not x_session_id:
            raise ApiError(
                status.HTTP_400_BAD_REQUEST,
                "SESSION_NOT_FOUND",
                "A temporary session is required.",
                False,
                "Start a new study session.",
            )
        try:
            session_id = UUID(x_session_id)
            return store.get(session_id)
        except (ValueError, SessionNotFoundError) as error:
            raise ApiError(
                status.HTTP_404_NOT_FOUND,
                "SESSION_NOT_FOUND",
                "The temporary session was not found.",
                False,
                "Start a new study session.",
            ) from error
        except SessionExpiredError as error:
            raise ApiError(
                status.HTTP_410_GONE,
                "SESSION_EXPIRED",
                "The temporary session expired.",
                False,
                "Start a new study session.",
            ) from error

    @application.get("/api/v1/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            openai_configured=bool(os.getenv("OPENAI_API_KEY")),
        )

    @application.post(
        "/api/v1/session",
        response_model=SessionResponse,
        status_code=status.HTTP_201_CREATED,
        responses={429: {"model": ErrorResponse}},
    )
    def create_session() -> SessionResponse:
        try:
            session = store.create()
        except SessionCapacityError as error:
            raise ApiError(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "REQUEST_RATE_LIMITED",
                "The demo is temporarily at capacity.",
                True,
                "Wait a moment and try again.",
            ) from error
        return SessionResponse.model_validate(session, from_attributes=True)

    @application.get(
        "/api/v1/session",
        response_model=SessionResponse,
        responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    )
    def get_session(
        session: DemoSession = Depends(current_session),
    ) -> SessionResponse:
        return SessionResponse.model_validate(session, from_attributes=True)

    @application.delete(
        "/api/v1/session",
        status_code=status.HTTP_204_NO_CONTENT,
        responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    )
    def delete_session(
        session: DemoSession = Depends(current_session),
    ) -> Response:
        store.delete(session.id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @application.post("/api/v1/spike/upload")
    async def upload_spike(
        file: UploadFile,
        _: DemoSession = Depends(current_session),
    ) -> dict[str, str | int]:
        if file.content_type != "application/pdf":
            raise ApiError(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                "SOURCE_TYPE_UNSUPPORTED",
                "Only PDF uploads are supported.",
                False,
                "Choose a digitally generated PDF.",
            )

        size = 0
        signature = b""
        while data := await file.read(64 * 1024):
            if not signature:
                signature = data[: len(PDF_SIGNATURE)]
            size += len(data)
            if size > MAX_PDF_BYTES:
                raise ApiError(
                    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    "SOURCE_TOO_LARGE",
                    "The PDF exceeds 20 MB.",
                    False,
                    "Choose a PDF smaller than 20 MB.",
                )

        if signature != PDF_SIGNATURE:
            raise ApiError(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                "SOURCE_TYPE_UNSUPPORTED",
                "The file is not a valid PDF.",
                False,
                "Choose a digitally generated PDF.",
            )

        display_name = Path((file.filename or "upload.pdf").replace("\\", "/")).name
        return {
            "filename": display_name,
            "size_bytes": size,
            "status": "accepted",
        }

    default_frontend_dist = Path(__file__).resolve().parents[3] / "frontend" / "dist"
    resolved_frontend_dist = frontend_dist or Path(
        os.getenv("LUMA_FRONTEND_DIST", default_frontend_dist)
    )
    if resolved_frontend_dist.is_dir():
        application.mount(
            "/",
            SPAStaticFiles(directory=resolved_frontend_dist, html=True),
            name="frontend",
        )
    return application


app = create_app()

