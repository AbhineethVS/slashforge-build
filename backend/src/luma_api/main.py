from __future__ import annotations

import asyncio
import os
import tempfile
from contextlib import asynccontextmanager, suppress
from collections.abc import Callable, Sequence
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, Header, Response, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    OpenAI,
    OpenAIError,
    RateLimitError,
)
from starlette.concurrency import run_in_threadpool
from starlette.exceptions import HTTPException as StarletteHTTPException

from luma_spikes.config import load_project_environment
from luma_spikes.citations import (
    InvalidCitationError,
    generate_grounded_answer,
)
from luma_spikes.models import Chunk, GroundedAnswer
from luma_spikes.pdf import (
    MAX_PAGES,
    MAX_PDF_BYTES,
    PDF_SIGNATURE,
    PdfSpikeError,
    extract_pdf,
)
from luma_spikes.retrieval import Embedder, OpenAIEmbedder

from .chat import SelectedIndex, answer_from_sources
from .demo_assets import BundledDemoCatalog, load_catalog
from .errors import ApiError, api_error_response
from .schemas import (
    ChatMessageResponse,
    ChatRequest,
    ErrorResponse,
    HealthResponse,
    SessionResponse,
    SourceSummary,
)
from .sessions import (
    DemoSession,
    SessionCapacityError,
    SessionExpiredError,
    SessionNotFoundError,
    SessionStore,
    utc_now,
)
from .sources import (
    MAX_EMBEDDING_BYTES_PER_SESSION,
    MAX_UPLOADED_PAGES,
    MAX_UPLOADED_SOURCES,
    SourceLimitError,
    build_uploaded_source,
)

load_project_environment()


def _pdf_api_error(error: PdfSpikeError) -> ApiError:
    details = {
        "SOURCE_TOO_LARGE": (
            status.HTTP_413_CONTENT_TOO_LARGE,
            "The PDF exceeds 20 MB.",
            "Choose a PDF smaller than 20 MB.",
        ),
        "SOURCE_PAGE_LIMIT": (
            status.HTTP_413_CONTENT_TOO_LARGE,
            "The PDF exceeds the remaining page limit for this session.",
            "Choose a shorter PDF or delete an uploaded source.",
        ),
        "SOURCE_TYPE_UNSUPPORTED": (
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "The file is not a valid PDF.",
            "Choose a digitally generated PDF.",
        ),
        "SOURCE_ENCRYPTED": (
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "Encrypted PDFs are not supported.",
            "Remove the password and upload the PDF again.",
        ),
        "SOURCE_TEXT_NOT_FOUND": (
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "This PDF does not contain enough readable text.",
            "Upload a digitally generated PDF instead.",
        ),
        "SOURCE_PROCESSING_FAILED": (
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "The PDF could not be processed.",
            "Check that the file opens normally and retry the upload.",
        ),
    }
    status_code, message, action = details.get(
        error.code,
        details["SOURCE_PROCESSING_FAILED"],
    )
    return ApiError(status_code, error.code, message, False, action)


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
    demo_catalog: BundledDemoCatalog | None = None,
    embedder_factory: Callable[[], Embedder] | None = None,
    answer_generator: (
        Callable[[str, Sequence[Chunk]], GroundedAnswer] | None
    ) = None,
) -> FastAPI:
    store = session_store or SessionStore()
    catalog = demo_catalog
    if catalog is None:
        try:
            catalog = load_catalog()
        except FileNotFoundError:
            catalog = None

    def attach_bundled_demo(session: DemoSession) -> None:
        if catalog is None:
            return
        session.sources = [catalog.source_summary()]

    def session_payload(session: DemoSession) -> SessionResponse:
        uploaded = [
            source.summary() for source in session.uploaded_sources.values()
        ]
        return SessionResponse(
            id=session.id,
            created_at=session.created_at,
            expires_at=session.expires_at,
            sources=[*session.sources, *uploaded],
            messages=session.messages,
            artifacts=session.artifacts,
            attempts=session.attempts,
            suggested_questions=(
                catalog.suggested_questions() if catalog is not None else []
            ),
        )

    def session_owns_source(session: DemoSession, source_id: UUID) -> bool:
        return source_id in session.uploaded_sources or any(
            item.get("id") == str(source_id) for item in session.sources
        )

    def create_embedder() -> Embedder:
        if embedder_factory is not None:
            return embedder_factory()
        return OpenAIEmbedder(OpenAI(timeout=60.0, max_retries=2))

    def generate_answer(
        question: str,
        chunks: Sequence[Chunk],
    ) -> GroundedAnswer:
        if answer_generator is not None:
            return answer_generator(question, chunks)
        return generate_grounded_answer(
            client=OpenAI(timeout=60.0, max_retries=1),
            model=os.getenv("OPENAI_CHAT_MODEL", "gpt-5-mini"),
            question=question,
            chunks=chunks,
        )

    def selected_indexes(
        session: DemoSession,
        source_ids: Sequence[UUID],
    ) -> list[SelectedIndex]:
        selected: list[SelectedIndex] = []
        for source_id in source_ids:
            if catalog is not None and source_id == catalog.source_id:
                selected.append(
                    SelectedIndex(
                        source_id=source_id,
                        source_name=catalog.manifest.display_name,
                        index=catalog.index,
                    )
                )
                continue
            uploaded = session.uploaded_sources.get(source_id)
            if uploaded is None:
                raise ApiError(
                    status.HTTP_404_NOT_FOUND,
                    "SOURCE_NOT_READY",
                    "A selected source is unavailable in this session.",
                    False,
                    "Select a ready source and try again.",
                )
            selected.append(
                SelectedIndex(
                    source_id=source_id,
                    source_name=uploaded.display_name,
                    index=uploaded.index,
                )
            )
        return selected

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
    application.state.demo_catalog = catalog

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
        attach_bundled_demo(session)
        return session_payload(session)

    @application.get(
        "/api/v1/session",
        response_model=SessionResponse,
        responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    )
    def get_session(
        session: DemoSession = Depends(current_session),
    ) -> SessionResponse:
        return session_payload(session)

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

    @application.get("/api/v1/sources", response_model=list[SourceSummary])
    def list_sources(
        session: DemoSession = Depends(current_session),
    ) -> list[SourceSummary]:
        return session_payload(session).sources

    @application.post(
        "/api/v1/sources",
        response_model=SourceSummary,
        status_code=status.HTTP_201_CREATED,
        responses={
            409: {"model": ErrorResponse},
            413: {"model": ErrorResponse},
            415: {"model": ErrorResponse},
            422: {"model": ErrorResponse},
            429: {"model": ErrorResponse},
            503: {"model": ErrorResponse},
        },
    )
    async def upload_source(
        file: UploadFile,
        session: DemoSession = Depends(current_session),
    ) -> dict[str, object]:
        if file.content_type != "application/pdf":
            raise ApiError(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                "SOURCE_TYPE_UNSUPPORTED",
                "Only PDF uploads are supported.",
                False,
                "Choose a digitally generated PDF.",
            )
        if len(session.uploaded_sources) >= MAX_UPLOADED_SOURCES:
            raise ApiError(
                status.HTTP_409_CONFLICT,
                "REQUEST_RATE_LIMITED",
                "This session already has two uploaded sources.",
                False,
                "Delete an uploaded source before adding another.",
            )
        if session.upload_in_progress:
            raise ApiError(
                status.HTTP_409_CONFLICT,
                "REQUEST_RATE_LIMITED",
                "Another source is already being processed.",
                True,
                "Wait for the current upload to finish and try again.",
            )

        session.upload_in_progress = True
        source_id = uuid4()
        display_name = Path((file.filename or "upload.pdf").replace("\\", "/")).name
        display_name = display_name[:255] or "upload.pdf"
        if session.temporary_directory is None:
            session.temporary_directory = Path(tempfile.mkdtemp(prefix="luma-upload-"))
        file_path = session.temporary_directory / f"{uuid4()}.pdf"

        try:
            size = 0
            signature = b""
            with file_path.open("wb") as stream:
                while data := await file.read(64 * 1024):
                    if not signature:
                        signature = data[: len(PDF_SIGNATURE)]
                    size += len(data)
                    if size > MAX_PDF_BYTES:
                        raise ApiError(
                            status.HTTP_413_CONTENT_TOO_LARGE,
                            "SOURCE_TOO_LARGE",
                            "The PDF exceeds 20 MB.",
                            False,
                            "Choose a PDF smaller than 20 MB.",
                        )
                    stream.write(data)

            if signature != PDF_SIGNATURE:
                raise ApiError(
                    status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    "SOURCE_TYPE_UNSUPPORTED",
                    "The file is not a valid PDF.",
                    False,
                    "Choose a digitally generated PDF.",
                )

            pages_used = sum(
                source.page_count for source in session.uploaded_sources.values()
            )
            remaining_pages = MAX_UPLOADED_PAGES - pages_used
            if remaining_pages <= 0:
                raise ApiError(
                    status.HTTP_413_CONTENT_TOO_LARGE,
                    "SOURCE_PAGE_LIMIT",
                    "This session has reached its 100 uploaded-page limit.",
                    False,
                    "Delete an uploaded source before adding another.",
                )

            document = await run_in_threadpool(
                extract_pdf,
                file_path,
                max_pages=min(MAX_PAGES, remaining_pages),
            )
            uploaded = await run_in_threadpool(
                build_uploaded_source,
                source_id=source_id,
                display_name=display_name,
                file_path=file_path,
                mime_type=file.content_type,
                size_bytes=size,
                document=document,
                embedder=create_embedder(),
            )
            embedding_bytes = uploaded.index.matrix.nbytes + sum(
                source.index.matrix.nbytes
                for source in session.uploaded_sources.values()
            )
            if embedding_bytes > MAX_EMBEDDING_BYTES_PER_SESSION:
                raise SourceLimitError(
                    "The uploaded sources exceed this session's search-memory limit.",
                    "Delete an uploaded source or choose a shorter PDF.",
                )
            session.uploaded_sources[source_id] = uploaded
            return uploaded.summary()
        except ApiError:
            file_path.unlink(missing_ok=True)
            raise
        except PdfSpikeError as error:
            file_path.unlink(missing_ok=True)
            raise _pdf_api_error(error) from error
        except SourceLimitError as error:
            file_path.unlink(missing_ok=True)
            raise ApiError(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                "SOURCE_PROCESSING_FAILED",
                str(error),
                False,
                error.action,
            ) from error
        except RateLimitError as error:
            file_path.unlink(missing_ok=True)
            raise ApiError(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "AI_RATE_LIMITED",
                "The embedding service is temporarily busy.",
                True,
                "Wait a moment and retry this upload.",
            ) from error
        except AuthenticationError as error:
            file_path.unlink(missing_ok=True)
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "AI_BILLING_UNAVAILABLE",
                "PDF indexing is temporarily unavailable.",
                False,
                "Use the bundled demo source or contact the demo owner.",
            ) from error
        except (APIConnectionError, APITimeoutError, APIStatusError) as error:
            file_path.unlink(missing_ok=True)
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "SOURCE_PROCESSING_FAILED",
                "The PDF could not be indexed right now.",
                True,
                "Retry the upload in a moment.",
            ) from error
        except OpenAIError as error:
            file_path.unlink(missing_ok=True)
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "SOURCE_PROCESSING_FAILED",
                "PDF indexing is temporarily unavailable.",
                True,
                "Use the bundled demo source or retry later.",
            ) from error
        finally:
            session.upload_in_progress = False
            await file.close()

    @application.delete(
        "/api/v1/sources/{source_id}",
        status_code=status.HTTP_204_NO_CONTENT,
        responses={404: {"model": ErrorResponse}},
    )
    def delete_source(
        source_id: UUID,
        session: DemoSession = Depends(current_session),
    ) -> Response:
        source = session.uploaded_sources.pop(source_id, None)
        if source is None:
            raise ApiError(
                status.HTTP_404_NOT_FOUND,
                "SOURCE_NOT_READY",
                "The uploaded source was not found in this session.",
                False,
                "Refresh the workspace and try again.",
            )
        source.file_path.unlink(missing_ok=True)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @application.get("/api/v1/chat/messages")
    def list_chat_messages(
        session: DemoSession = Depends(current_session),
    ) -> list[dict[str, object]]:
        return session.messages

    @application.post(
        "/api/v1/chat/messages",
        response_model=ChatMessageResponse,
        responses={
            404: {"model": ErrorResponse},
            409: {"model": ErrorResponse},
            429: {"model": ErrorResponse},
            502: {"model": ErrorResponse},
            503: {"model": ErrorResponse},
        },
    )
    def create_chat_message(
        request: ChatRequest,
        session: DemoSession = Depends(current_session),
    ) -> ChatMessageResponse:
        if not session.generation_lock.acquire(blocking=False):
            raise ApiError(
                status.HTTP_409_CONFLICT,
                "REQUEST_RATE_LIMITED",
                "Another answer is already being generated.",
                True,
                "Wait for the current answer to finish and try again.",
            )
        try:
            sources = selected_indexes(session, request.source_ids)
            result = answer_from_sources(
                question=request.question,
                sources=sources,
                embedder=create_embedder(),
                generate=generate_answer,
            )
            created_at = utc_now()
            session.messages.append(
                {
                    "id": str(uuid4()),
                    "role": "user",
                    "content_markdown": request.question,
                    "citations": [],
                    "status": "complete",
                    "created_at": created_at,
                }
            )
            response = ChatMessageResponse(
                id=uuid4(),
                role="assistant",
                content_markdown=result.answer.answer_markdown,
                citations=[
                    citation.model_dump(mode="json")
                    for citation in result.citations
                ],
                insufficient_evidence=result.answer.insufficient_evidence,
                follow_up_questions=result.answer.follow_up_questions,
                status="complete",
                created_at=created_at,
            )
            session.messages.append(response.model_dump(mode="json"))
            return response
        except ApiError:
            raise
        except RateLimitError as error:
            raise ApiError(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "AI_RATE_LIMITED",
                "The answer service is temporarily busy.",
                True,
                "Wait a moment and ask again.",
            ) from error
        except AuthenticationError as error:
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "AI_BILLING_UNAVAILABLE",
                "Grounded answers are temporarily unavailable.",
                False,
                "Keep using the bundled material or contact the demo owner.",
            ) from error
        except (APIConnectionError, APITimeoutError, APIStatusError) as error:
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "AI_OUTPUT_INVALID",
                "The answer service could not be reached.",
                True,
                "Retry the question in a moment.",
            ) from error
        except (InvalidCitationError, ValueError) as error:
            raise ApiError(
                status.HTTP_502_BAD_GATEWAY,
                "AI_OUTPUT_INVALID",
                "The grounded answer could not be validated.",
                True,
                "Retry the question.",
            ) from error
        except OpenAIError as error:
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "AI_OUTPUT_INVALID",
                "Grounded answers are temporarily unavailable.",
                True,
                "Retry the question later.",
            ) from error
        finally:
            session.generation_lock.release()

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
                    status.HTTP_413_CONTENT_TOO_LARGE,
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

    @application.get("/api/v1/sources/{source_id}/file")
    def get_source_file(
        source_id: UUID,
        session: DemoSession = Depends(current_session),
    ) -> FileResponse:
        uploaded = session.uploaded_sources.get(source_id)
        if uploaded is not None:
            return FileResponse(
                uploaded.file_path,
                media_type=uploaded.mime_type,
                filename=uploaded.display_name,
            )
        if catalog is None or not session_owns_source(session, source_id):
            raise ApiError(
                status.HTTP_404_NOT_FOUND,
                "SOURCE_NOT_READY",
                "The requested source is not available in this session.",
                False,
                "Select a ready source and try again.",
            )
        if source_id != catalog.source_id:
            raise ApiError(
                status.HTTP_404_NOT_FOUND,
                "SOURCE_NOT_READY",
                "The requested source is not available in this session.",
                False,
                "Select a ready source and try again.",
            )
        return FileResponse(
            catalog.pdf_path,
            media_type="application/pdf",
            filename=catalog.manifest.display_name,
        )

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

