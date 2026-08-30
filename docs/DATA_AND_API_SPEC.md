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

Artifact types: `summary`, `flashcards`, `quiz`, `teach_back`.

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

## 6. API endpoints

### Health

- `GET /api/v1/health`
  - Returns service and OpenAI configuration status without secrets.

### Session

- `POST /api/v1/session`
  - Creates a temporary session with the bundled demo source attached.
- `GET /api/v1/session`
  - Returns current sources, messages, artifacts, and expiry.
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
- `GET /api/v1/studio/artifacts`
- `GET /api/v1/artifacts/{artifact_id}`
- `DELETE /api/v1/artifacts/{artifact_id}`

Generation requests include selected `source_ids`. Quiz requests may include
question count and difficulty, but the server enforces safe bounds.

### Attempts

- `POST /api/v1/artifacts/{artifact_id}/attempts`
- `GET /api/v1/studio/progress`

The API calculates correctness for MCQs. Short answers and Teach-Back may use
model-assisted judgments, stored with `unscored` when confidence is inadequate.

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
- Permit at most two uploaded sources, 20 MB and 50 pages per PDF, and 100
  uploaded pages per session.
- Cap each uploaded source at 250 chunks and each session at 5 MB of uploaded
  embedding matrices.
- Reject duplicate in-flight requests instead of adding a queue.

## 9. Retention

- Temporary sessions expire after approximately 60 minutes of inactivity.
- Uploaded PDFs and in-memory vectors are deleted on expiry, explicit reset, or
  process restart.
- The bundled demo PDF and precomputed index remain part of the deployment.
- No database, account, or cross-device history exists.
- Production logs never contain source text, student responses, or session IDs.
