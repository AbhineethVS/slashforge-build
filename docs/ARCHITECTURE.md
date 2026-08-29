# System Architecture

## 1. Goal and scope

This is a single-instance hackathon demo, not a public multi-tenant service.
The architecture optimizes for fast implementation, a reliable presentation,
and page-cited answers.

It supports:

- One polished, pre-indexed demo source that works immediately.
- Optional temporary PDF uploads during a browser session.
- Page-aware retrieval and citation.
- Grounded chat, summaries, flashcards, quizzes, and Teach-Back.
- A NotebookLM-style Sources–Chat–Studio interface.

It deliberately does not provide durable accounts, cloud file storage, a
database, background workers, or cross-device persistence.

## 2. Single-service system

```mermaid
flowchart LR
    Browser[ReactBrowserApp] --> FastAPI[FastAPIService]
    FastAPI --> TempFiles[EphemeralTempFiles]
    FastAPI --> Memory[InMemorySessionsAndVectors]
    FastAPI --> OpenAI[OpenAIAPI]
    DemoAssets[PrebuiltDemoAssets] --> FastAPI
```

### Browser

React, Vite, TypeScript, Tailwind CSS, and shadcn/ui provide the interface.
Browser `sessionStorage` keeps the current session ID, chat display state,
selected sources, and temporary activity results.

Client routes:

- `/` serves the static landing page and makes no OpenAI request.
- `/workspace` initializes or restores a temporary study session.
- FastAPI returns the SPA entry point for direct navigation to either route.

### FastAPI

One Python service:

- Serves the compiled React application.
- Accepts bounded PDF uploads.
- Extracts pages with PyMuPDF.
- Creates page-bounded chunks and OpenAI embeddings.
- Keeps temporary source metadata, chunks, and vectors in memory.
- Performs cosine similarity with NumPy.
- Calls the OpenAI Responses API.
- Validates citations and structured artifacts.
- Serves temporary and bundled PDFs to the evidence viewer.

### Demo assets

The repository includes a legally reusable demo PDF and precomputed derived
assets:

- Page metadata and chunks.
- Embeddings.
- Suggested prompts.
- Optional cached artifact fixtures for emergency fallback.

Do not commit copyrighted textbooks without redistribution permission.

## 3. Deployment

Deploy one application to Azure App Service:

```mermaid
flowchart TB
    Student[StudentBrowser] --> Azure[AzureAppService]
    subgraph app [SingleApplication]
        StaticUI[CompiledReactFiles]
        API[FastAPI]
        Temp[EphemeralStorage]
        RAM[InMemoryIndex]
    end
    Azure --> StaticUI
    Azure --> API
    API --> Temp
    API --> RAM
    API --> OpenAI[OpenAIAPI]
```

Use one instance only. Multiple instances would hold different in-memory
sessions and require shared persistence, which is intentionally out of scope.

Azure's free tier may sleep or have limited resources. Warm the application
before judging; use student credits for a small paid tier if available.

## 4. Session lifecycle

1. On first load, the browser requests a random opaque session ID.
2. The API creates a bounded in-memory session with an expiry time.
3. The bundled demo source is attached immediately.
4. Optional uploaded PDFs are written to a randomized temporary directory.
5. Extracted chunks and embedding matrices live in that session's memory.
6. Each request refreshes the expiry time.
7. Explicit reset, TTL expiry, or process restart removes temporary data.

Target TTL: 60 minutes. The UI clearly says temporary uploads may disappear on
refresh after expiry or when the demo server restarts.

No personal data or login is required.

## 5. Upload and ingestion flow

```mermaid
sequenceDiagram
    participant Browser
    participant API
    participant Temp
    participant OpenAI
    participant Memory

    Browser->>API: Upload PDF with session ID
    API->>API: Validate size, type, pages, and text
    API->>Temp: Write randomized temporary PDF
    API->>API: Extract and chunk by page
    API->>OpenAI: Embed chunk batch
    OpenAI-->>API: Embedding vectors
    API->>Memory: Store source, chunks, and matrix
    API-->>Browser: Ready source metadata
```

The first implementation may process the upload in one request. The UI shows
uploading, extracting, embedding, ready, and failed stages based on streamed
events or coarse progress updates.

## 6. Grounded answer flow

1. Validate the session and selected temporary source IDs.
2. Embed the question.
3. Compute cosine similarity against only those sources with NumPy.
4. Select diverse chunks within a context budget.
5. Label chunks with opaque IDs and trusted page metadata.
6. Ask OpenAI to answer only from those chunks.
7. Validate every returned chunk ID against the supplied retrieval set.
8. Map valid IDs to source, page, and excerpt.
9. Return the answer; retain only temporary session history.

The model never supplies trusted page numbers. Page numbers always come from
the extracted chunk metadata.

## 7. Trust and safety boundaries

- The browser and uploaded PDFs are untrusted.
- Session IDs are high-entropy capabilities, not user accounts.
- File extension and browser MIME type are not sufficient validation.
- Filenames are display metadata and never filesystem paths.
- Uploaded text is delimited as untrusted evidence, not instructions.
- OpenAI keys remain server-side.
- Model output is schema- and citation-validated.
- Upload count, file size, page count, extracted characters, session memory,
  request rate, and OpenAI usage are bounded.

This design is suitable for a controlled hackathon demo, not a public launch.

## 8. Failure behavior

- Restart or expiry: temporary work disappears; the bundled demo remains.
- Extraction failure: distinguish encrypted, corrupt, and image-only PDFs.
- Embedding failure: remove partial temporary data and allow retry.
- Weak retrieval: abstain instead of inventing an answer.
- Invalid structured output: retry once, then return a recoverable error.
- OpenAI billing/quota failure: offer cached demo artifacts and explain that
  live generation is unavailable.

## 9. Observability

Log only:

- Request/session hash.
- Processing stage and duration.
- Page and chunk counts.
- Model, token usage, and estimated cost.
- Retrieval scores, selected chunk IDs, and validation outcome.

Do not log source text, student answers, session tokens, temporary paths, or API
keys.

## 10. Upgrade path

Add durable storage only if the product later needs accounts, cross-device
history, multiple replicas, public availability, or long-lived uploaded source
collections. At that point, replace in-memory stores behind the same interfaces
with object storage and a vector database.
