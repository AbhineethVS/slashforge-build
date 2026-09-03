# Data Model and API Contracts

## 1. Conventions

- IDs are UUIDs generated server-side.
- Session data is temporary and process-local.
- PDF page numbers are one-based.
- API JSON fields use `snake_case`.
- An opaque session ID is sent in the `X-Session-ID` header.
- Session IDs are capabilities for a controlled demo, not authentication.
- API prefix: `/api/v1`.

## 2. In-memory structures

Use typed Python models backed by a bounded process-local session store. These
are runtime structures, not database tables.

### DemoSession

- `id`
- `created_at`
- `expires_at`
- `sources: dict[source_id, Source]`
- `messages: list[Message]`
- `artifacts: dict[artifact_id, Artifact]`
- `attempts: list[Attempt]`
- `learning_memory`: derived concept records, not a durable store
- `audio_assets: dict[audio_id, TemporaryAudioAsset]`

### Source

- `id`
- `display_name`
- `kind`: `bundled` or `uploaded`
- `file_path`
- `mime_type`
- `size_bytes`
- `page_count`
- `status`
- `error_code` nullable
- `chunks: list[SourceChunk]`
- `embedding_matrix`

Valid statuses:

`uploading`, `extracting`, `embedding`, `ready`, `failed`

### SourceChunk

- `id`
- `source_id`
- `page_start`
- `page_end`
- `position`
- `content`
- `content_hash`
- `token_count`
- `embedding`

### Message

- `id`
- `role`
- `content_markdown`
- `citations`
- `status`
- `created_at`

Message statuses: `pending`, `complete`, `interrupted`, `failed`.

### Artifact

- `id`
- `type`
- `title`
- `content`
- `source_ids`
- `created_at`

Artifact types: `summary`, `flashcards`, `quiz`, `teach_back`,
`audio_overview`.

An Audio Overview artifact contains three or four transcript `sections`, each
with normalized backend-mapped `citations` and ordered `audio_clip_ids`. It
also includes `estimated_duration_seconds` and `audio_status`. It is
single-narrator and scoped to selected ready sources.

### Attempt

- `id`
- `artifact_id`
- `activity_type`
- `concept_label` nullable
- `response_text`
- `confidence`
- `is_correct` nullable
- `classification`
- `feedback`
- `created_at`

Classifications: `mastered`, `lucky_guess`, `needs_practice`,
`confident_misconception`, `unscored`.

### Learning memory

Derived at request time from session attempts and a bundled demo concept graph.
It is not a database and is not written by the model.

Each concept record contains:

- `concept_id` and canonical `concept_label`
- `state`: `unseen`, `emerging`, `stable`, or `needs_recheck`
- latest deterministic `classification`
- optional `confidence_pattern`
- optional `misconception` with `claim`, `status` (`open`, `repairing`,
  `rechecked`), evidence pages, and a transfer question
- `confused_with` neighbouring concepts when the demo graph has them
- `next_action`: `counterexample`, `teach_back`, or `transfer_question`

A misconception stores the diagnosed faulty assumption plus contradicting
source pages. It never promotes a student answer into course truth.

`GET /api/v1/session` and `GET /api/v1/studio/progress` both return the current
`learning_memory`. Suggested Chat questions prefer the open misconception's
transfer question. Reset, expiry, and restart clear it with the session.

### Temporary audio asset

- `id`
- `resource_id`: owned assistant message, Teach-Back, or Audio Overview
- `file_path`
- `mime_type`
- `sequence`
- `section_index` nullable

Audio assets are server-owned, bounded runtime records, not durable media.
Raw recordings are forwarded to transcription without being written to disk.
Generated MP3 clips never outlive the session.

## 3. Browser session state

`sessionStorage` may retain:

- Opaque session ID.
- Selected source IDs.
- Active Studio tool.
- Panel widths and collapsed state.
- Current chat and artifact presentation state.

The server remains authoritative for source chunks and citation mapping. A page
refresh can recover while the process-local session is alive; a server restart
or TTL expiry resets the temporary workspace to the bundled demo.

## 4. Citation object

The browser receives only normalized citations:

```json
{
  "id": "citation-1",
  "chunk_id": "uuid",
  "source_id": "uuid",
  "source_name": "Operating Systems - Unit 2.pdf",
  "page_start": 14,
  "page_end": 14,
  "excerpt": "A deadlock can arise if...",
  "claim": "Deadlock requires all four Coffman conditions."
}
```

The backend builds source and page fields from in-memory metadata after
validating the model-provided `chunk_id`.

## 5. Error contract

```json
{
  "error": {
    "code": "SOURCE_TEXT_NOT_FOUND",
    "message": "This PDF does not contain enough readable text.",
    "request_id": "uuid",
    "retryable": false,
    "action": "Upload a digitally generated PDF instead."
  }
}
```

Stable user-facing error codes include:

- `SESSION_NOT_FOUND`
- `SESSION_EXPIRED`
- `SOURCE_TOO_LARGE`
- `SOURCE_PAGE_LIMIT`
- `SOURCE_TYPE_UNSUPPORTED`
- `SOURCE_ENCRYPTED`
- `SOURCE_TEXT_NOT_FOUND`
- `SOURCE_PROCESSING_FAILED`
- `SOURCE_NOT_READY`
- `INSUFFICIENT_EVIDENCE`
- `AI_RATE_LIMITED`
- `AI_BILLING_UNAVAILABLE`
- `AI_OUTPUT_INVALID`
- `REQUEST_RATE_LIMITED`
- `VOICE_UNSUPPORTED`
- `AUDIO_TOO_LARGE`
- `TRANSCRIPT_EMPTY`
- `VOICE_PROCESSING_FAILED`
- `VOICE_NOT_CONFIGURED`
- `VOICE_RESOURCE_NOT_FOUND`
- `VOICE_USAGE_LIMIT`

## 6. API endpoints

### Health

- `GET /api/v1/health`
  - Returns service, OpenAI, and speech configuration status without secrets.

### Session

- `POST /api/v1/session`
  - Creates a temporary session with the bundled demo source attached.
- `GET /api/v1/session`
  - Returns current sources, messages, artifacts, learning memory, and expiry.
- `DELETE /api/v1/session`
  - Removes uploaded files and in-memory data, then allows a clean demo reset.

### Sources

- `GET /api/v1/sources`
  - Returns the bundled source followed by session-owned uploaded source
    summaries.
- `POST /api/v1/sources`
  - Accepts a multipart PDF in the `file` field and processes it within the
    current temporary session.
  - The first implementation holds the request open through extraction,
    chunking, and embedding, then returns the ready source summary with `201`.
  - A failed attempt is removed atomically. Retry repeats the same `POST`
    rather than reusing a partial source.
- `DELETE /api/v1/sources/{source_id}`
  - Removes a session-owned uploaded source and returns `204`.
  - The immutable bundled source cannot be deleted through this route.
- `GET /api/v1/sources/{source_id}/file`
  - Streams a bundled or session-owned temporary PDF to the viewer.

### Chat

- `GET /api/v1/chat/messages`
- `POST /api/v1/chat/messages`

Request:

```json
{
  "question": "Compare paging and segmentation.",
  "source_ids": ["uuid-1", "uuid-2"]
}
```

Initial response may be structured JSON. The final contract uses
`text/event-stream` with the events defined in `AI_RAG_SPEC.md`.

The initial non-streaming response is an assistant message with
`content_markdown`, backend-mapped `citations`, `insufficient_evidence`,
`follow_up_questions`, `status`, and `created_at`. The request is rejected
before retrieval if any selected source is not ready and owned by the current
session.

### Studio

- `POST /api/v1/studio/summary`
- `POST /api/v1/studio/flashcards`
- `POST /api/v1/studio/quiz`
- `POST /api/v1/studio/teach-back`
- `POST /api/v1/studio/audio-overview`
- `GET /api/v1/studio/artifacts`
- `GET /api/v1/artifacts/{artifact_id}`
- `DELETE /api/v1/artifacts/{artifact_id}`

Generation requests include selected `source_ids`. Quiz requests may include
question count and difficulty, but the server enforces safe bounds.

Audio Overview requests include selected ready `source_ids`. The response is
an `audio_overview` artifact with three or four transcript sections, a 3–5
minute duration target, backend-mapped page citations, ordered clip IDs, and
audio status. An OpenAI-generated script with any invalid or missing required
evidence is rejected before TTS. If Bulbul v3 fails, the validated transcript
and citations still return with `audio_status: unavailable`.

Summary responses contain cited sections and revision questions. Flashcard
responses contain five to ten unique cited cards. Quiz generation requests
seven to ten candidates, discards candidates with invalid evidence or
structure, and returns five cited questions. Each quiz question includes a
`demo_response` presentation aid; the browser still requires confidence and
submission before revealing feedback.

### Attempts

- `POST /api/v1/artifacts/{artifact_id}/attempts`
- `GET /api/v1/studio/progress`

Progress includes concept counts and the derived `learning_memory` object used
by Chat and Studio. The API calculates correctness for MCQs. Short answers and Teach-Back may use
model-assisted judgments in a later iteration. The scoped release stores them
as `unscored` formative comparisons; deterministic classifications are emitted
only when correctness is known. Teach-Back still updates learning memory using
covered, missing, and check-this counts.

### Voice

- `POST /api/v1/voice/transcriptions`
  - Accepts one bounded multipart recording.
  - Uses Sarvam Saaras v3 in English-India transcription mode.
  - Returns an editable `transcript`, detected language when supplied by the
    provider, and no submitted Chat or Teach-Back action.
- `POST /api/v1/chat/messages/{message_id}/audio`
  - Resolves and narrates only a session-owned assistant answer.
- `POST /api/v1/artifacts/{artifact_id}/audio`
  - Resolves and narrates only a session-owned Teach-Back or Audio Overview.
  - Resolves server-owned text and refuses user-authored or arbitrary client
    text before calling Sarvam Bulbul v3.
- `GET /api/v1/audio/{audio_id}`
  - Streams a session-owned generated narration with a safe audio MIME type.

Speech responses identify status and recoverable failure without returning
provider payloads. The browser never sends text to be narrated and never
receives either provider key.

## 7. Session isolation

- Every endpoint except health and static assets requires `X-Session-ID`.
- Source and artifact lookups occur only within that session object.
- Random temporary directories are keyed internally; client filenames are
  never used as paths.
- Session IDs must be sufficiently random and are never logged in full.
- This is isolation for a controlled demo, not production authentication.

## 8. Concurrency and limits

- Deploy one application instance.
- Permit one upload-processing operation per session.
- Permit one generation operation per session.
- Permit one speech operation per session and reject duplicate in-flight
  requests.
- Permit at most two uploaded sources, 20 MB and 50 pages per PDF, and 100
  uploaded pages per session.
- Cap each uploaded source at 250 chunks and each session at 5 MB of uploaded
  embedding matrices.
- Reject duplicate in-flight requests instead of adding a queue.
- Cap recording MIME types, bytes, and duration; cap narration characters,
  overview script length, generated audio bytes, retained speech assets, and
  speech requests per session. Concrete values must be fixed from measured
  provider and browser behavior before Phase 6 implementation.

## 9. Retention

- Temporary sessions expire after approximately 60 minutes of inactivity.
- Uploaded PDFs and in-memory vectors are deleted on expiry, explicit reset, or
  process restart.
- Recordings, transcripts, narrations, and Audio Overview artifacts are deleted
  on expiry, explicit reset, or process restart; raw recordings should be
  removed earlier after transcription completes.
- The bundled demo PDF and precomputed index remain part of the deployment.
- A cached bundled Audio Overview transcript and audio may be packaged only
  when the source, script, voice output, and redistribution terms permit it.
- No database, account, or cross-device history exists.
- Production logs never contain source text, student responses, or session IDs.
