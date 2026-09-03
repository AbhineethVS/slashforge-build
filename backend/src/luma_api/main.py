from __future__ import annotations

import asyncio
import os
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

from .artifacts import (
    ArtifactKind,
    InvalidArtifactError,
    RawArtifact,
    generate_raw_artifact,
    materialize_artifact,
    retrieve_artifact_chunks,
)
from .audio_overview import (
    RawAudioOverview,
    generate_raw_audio_overview,
    materialize_audio_overview,
    retrieve_audio_overview_chunks,
)
from .chat import SelectedIndex, answer_from_sources
from .demo_assets import BundledDemoCatalog, load_catalog
from .errors import ApiError, api_error_response
from .learning import (
    AttemptRequest,
    AttemptResponse,
    ProgressResponse,
    RawTeachBack,
    TeachBackRequest,
    build_progress,
    generate_raw_teach_back,
    materialize_teach_back,
    record_quiz_attempt,
    record_teach_back_attempt,
    retrieve_teach_back_chunks,
)
from .memory import build_learning_memory, overlay_follow_up_questions
from .schemas import (
    ChatMessageResponse,
    ChatRequest,
    ErrorResponse,
    HealthResponse,
    ArtifactRequest,
    ArtifactResponse,
    AudioClipResponse,
    SessionResponse,
    SourceSummary,
    NarrationResponse,
    TranscriptionResponse,
)
from .sessions import (
    DemoSession,
    MAX_VOICE_REQUESTS_PER_SESSION,
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
from .voice import (
    MAX_AUDIO_UPLOAD_BYTES,
    SUPPORTED_AUDIO_TYPES,
    SarvamVoiceService,
    StoredNarration,
    VoiceBusyError,
    VoiceLimitError,
    VoiceProvider,
    VoiceProviderError,
    narration_text,
    store_narration,
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


def _voice_api_error(error: Exception) -> ApiError:
    if isinstance(error, VoiceBusyError):
        return ApiError(
            status.HTTP_409_CONFLICT,
            "REQUEST_RATE_LIMITED",
            "Another voice request is already running.",
            True,
            "Wait for it to finish and try again.",
        )
    if isinstance(error, VoiceLimitError):
        return ApiError(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "VOICE_USAGE_LIMIT",
            str(error),
            False,
            "Reset the temporary session or continue with text.",
        )
    if isinstance(error, VoiceProviderError):
        return ApiError(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            (
                "VOICE_NOT_CONFIGURED"
                if error.unavailable
                else "VOICE_PROCESSING_FAILED"
            ),
            "Voice processing is temporarily unavailable.",
            error.retryable,
            "Continue with text or retry voice in a moment.",
        )
    return ApiError(
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        "VOICE_PROCESSING_FAILED",
        str(error),
        False,
        "Continue with text or try a clearer recording.",
    )


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
    artifact_generator: (
        Callable[[ArtifactKind, Sequence[Chunk]], RawArtifact] | None
    ) = None,
    teach_back_generator: (
        Callable[[str, str, Sequence[Chunk]], RawTeachBack] | None
    ) = None,
    audio_overview_generator: (
        Callable[[Sequence[Chunk]], RawAudioOverview] | None
    ) = None,
    voice_provider: VoiceProvider | None = None,
) -> FastAPI:
    store = session_store or SessionStore()
    catalog = demo_catalog
    if catalog is None:
        try:
            catalog = load_catalog()
        except FileNotFoundError:
            catalog = None
    configured_voice_provider = voice_provider
    if configured_voice_provider is None and os.getenv("SARVAM_API_KEY"):
        configured_voice_provider = SarvamVoiceService(
            os.environ["SARVAM_API_KEY"]
        )

    def attach_bundled_demo(session: DemoSession) -> None:
        if catalog is None:
            return
        session.sources = [catalog.source_summary()]

    def session_payload(session: DemoSession) -> SessionResponse:
        uploaded = [
            source.summary() for source in session.uploaded_sources.values()
        ]
        default_suggestions = (
            catalog.suggested_questions() if catalog is not None else []
        )
        memory = build_learning_memory(
            session,
            default_suggestions=default_suggestions,
        )
        return SessionResponse(
            id=session.id,
            created_at=session.created_at,
            expires_at=session.expires_at,
            sources=[*session.sources, *uploaded],
            messages=session.messages,
            artifacts=session.artifacts,
            attempts=session.attempts,
            suggested_questions=memory.suggested_questions or default_suggestions,
            learning_memory=memory,
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

    def generate_artifact(
        kind: ArtifactKind,
        chunks: Sequence[Chunk],
    ) -> RawArtifact:
        if artifact_generator is not None:
            return artifact_generator(kind, chunks)
        return generate_raw_artifact(
            client=OpenAI(timeout=90.0, max_retries=1),
            model=os.getenv("OPENAI_CHAT_MODEL", "gpt-5-mini"),
            kind=kind,
            chunks=chunks,
        )

    def generate_teach_back(
        concept: str,
        explanation: str,
        chunks: Sequence[Chunk],
    ) -> RawTeachBack:
        if teach_back_generator is not None:
            return teach_back_generator(concept, explanation, chunks)
        return generate_raw_teach_back(
            client=OpenAI(timeout=90.0, max_retries=1),
            model=os.getenv("OPENAI_CHAT_MODEL", "gpt-5-mini"),
            concept=concept,
            explanation=explanation,
            chunks=chunks,
        )

    def generate_audio_overview(
        chunks: Sequence[Chunk],
    ) -> RawAudioOverview:
        if audio_overview_generator is not None:
            return audio_overview_generator(chunks)
        return generate_raw_audio_overview(
            client=OpenAI(timeout=120.0, max_retries=1),
            model=os.getenv("OPENAI_AUDIO_OVERVIEW_MODEL", "gpt-5"),
            chunks=chunks,
        )

    def require_voice_provider() -> VoiceProvider:
        if configured_voice_provider is None:
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "VOICE_NOT_CONFIGURED",
                "Voice features are not configured.",
                False,
                "Add SARVAM_API_KEY on the server or continue with text.",
            )
        return configured_voice_provider

    def narration_response(stored: StoredNarration) -> NarrationResponse:
        return NarrationResponse(
            resource_id=stored.resource_id,
            clips=[
                AudioClipResponse(
                    id=asset.id,
                    url=f"/api/v1/audio/{asset.id}",
                    mime_type=asset.mime_type,
                    sequence=asset.sequence,
                    section_index=asset.section_index,
                )
                for asset in stored.assets
            ],
        )

    def cached_demo_artifact(
        *,
        kind: ArtifactKind,
        request: ArtifactRequest,
        session: DemoSession,
    ) -> ArtifactResponse | None:
        if (
            catalog is None
            or request.source_ids != [catalog.source_id]
        ):
            return None
        cached = catalog.fallback_artifact(kind)
        if cached is None:
            return None
        artifact = ArtifactResponse(
            id=uuid4(),
            type=kind,
            title=str(cached["title"]),
            content=dict(cached["content"]),
            source_ids=request.source_ids,
            created_at=utc_now(),
        )
        session.artifacts.append(artifact.model_dump(mode="json"))
        return artifact

    def create_studio_artifact(
        *,
        kind: ArtifactKind,
        request: ArtifactRequest,
        session: DemoSession,
    ) -> ArtifactResponse:
        if not session.generation_lock.acquire(blocking=False):
            raise ApiError(
                status.HTTP_409_CONFLICT,
                "REQUEST_RATE_LIMITED",
                "Another AI task is already running.",
                True,
                "Wait for it to finish and try again.",
            )
        try:
            sources = selected_indexes(session, request.source_ids)
            chunks = retrieve_artifact_chunks(
                kind=kind,
                sources=sources,
                embedder=create_embedder(),
            )
            title: str | None = None
            content: dict | None = None
            last_error: InvalidArtifactError | None = None
            for _ in range(2):
                raw = generate_artifact(kind, chunks)
                try:
                    title, content = materialize_artifact(
                        kind=kind,
                        raw=raw,
                        chunks=chunks,
                        sources=sources,
                    )
                    break
                except InvalidArtifactError as error:
                    last_error = error
            if title is None or content is None:
                raise last_error or InvalidArtifactError(
                    "The artifact could not be validated."
                )
            artifact = ArtifactResponse(
                id=uuid4(),
                type=kind,
                title=title,
                content=content,
                source_ids=request.source_ids,
                created_at=utc_now(),
            )
            session.artifacts.append(artifact.model_dump(mode="json"))
            return artifact
        except ApiError:
            raise
        except RateLimitError as error:
            cached = cached_demo_artifact(
                kind=kind, request=request, session=session
            )
            if cached is not None:
                return cached
            raise ApiError(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "AI_RATE_LIMITED",
                "Studio generation is temporarily busy.",
                True,
                "Wait a moment and try again.",
            ) from error
        except AuthenticationError as error:
            cached = cached_demo_artifact(
                kind=kind, request=request, session=session
            )
            if cached is not None:
                return cached
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "AI_BILLING_UNAVAILABLE",
                "Studio generation is temporarily unavailable.",
                False,
                "Use existing study material or contact the demo owner.",
            ) from error
        except (APIConnectionError, APITimeoutError, APIStatusError) as error:
            cached = cached_demo_artifact(
                kind=kind, request=request, session=session
            )
            if cached is not None:
                return cached
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "AI_OUTPUT_INVALID",
                "The Studio service could not be reached.",
                True,
                "Retry generation in a moment.",
            ) from error
        except (InvalidArtifactError, ValueError) as error:
            cached = cached_demo_artifact(
                kind=kind, request=request, session=session
            )
            if cached is not None:
                return cached
            raise ApiError(
                status.HTTP_502_BAD_GATEWAY,
                "AI_OUTPUT_INVALID",
                "The generated study tool could not be validated.",
                True,
                "Generate it again.",
            ) from error
        except OpenAIError as error:
            cached = cached_demo_artifact(
                kind=kind, request=request, session=session
            )
            if cached is not None:
                return cached
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "AI_OUTPUT_INVALID",
                "Studio generation is temporarily unavailable.",
                True,
                "Retry generation later.",
            ) from error
        finally:
            session.generation_lock.release()

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
            store.cleanup_all()

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
            speech_configured=configured_voice_provider is not None,
        )

    @application.post(
        "/api/v1/voice/transcriptions",
        response_model=TranscriptionResponse,
    )
    async def transcribe_voice(
        file: UploadFile,
        session: DemoSession = Depends(current_session),
    ) -> TranscriptionResponse:
        content_type = (file.content_type or "").split(";", 1)[0].lower()
        if content_type not in SUPPORTED_AUDIO_TYPES:
            await file.close()
            raise ApiError(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                "VOICE_UNSUPPORTED",
                "This recording format is not supported.",
                False,
                "Use a browser that records WebM, MP4, OGG, MP3, or WAV audio.",
            )
        if not session.voice_lock.acquire(blocking=False):
            await file.close()
            raise _voice_api_error(
                VoiceBusyError("Another voice request is already running.")
            )
        try:
            if session.voice_request_count >= MAX_VOICE_REQUESTS_PER_SESSION:
                raise VoiceLimitError(
                    "This session reached its voice request limit."
                )
            audio = bytearray()
            while chunk := await file.read(64 * 1024):
                audio.extend(chunk)
                if len(audio) > MAX_AUDIO_UPLOAD_BYTES:
                    raise ApiError(
                        status.HTTP_413_CONTENT_TOO_LARGE,
                        "AUDIO_TOO_LARGE",
                        "The recording is too large.",
                        False,
                        "Record for no more than 30 seconds and try again.",
                    )
            if not audio:
                raise ApiError(
                    status.HTTP_422_UNPROCESSABLE_CONTENT,
                    "TRANSCRIPT_EMPTY",
                    "No audio was received.",
                    False,
                    "Record a short explanation and try again.",
                )
            session.voice_request_count += 1
            filename = Path((file.filename or "recording.webm").replace("\\", "/")).name
            transcript, language_code = await require_voice_provider().transcribe(
                audio=bytes(audio),
                filename=filename[:120],
                content_type=content_type,
            )
            if not transcript:
                raise ApiError(
                    status.HTTP_422_UNPROCESSABLE_CONTENT,
                    "TRANSCRIPT_EMPTY",
                    "No clear speech was detected.",
                    False,
                    "Try again in a quieter place or continue by typing.",
                )
            return TranscriptionResponse(
                transcript=transcript[:4_000],
                language_code=language_code,
            )
        except ApiError:
            raise
        except (VoiceProviderError, VoiceLimitError) as error:
            raise _voice_api_error(error) from error
        finally:
            session.voice_lock.release()
            await file.close()

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
        file_path = session.ensure_temporary_directory() / f"{uuid4()}.pdf"

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
            default_suggestions = (
                catalog.suggested_questions() if catalog is not None else []
            )
            memory = build_learning_memory(
                session,
                default_suggestions=default_suggestions,
            )
            follow_ups = overlay_follow_up_questions(
                memory,
                list(result.answer.follow_up_questions),
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
                follow_up_questions=follow_ups,
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

    @application.post(
        "/api/v1/studio/summary",
        response_model=ArtifactResponse,
    )
    def create_summary(
        request: ArtifactRequest,
        session: DemoSession = Depends(current_session),
    ) -> ArtifactResponse:
        return create_studio_artifact(
            kind="summary",
            request=request,
            session=session,
        )

    @application.post(
        "/api/v1/studio/flashcards",
        response_model=ArtifactResponse,
    )
    def create_flashcards(
        request: ArtifactRequest,
        session: DemoSession = Depends(current_session),
    ) -> ArtifactResponse:
        return create_studio_artifact(
            kind="flashcards",
            request=request,
            session=session,
        )

    @application.post(
        "/api/v1/studio/quiz",
        response_model=ArtifactResponse,
    )
    def create_quiz(
        request: ArtifactRequest,
        session: DemoSession = Depends(current_session),
    ) -> ArtifactResponse:
        return create_studio_artifact(
            kind="quiz",
            request=request,
            session=session,
        )

    @application.post(
        "/api/v1/studio/teach-back",
        response_model=ArtifactResponse,
    )
    def create_teach_back(
        request: TeachBackRequest,
        session: DemoSession = Depends(current_session),
    ) -> ArtifactResponse:
        if not session.generation_lock.acquire(blocking=False):
            raise ApiError(
                status.HTTP_409_CONFLICT,
                "REQUEST_RATE_LIMITED",
                "Another AI task is already running.",
                True,
                "Wait for it to finish and try again.",
            )
        try:
            sources = selected_indexes(session, request.source_ids)
            chunks = retrieve_teach_back_chunks(
                concept=request.concept,
                sources=sources,
                embedder=create_embedder(),
            )
            title: str | None = None
            content: dict | None = None
            last_error: InvalidArtifactError | None = None
            for _ in range(2):
                raw = generate_teach_back(
                    request.concept,
                    request.explanation,
                    chunks,
                )
                try:
                    title, content = materialize_teach_back(
                        raw=raw,
                        chunks=chunks,
                        sources=sources,
                    )
                    break
                except InvalidArtifactError as error:
                    last_error = error
            if title is None or content is None:
                raise last_error or InvalidArtifactError(
                    "Teach-Back feedback could not be validated."
                )
            artifact = ArtifactResponse(
                id=uuid4(),
                type="teach_back",
                title=title,
                content={
                    **content,
                    "concept": request.concept,
                },
                source_ids=request.source_ids,
                created_at=utc_now(),
            )
            session.artifacts.append(artifact.model_dump(mode="json"))
            record_teach_back_attempt(
                session=session,
                artifact_id=artifact.id,
                concept=request.concept,
                explanation=request.explanation,
                content=artifact.content,
            )
            return artifact
        except ApiError:
            raise
        except RateLimitError as error:
            raise ApiError(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "AI_RATE_LIMITED",
                "Teach-Back is temporarily busy.",
                True,
                "Wait a moment and try again.",
            ) from error
        except AuthenticationError as error:
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "AI_BILLING_UNAVAILABLE",
                "Teach-Back is temporarily unavailable.",
                False,
                "Keep using cached demo tools or contact the demo owner.",
            ) from error
        except (APIConnectionError, APITimeoutError, APIStatusError) as error:
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "AI_OUTPUT_INVALID",
                "Teach-Back could not reach the AI service.",
                True,
                "Retry your explanation in a moment.",
            ) from error
        except (InvalidArtifactError, ValueError) as error:
            raise ApiError(
                status.HTTP_502_BAD_GATEWAY,
                "AI_OUTPUT_INVALID",
                "Teach-Back feedback could not be validated.",
                True,
                "Try the explanation again.",
            ) from error
        except OpenAIError as error:
            raise ApiError(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "AI_OUTPUT_INVALID",
                "Teach-Back is temporarily unavailable.",
                True,
                "Retry later.",
            ) from error
        finally:
            session.generation_lock.release()

    @application.post(
        "/api/v1/artifacts/{artifact_id}/attempts",
        response_model=AttemptResponse,
    )
    def create_attempt(
        artifact_id: UUID,
        request: AttemptRequest,
        session: DemoSession = Depends(current_session),
    ) -> AttemptResponse:
        try:
            return record_quiz_attempt(
                session=session,
                artifact_id=artifact_id,
                request=request,
            )
        except LookupError as error:
            raise ApiError(
                status.HTTP_404_NOT_FOUND,
                "SOURCE_NOT_READY",
                str(error),
                False,
                "Return to Studio and open an available quiz.",
            ) from error

    @application.get(
        "/api/v1/studio/progress",
        response_model=ProgressResponse,
    )
    def get_progress(
        session: DemoSession = Depends(current_session),
    ) -> ProgressResponse:
        default_suggestions = (
            catalog.suggested_questions() if catalog is not None else []
        )
        return build_progress(
            session,
            default_suggestions=default_suggestions,
        )

    @application.post(
        "/api/v1/chat/messages/{message_id}/audio",
        response_model=NarrationResponse,
    )
    async def narrate_chat_message(
        message_id: UUID,
        session: DemoSession = Depends(current_session),
    ) -> NarrationResponse:
        message = next(
            (
                item
                for item in session.messages
                if item.get("id") == str(message_id)
                and item.get("role") == "assistant"
            ),
            None,
        )
        if message is None:
            raise ApiError(
                status.HTTP_404_NOT_FOUND,
                "VOICE_RESOURCE_NOT_FOUND",
                "The answer is not available in this session.",
                False,
                "Choose an available grounded answer.",
            )
        try:
            stored = await store_narration(
                session=session,
                resource_id=message_id,
                texts=[str(message.get("content_markdown", ""))],
                provider=require_voice_provider(),
            )
            return narration_response(stored)
        except ApiError:
            raise
        except (VoiceBusyError, VoiceLimitError, VoiceProviderError, ValueError) as error:
            raise _voice_api_error(error) from error

    @application.post(
        "/api/v1/artifacts/{artifact_id}/audio",
        response_model=NarrationResponse,
    )
    async def narrate_artifact(
        artifact_id: UUID,
        session: DemoSession = Depends(current_session),
    ) -> NarrationResponse:
        artifact = next(
            (
                item
                for item in session.artifacts
                if item.get("id") == str(artifact_id)
            ),
            None,
        )
        if artifact is None or artifact.get("type") not in {
            "teach_back",
            "audio_overview",
        }:
            raise ApiError(
                status.HTTP_404_NOT_FOUND,
                "VOICE_RESOURCE_NOT_FOUND",
                "The narrated study tool is not available in this session.",
                False,
                "Choose an available Teach-Back or Audio Overview.",
            )
        content = artifact.get("content", {})
        if artifact.get("type") == "audio_overview":
            sections = content.get("sections", [])
            texts = [str(section.get("transcript", "")) for section in sections]
            section_indexes: list[int | None] = list(range(len(texts)))
        else:
            def point_text(group: str) -> str:
                points = content.get(group, [])
                return " ".join(str(point.get("text", "")) for point in points)

            texts = [
                (
                    "Here is your formative Teach Back feedback. "
                    f"Covered: {point_text('covered') or 'No rubric point was clearly covered yet.'} "
                    f"Missing: {point_text('missing') or 'No important omission was identified.'} "
                    f"Check this idea: {point_text('check_this') or 'No conflicting claim was identified.'} "
                    f"Try next: {content.get('next_prompt', '')}"
                )
            ]
            section_indexes = [None]
        try:
            stored = await store_narration(
                session=session,
                resource_id=artifact_id,
                texts=texts,
                section_indexes=section_indexes,
                provider=require_voice_provider(),
            )
            if artifact.get("type") == "audio_overview":
                for section in content.get("sections", []):
                    section["audio_clip_ids"] = []
                for asset in stored.assets:
                    if asset.section_index is not None:
                        content["sections"][asset.section_index][
                            "audio_clip_ids"
                        ].append(str(asset.id))
                content["audio_status"] = "ready"
            return narration_response(stored)
        except ApiError:
            raise
        except (VoiceBusyError, VoiceLimitError, VoiceProviderError, ValueError) as error:
            if artifact.get("type") == "audio_overview":
                content["audio_status"] = "unavailable"
            raise _voice_api_error(error) from error

    @application.get("/api/v1/audio/{audio_id}")
    def get_audio(
        audio_id: UUID,
        session: DemoSession = Depends(current_session),
    ) -> FileResponse:
        asset = session.audio_assets.get(audio_id)
        if asset is None or not asset.path.is_file():
            raise ApiError(
                status.HTTP_404_NOT_FOUND,
                "VOICE_RESOURCE_NOT_FOUND",
                "This temporary audio clip is unavailable.",
                False,
                "Regenerate the narration or continue with the transcript.",
            )
        return FileResponse(
            asset.path,
            media_type=asset.mime_type,
            filename=f"luma-{asset.sequence + 1}.mp3",
        )

    @application.post(
        "/api/v1/studio/audio-overview",
        response_model=ArtifactResponse,
    )
    async def create_audio_overview(
        request: ArtifactRequest,
        session: DemoSession = Depends(current_session),
    ) -> ArtifactResponse:
        if not session.generation_lock.acquire(blocking=False):
            raise ApiError(
                status.HTTP_409_CONFLICT,
                "REQUEST_RATE_LIMITED",
                "Another AI task is already running.",
                True,
                "Wait for it to finish and try again.",
            )
        stored_artifact: dict[str, object] | None = None
        try:
            sources = selected_indexes(session, request.source_ids)
            chunks = await run_in_threadpool(
                retrieve_audio_overview_chunks,
                sources=sources,
                embedder=create_embedder(),
            )
            title: str | None = None
            content: dict[str, object] | None = None
            for _ in range(2):
                raw = await run_in_threadpool(generate_audio_overview, chunks)
                try:
                    title, content = materialize_audio_overview(
                        raw=raw,
                        chunks=chunks,
                        sources=sources,
                    )
                    break
                except InvalidArtifactError:
                    continue
            if title is None or content is None:
                raise InvalidArtifactError(
                    "The audio overview could not be validated."
                )
            artifact = ArtifactResponse(
                id=uuid4(),
                type="audio_overview",
                title=title,
                content=content,
                source_ids=request.source_ids,
                created_at=utc_now(),
            )
            stored_artifact = artifact.model_dump(mode="json")
            session.artifacts.append(stored_artifact)
        except (OpenAIError, InvalidArtifactError, ValueError) as error:
            cached = (
                catalog.fallback_artifact("audio_overview")
                if catalog is not None
                and request.source_ids == [catalog.source_id]
                else None
            )
            if cached is None:
                raise ApiError(
                    status.HTTP_503_SERVICE_UNAVAILABLE,
                    "AI_OUTPUT_INVALID",
                    "The grounded audio overview could not be generated.",
                    True,
                    "Retry later or continue with another Studio tool.",
                ) from error
            artifact = ArtifactResponse(
                id=uuid4(),
                type="audio_overview",
                title=str(cached["title"]),
                content=dict(cached["content"]),
                source_ids=request.source_ids,
                created_at=utc_now(),
            )
            stored_artifact = artifact.model_dump(mode="json")
            session.artifacts.append(stored_artifact)
        finally:
            session.generation_lock.release()

        assert stored_artifact is not None
        artifact_id = UUID(str(stored_artifact["id"]))
        content = stored_artifact["content"]
        assert isinstance(content, dict)
        sections = content.get("sections", [])
        assert isinstance(sections, list)
        try:
            stored = await store_narration(
                session=session,
                resource_id=artifact_id,
                texts=[str(section.get("transcript", "")) for section in sections],
                section_indexes=list(range(len(sections))),
                provider=require_voice_provider(),
            )
            for section in sections:
                section["audio_clip_ids"] = []
            for asset in stored.assets:
                if asset.section_index is not None:
                    sections[asset.section_index]["audio_clip_ids"].append(
                        str(asset.id)
                    )
            content["audio_status"] = "ready"
        except (ApiError, VoiceBusyError, VoiceLimitError, VoiceProviderError, ValueError):
            content["audio_status"] = "unavailable"
        return ArtifactResponse.model_validate(stored_artifact)

    @application.get(
        "/api/v1/studio/artifacts",
        response_model=list[ArtifactResponse],
    )
    def list_artifacts(
        session: DemoSession = Depends(current_session),
    ) -> list[ArtifactResponse]:
        return [
            ArtifactResponse.model_validate(artifact)
            for artifact in session.artifacts
        ]

    @application.get(
        "/api/v1/artifacts/{artifact_id}",
        response_model=ArtifactResponse,
    )
    def get_artifact(
        artifact_id: UUID,
        session: DemoSession = Depends(current_session),
    ) -> ArtifactResponse:
        artifact = next(
            (
                item
                for item in session.artifacts
                if item.get("id") == str(artifact_id)
            ),
            None,
        )
        if artifact is None:
            raise ApiError(
                status.HTTP_404_NOT_FOUND,
                "SOURCE_NOT_READY",
                "The study artifact was not found in this session.",
                False,
                "Return to Studio and choose an available artifact.",
            )
        return ArtifactResponse.model_validate(artifact)

    @application.delete(
        "/api/v1/artifacts/{artifact_id}",
        status_code=status.HTTP_204_NO_CONTENT,
    )
    def delete_artifact(
        artifact_id: UUID,
        session: DemoSession = Depends(current_session),
    ) -> Response:
        original_count = len(session.artifacts)
        session.artifacts = [
            item
            for item in session.artifacts
            if item.get("id") != str(artifact_id)
        ]
        if len(session.artifacts) == original_count:
            raise ApiError(
                status.HTTP_404_NOT_FOUND,
                "SOURCE_NOT_READY",
                "The study artifact was not found in this session.",
                False,
                "Refresh Studio and try again.",
            )
        session.remove_audio_for_resource(artifact_id)
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

