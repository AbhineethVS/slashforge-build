# Architecture Decision Record

This file records decisions that materially constrain implementation. Change a
decision only by adding a dated replacement entry and updating affected docs.

## ADR-001: Build documentation before application code

Status: accepted

Decision: settle product scope, interfaces, quality gates, and agent guidance
before scaffolding the application.

Reason: the repository began empty and the main risk is uncontrolled scope, not
legacy constraints.

## ADR-002: Use the OpenAI API, not Gemini

Status: accepted

Decision: use the OpenAI Responses API for generation and
`text-embedding-3-small` for retrieval embeddings. Keep the generation model
configurable through `OPENAI_CHAT_MODEL`; begin with `gpt-5-mini` as the
cost-conscious candidate and verify availability before implementation.

Consequences:

- OpenAI API billing is a separate prerequisite from a ChatGPT subscription.
- The app must enforce a per-session and per-request budget.
- Prompts, structured outputs, and tool responses remain behind an internal AI
  service so model names can change without touching route handlers.

## ADR-003: Own page-aware retrieval

Status: accepted, amended by ADR-011

Decision: do not use OpenAI managed File Search for the first release. Extract
PDFs by page, create page-preserving chunks, embed them, and search them in
process memory with NumPy cosine similarity.

Reason: OpenAI File Search returns useful file citations but does not guarantee
the page-level citation metadata required by the product. A custom pipeline
gives each retrieved chunk a trusted source ID and page range.

Consequences:

- The backend owns parsing, chunking, embedding, retrieval, and re-indexing.
- Citation validity can be enforced by checking model-selected chunk IDs
  against retrieved chunks.
- Ingestion is more work, so supported formats remain deliberately narrow.

## ADR-004: Serve the browser app and API together

Status: accepted, amended by ADR-011

Decision: compile the React/Vite browser app and serve it from the FastAPI
deployment on one Azure App Service instance.

Reason: one deployment avoids cross-origin configuration, duplicate hosting,
and extra failure points.

## ADR-005: Use temporary uploads

Status: accepted, amended by ADR-011

Decision: send bounded multipart PDF uploads to FastAPI, store them under
randomized temporary paths, and delete them on reset, expiry, or restart.

Reason: durable storage is unnecessary for the controlled hackathon demo.

## ADR-006: Use temporary capability sessions

Status: accepted, amended by ADR-011

Decision: issue a high-entropy opaque session ID and keep bounded session state
in process memory.

Reason: judges can start immediately without accounts. This is acceptable only
for a controlled demo and is not production authentication.

## ADR-007: Deterministic mastery logic

Status: accepted

Decision: application code derives mastery and misconception states from
correctness and confidence. The model generates questions, rubric points,
explanations, and evidence-backed feedback but cannot assign the final state.

## ADR-008: Reimplement patterns instead of copying Open Notebook

Status: accepted

Decision: use Open Notebook as an architectural reference for source
organization, chunk retrieval, and citation UX. Do not copy its SurrealDB,
worker, LangGraph, provider abstraction, or podcast architecture.

If substantial upstream code is copied later, add its MIT license and copyright
notice to `THIRD_PARTY_NOTICES.md` and mark the adapted files.

## ADR-009: Keep Agent Skills local and concise

Status: accepted

Decision: store project skills in `.cursor/skills/`. Each skill should contain
only project-specific instructions and link to source-of-truth docs rather than
duplicating them.

Reason: this follows the Agent Skills structure while avoiding large,
conflicting instruction sets. The UI UX Pro Max repository remains a design
reference; installing its complete searchable catalog is optional and deferred.

## ADR-010: Optimize for one reliable workspace flow

Status: accepted

Decision: ship one complete path—upload, cited answer, quiz, misconception,
Teach-Back—before adding more input types or AI features.

## ADR-011: Use one ephemeral Azure-hosted application

Status: accepted

Decision:

- Use React/Vite for the browser and FastAPI for the backend.
- Build the React output into the FastAPI deployment.
- Deploy one instance to Azure App Service.
- Keep uploaded PDFs, chunks, embeddings, chat, and artifacts in temporary
  files and process memory.
- Use NumPy cosine similarity instead of a vector database.
- Use a high-entropy temporary session ID instead of accounts.
- Package one pre-indexed demo source and cached fallback artifacts.

Reason: persistent infrastructure does not improve the judged hackathon flow
enough to justify its setup, failure modes, and implementation time.

Consequences:

- Temporary work disappears on reset, expiry, or restart.
- The deployment cannot safely use multiple instances.
- A database and object storage become necessary only for a later public,
  durable, or multi-user release.
- Page citations still come from backend-owned chunk metadata.

## ADR-012: Use a Sources–Chat–Studio workspace

Status: accepted

Decision: the desktop interface has Sources on the left, Chat in the center,
and Studio on the right. Studio contains Summary, Flashcards, Quiz, Teach Back,
and temporary progress. Citations open an evidence sheet rather than adding a
fourth permanent panel.

Reason: this mirrors the useful mental model of NotebookLM while keeping chat
and generated study tools available at the same time.

## ADR-013: Use a separate landing route

Status: accepted

Decision: `/` is a concise product landing page and `/workspace` is the
functional Sources–Chat–Studio application. The hero's primary Start studying
button links directly to `/workspace`.

Reason: the landing page gives judges immediate product context and improves
presentation quality without adding backend complexity. It remains static,
short, and free of account or upload flows.

## ADR-014: Product name is LUMA

Status: accepted

Decision: the product is named **LUMA**. Use that name in the landing wordmark,
workspace header, README, and presentation materials.

Reason: confirmed by the project owner during documentation.

## ADR-015: Process initial uploads in one request

Status: accepted

Decision: the first upload implementation holds `POST /api/v1/sources` open
while FastAPI validates, extracts, chunks, and embeds the PDF. The browser
shows coarse stage progress during that request. A failed attempt leaves no
attached source; Retry posts the retained browser `File` again.

Reason: source ingestion is short and bounded in the hackathon scope. A
single-request pipeline keeps attachment atomic and avoids adding a queue,
worker, polling protocol, or durable job state.

Consequences:

- Uploads are limited to one in flight per session.
- A ready source is attached only after every embedding succeeds.
- The API can later move to background jobs or streamed stage events without
  changing the stored source and index structures.

## ADR-016: Use a focused Practice overlay for active recall

Status: accepted

Decision: Studio remains the launcher and temporary artifact library. Cited
summaries open within the right panel, while Flashcards and Quiz open in a
large centered Practice overlay with restrained backdrop dimming and blur.
Generated decks and quizzes remain listed in Studio for reopening.

Reason: reading a summary fits the narrow Studio panel, but card recall,
written answers, confidence selection, and feedback require more space and
focus. Keeping the workspace visible preserves context without forcing these
activities into Chat.

Consequences:

- Practice traps focus, supports Escape, and restores focus to its launcher.
- Flashcards provide explicit controls, keyboard navigation, and touch swipe.
- Quiz feedback remains hidden until answer and confidence submission.
- A labeled demo-answer aid may fill a sample response for presentations but
  cannot skip confidence or submission.
- Citation evidence temporarily overlays Practice and restores its exact state.
