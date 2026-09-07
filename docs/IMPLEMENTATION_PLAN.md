# Implementation Plan

## 1. Delivery strategy

Build one polished, reliable demo path:

`open ready demo → ask cited question → use Studio → reveal misconception`

The bundled demo source is the presentation guarantee. Temporary PDF upload is
still implemented to satisfy the project brief, but persistent infrastructure
is not.

The first milestone is a technical proof that one PDF can be parsed by page,
retrieved from memory, answered from, and opened at the cited page.

## 2. Final hackathon stack

- React, Vite, TypeScript, Tailwind CSS, and shadcn/ui.
- FastAPI and Python.
- PyMuPDF for page-aware PDF extraction.
- OpenAI Responses API for generation.
- `text-embedding-3-small` for embeddings.
- Sarvam Saaras v3 for English-India speech-to-text and Bulbul v3 for
  text-to-speech.
- NumPy cosine similarity for in-memory retrieval.
- Browser `sessionStorage` for temporary UI state.
- FastAPI memory and temporary filesystem for uploaded data.
- One Azure App Service deployment serving both API and compiled frontend.
- No database, user accounts, object storage, queue, or separate frontend host.

## 3. Prerequisites

- Confirm the final deadline and judging format.
- Create an OpenAI Platform API key with separate API billing or prepaid credit.
- Create a Sarvam API key for server-only Phase 6 STT/TTS calls and verify
  Saaras v3 and Bulbul v3 account access, limits, pricing, and output rights.
- Confirm access to an Azure subscription or Azure student credits.
- Product name is **LUMA**.
- Select one legally reusable polished demo PDF.
- Select a second small PDF for upload and retrieval testing.
- Approve this documentation before application scaffolding.

## 4. Planned repository shape

```text
.
├── frontend/                  # React + Vite workspace
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   └── WorkspacePage.tsx
│   │   ├── components/
│   │   │   ├── landing/
│   │   │   ├── sources/
│   │   │   ├── chat/
│   │   │   ├── studio/
│   │   │   └── evidence/
│   │   ├── lib/
│   │   └── styles/
│   └── package.json
├── backend/                   # FastAPI and in-memory RAG
│   ├── app/
│   │   ├── api/
│   │   ├── rag/
│   │   ├── models/
│   │   └── prompts/
│   ├── tests/
│   └── pyproject.toml
├── demo_assets/
│   ├── source.pdf
│   ├── manifest.json
│   ├── chunks.json
│   └── embeddings.npy
├── tests/evals/
├── docs/
├── .cursor/skills/
├── AGENTS.md
├── .env.example
└── README.md
```

The frontend production build is copied into FastAPI's static directory during
deployment. FastAPI serves both the single-page app and `/api/v1`.

## 5. Phase 0: feasibility spikes

All spikes use representative PDFs and run before visual implementation.

### Spike A: extraction

- Extract page-by-page text with PyMuPDF.
- Detect encrypted, corrupt, and image-only PDFs.
- Prove one-based page numbers align with the PDF viewer.

### Spike B: in-memory retrieval

- Chunk without crossing pages.
- Embed with `text-embedding-3-small`.
- Load vectors into a NumPy matrix.
- Retrieve expected evidence in the top five for ten known questions.

### Spike C: citations

- Send retrieved chunks with opaque IDs to OpenAI.
- Parse a structured grounded answer.
- Reject a deliberately fabricated chunk ID.
- Open the bundled PDF at the mapped page.

### Spike D: Azure

- Deploy a minimal FastAPI service that serves a compiled React page.
- Confirm OpenAI secrets remain server-side.
- Confirm a multipart upload works within the chosen size limit.
- Observe cold-start and memory behavior.

Exit criterion: all four spikes work in the deployed environment.

Phase 0 status (2026-08-29):

- Local extraction, page-bounded chunking, selected-source retrieval, citation
  allow-listing, trusted page mapping, bounded multipart upload, and combined
  FastAPI/compiled-React serving have deterministic tests.
- The current local suite passes with 21 backend and 4 frontend tests; the
  frontend production build and lint pass.
- Live OpenAI retrieval and grounded-answer evaluation still require the two
  representative PDFs, fixed known-question set, and API billing.
- Azure deployment, cold-start, and memory observations remain outstanding.
- Phase 0 is not complete until those live and deployed checks satisfy the exit
  criterion.
- Cloud deployment was deliberately deferred on 2026-08-30 so it does not
  block product implementation; the outstanding Spike D checks remain required
  before release.

## 6. Build phases

### Phase 1: foundation and demo assets

- Scaffold React/Vite and FastAPI.
- Add client routing for `/` and `/workspace`, including server-side SPA
  fallback.
- Add linting, formatting, tests, and environment configuration.
- Implement temporary session creation, TTL cleanup, and reset.
- Build a script that produces demo chunks and `embeddings.npy`.
- Load the bundled demo index when FastAPI starts.
- Build the concise landing page, hero CTA, and three-panel workspace preview.

Exit criteria:

- The landing page explains the product and routes Start studying to
  `/workspace`.
- Refreshing either route works in the Azure deployment.
- The application opens with a ready demo source.
- Reset returns to the original demo state.
- No OpenAI key is present in frontend output.

Phase 1 status (2026-08-30):

- React routes now provide a static landing page and a responsive
  Sources–Chat–Studio workspace shell.
- FastAPI now creates, restores, refreshes, expires, bounds, and resets
  temporary in-memory sessions through the documented session header.
- The browser restores the opaque session from `sessionStorage`, recovers from
  expiry, and exposes loading, retry, ready, and reset states.
- Direct SPA fallback for `/workspace` is covered by a backend test.
- Bundled demo assets are built from the public economics notes PDF and loaded
  at FastAPI startup. New sessions attach the ready source, expose suggested
  questions, and serve the bundled PDF through the documented source file route.
- Phase 1 exit criteria are satisfied locally except Azure deployment refresh
  checks, which remain deferred.

### Phase 2: Sources panel and temporary upload

- Build the left Sources panel.
- Show the bundled source as ready and selected.
- Add bounded PDF upload.
- Implement validation, extraction, chunking, embeddings, and in-memory storage.
- Add uploading, extracting, embedding, ready, failed, delete, and retry states.
- Add the temporary-data disclosure.

Exit criteria:

- A supported PDF becomes searchable in the current session.
- Invalid files fail with a useful action.
- Deleting or resetting removes temporary data.

Phase 2 status (2026-08-30):

- The Sources panel accepts PDF uploads and presents uploading, extracting,
  embedding, ready, and failed states with retry and remove actions.
- FastAPI validates MIME type, magic bytes, size, encryption, readable text,
  per-file pages, total session pages, source count, chunk count, and embedding
  memory before attaching a ready source.
- Uploaded PDFs, chunks, and NumPy indexes are isolated to the current session
  and removed on source deletion, reset, expiry, or process restart.
- The bundled demo remains ready after upload failures, and uploaded files are
  served only through the session-checked source route.
- Phase 2 exit criteria pass locally with backend integration tests and
  frontend component tests.

### Phase 3: center Chat and evidence

- Build the center Chat panel and anchored composer.
- Add source selection and source-aware suggested questions.
- Implement NumPy retrieval and structured grounded responses.
- Validate citation chunk IDs.
- Add compact citation controls and excerpts.
- Add a PDF evidence sheet that opens at the cited page.
- Add abstention behavior.

Exit criteria:

- Known questions meet answer and page-citation targets.
- Unknown citation IDs never reach the browser as valid evidence.
- The bundled demo remains usable after an upload failure.

Phase 3 status (2026-08-30):

- Ready-source selection is persisted in browser session state and sent
  explicitly with each question.
- FastAPI combines only selected, session-owned indexes, embeds the query once,
  retrieves five candidate chunks, and requests a structured grounded answer.
- Citation chunk IDs are allow-listed against the exact retrieval set and
  mapped to backend-owned source, page, and excerpt metadata. Invalid IDs are
  retried once and never reach the browser.
- Insufficient-evidence output is replaced deterministically with an
  abstention and no citations.
- Chat supports suggested questions, pending and retry states, safe Markdown,
  compact citation controls, and temporary history.
- The evidence sheet fetches PDFs with the session header, opens the cited page
  through a temporary blob URL, retains an excerpt fallback, traps focus, and
  restores focus when closed.
- Automated verification passes with 38 backend and 9 frontend tests. Live
  smoke checks returned a grounded known answer citing page 2 and correctly
  abstained without citations on an absent question.
- The full fixed 15-answerable/5-absent evaluation set and production SSE
  transport remain release-hardening work; the initial non-streaming contract
  is permitted by `AI_RAG_SPEC.md`.

### Phase 4: right Studio

- Build the Studio home with Summary, Flashcards, Quiz, and Teach Back.
- Show active sources before generation.
- Generate structured cited summaries.
- Generate and validate flashcard decks.
- Generate extra quiz candidates and retain five valid questions.
- Optional previous-year papers may shape quiz item type and stem style without
  becoming retrievable sources.
- Implement one-question-at-a-time quiz and confidence selection.
- Preserve Studio state when evidence opens.

Exit criteria:

- Generated study tools remain in Studio rather than cluttering Chat.
- Every factual artifact links back to valid evidence.
- Flashcards and quiz are keyboard-operable.

Phase 4 status (2026-08-30):

- Studio generates source-scoped cited summaries, flashcard decks, and mixed
  five-question quizzes through strict structured OpenAI outputs.
- Artifact evidence IDs are allow-listed against retrieved chunks. Summary
  sections must all validate; invalid flashcard and quiz candidates are
  discarded before retaining a usable set.
- Summary remains in Studio. Flashcards and Quiz open in a large, focused
  Practice overlay with restrained backdrop blur and remain available in
  Studio for reopening.
- Flashcards support reveal, previous/next, shuffle, arrow keys, Space/Enter,
  and touch swipe.
- Quiz requires an answer and Low/Medium/High confidence before revealing
  feedback. A labeled Fill demo answer presentation aid never bypasses that
  sequence.
- Citations open authenticated evidence without losing the active card or
  question. Generated artifacts remain temporary, session-scoped, restorable,
  deletable, and reset with the session.
- Desktop Sources–Chat and Chat–Studio boundaries are drag-resizable, keyboard
  operable, and persisted in `sessionStorage` within safe panel widths.
- Automated verification passes with 43 backend and 15 frontend tests. Live
  generation produced a five-section cited summary, eight cited flashcards,
  and a validated five-question mixed quiz with citations and demo responses.

### Phase 5: misconception loop and polish

- Add deterministic confidence classifications.
- Show temporary progress and weak concepts in Studio.
- Add cited Teach-Back feedback if schedule permits.
- Complete responsive Sources/Studio sheets.
- Add cached demo artifacts for OpenAI outage fallback.
- Improve loading, error, empty, and expired-session states.

Exit criteria:

- A high-confidence wrong answer produces a confident-misconception signal.
- The full demo works at desktop and mobile breakpoints.

Phase 5 status (2026-08-31):

- Quiz attempts are stored in the temporary session and classified by
  deterministic backend code as mastered, lucky guess, needs practice,
  confident misconception, or unscored. Short answers remain formative
  comparisons rather than receiving an unreliable semantic grade.
- Studio aggregates concept-level attempt signals, prioritizes misconceptions,
  and recommends a weak concept for the next Teach-Back activity.
- Teach-Back retrieves selected-source evidence, generates a cited rubric, and
  groups feedback into Covered, Missing, and Check this idea. Every feedback
  citation is validated against the supplied chunk allow-list.
- Tablet and mobile Sources and Studio controls now open independent,
  full-height sheets while Chat remains the dominant workspace.
- Expired sessions explain that temporary work was cleared. Loading, retry,
  generation, attempt-save, and empty-progress states preserve usable work.
- The bundled economics source includes citation-validated cached Summary,
  Flashcards, and Quiz artifacts used automatically when live generation is
  unavailable.
- Automated verification passes with 48 backend and 18 frontend tests, plus
  the frontend production build and lint checks.

### Phase 6: Grounded Voice Learning

Phase 6 status (2026-08-31): implemented locally; live Sarvam verification
still requires a configured provider key and deployed-HTTPS device checks.

- Add bounded English-India push-to-talk capture for Chat and Teach-Back.
- Transcribe through server-side Sarvam Saaras v3 and place the result in the
  existing editable text input without auto-submitting.
- Add optional Bulbul v3 narration for backend-owned assistant answers and
  already citation-validated Teach-Back feedback.
- Generate a structured 3–5 minute single-narrator Audio Overview with OpenAI
  from selected-source retrieval.
- Validate all overview chunk IDs and map trusted page citations before sending
  the final transcript to Bulbul v3.
- Show overview playback, complete transcript, and citation controls in Studio.
- Enforce recording duration/bytes, narration characters/audio bytes,
  concurrency, request-rate, retained-asset, and session-memory limits.
- Delete recordings and generated audio on completion where possible, reset,
  expiry, or restart; keep both provider keys server-only.
- Preserve typed input and readable transcripts on microphone, STT, or TTS
  failure.
- Add a cached bundled overview transcript and audio only if redistribution is
  allowed.
- Do not add voice flashcards/quizzes or audio-source ingestion.

Implementation notes:

- FastAPI exposes bounded multipart transcription, owned assistant/Teach-Back
  narration, session-checked MP3 clips, and grounded Audio Overview creation.
- Raw microphone blobs are not written to disk. Generated clips use randomized
  temporary paths and are removed with their artifact, session reset, expiry,
  or process restart.
- Audio Overview script generation uses selected-source retrieval, structured
  OpenAI output, chunk allow-list validation, and trusted backend page mapping.
  TTS runs after script validation and a TTS failure preserves the transcript.
- The bundled economics fallback includes a validated overview transcript.
  Cached audio is explicitly unavailable because redistribution approval has
  not been confirmed.
- Chat and Teach-Back use a reusable 30-second recorder. Dictation only edits
  the existing textarea. Optional narration and the focused overview player
  include status announcements, speed, replay, transcript, and citations.
- Automated verification passes with 56 backend and 22 frontend tests, plus
  frontend production build and lint checks.

Exit criteria:

- Dictated Chat and Teach-Back transcripts are editable and never auto-submit.
- Narration cannot be used for client-supplied text or another session's
  resource.
- The Audio Overview stays within the 3–5 minute target, exposes its complete
  transcript, and uses only backend-validated page citations.
- Speech denial and provider failures leave all learning flows usable as text.
- Audio isolation, limits, cleanup, keyboard access, and fixed English-India
  speech fixtures pass.

### Phase 6.5: Session learning memory

Status (2026-09-03): implemented locally as a derived in-session layer.

- Derive concept-level learning memory from quiz and Teach-Back attempts.
- Keep classification, misconception status, and next action in deterministic
  code; use a hardcoded demo concept graph only for aliases, collisions, and
  contrast questions.
- Expose the memory in session and progress payloads.
- Show the map in Studio and let Chat prefer contrast questions for an open
  misconception.
- Clear memory on reset, expiry, or restart.

Exit criteria:

- A high-confidence wrong answer opens a cited misconception in Studio.
- Chat suggested questions change to a contrast case for that misconception.
- Teach-Back can mark the same record as repairing; a later mastered attempt
  can mark it rechecked.
- No durable store, account, or model-assigned mastery is added.

### Phase 6.6: Visual Deck fallback

Status (2026-09-03): implemented locally for the bundled economics demo.

- Add an Infographics prompt editor in Studio.
- Store the prompt as a temporary `visual_deck` artifact.
- Preview and download a session-checked, cached 15-slide economics PDF.
- Label the deck as fallback content; do not claim prompt-specific deck
  composition until a validated SVG/chart and PowerPoint pipeline exists.

Exit criteria:

- The cached deck can be opened only from its owning session artifact.
- A selected uploaded source cannot receive the economics fallback.
- Reset and expiry clear the artifact record.

### Phase 6.7: Structured Chat formatting

Status (2026-09-03): implemented locally.

- Add a Chat answer-format selector for Auto, concise points, table, steps,
  code, and paragraph.
- Ask OpenAI for structured sections in the existing grounded-answer response;
  do not add a second formatting pass.
- Validate selected formats, section evidence chunk IDs, table shape, and code
  section presence before returning the answer.
- Strip raw chunk UUIDs from visible answer text while preserving citation
  metadata.
- Render tables, lists, steps, and code blocks directly in React.
- For code/algorithm requests, include a short explanatory section before the
  source-supported code or pseudocode.

Exit criteria:

- A comparison request in Auto or Table renders as a semantic table.
- A code request in Auto or Code renders as a preformatted code block when the
  selected source contains enough evidence.
- Raw chunk IDs do not appear in visible prose, bullets, table cells, or code.
- Unsupported source selections still abstain instead of inventing.

### Phase 7: hardening and presentation

- Run file-abuse, prompt-injection, session-isolation, and API-failure tests.
- Run recording abuse, narration ownership, speech-provider failure, and audio
  cleanup tests.
- Run RAG evaluation and fix the earliest failing layer.
- Test keyboard use, audio alternatives, 200% zoom, reduced motion, and
  contrast.
- Measure Azure cold start, memory, latency, tokens, speech usage, and demo
  cost.
- Rehearse three times with the bundled source.
- Record a fallback video.

## 7. Suggested schedule

### Day 1

- Complete feasibility spikes.
- Freeze upload limits, chunking, and Azure tier.

### Day 2

- Complete the landing page, foundation, precomputed demo assets, and Sources
  panel.

### Day 3

- Complete temporary upload, retrieval, Chat, citations, and PDF evidence.

### Day 4

- Complete Studio summary, flashcards, and quiz.

### Day 5

- Add confidence classification, polish UI, deploy, and rehearse.
- This is the submission-safe release.

### Days 6–8, if available

- Implement Phase 6 Grounded Voice Learning after the completed Teach-Back and
  temporary progress foundation.
- Improve measured RAG failures and accessibility.
- Complete Phase 7 cleanup, fallback, and presentation hardening.
- Spend remaining time on presentation quality, not new infrastructure.

## 8. Scope-cut order

Cut in this order if behind:

1. Live narration of individual assistant answers.
2. Live narration of Teach-Back feedback.
3. Live Audio Overview generation; retain a redistributable cached transcript
   and audio only if permitted.
4. Push-to-talk dictation.
5. Temporary progress history.
6. Short-answer quiz grading; retain MCQs.
7. Streaming responses.
8. More than one temporary uploaded PDF.

Never cut:

- Landing hero and Start studying route.
- Bundled pre-indexed demo source.
- Temporary upload.
- Source-scoped retrieval.
- Citation validation.
- Abstention behavior.
- Summary, flashcards, and quiz in Studio.
- OpenAI outage fallback for the demo.
- Backend citation validation for any Audio Overview that remains in scope.
- Curated `/tools` catalog sourced from `docs/LUMA_TOOL_COLLECTION.md`.

## 9. Definition of done

A task is complete only when:

- Acceptance criteria pass.
- Loading, success, failure, expiry, and retry states exist.
- Session and resource limits are enforced.
- Speech features retain an equivalent text path and audio is session-owned,
  bounded, and cleaned up.
- Generated citations use only supplied chunk IDs.
- Relevant tests pass.
- Keyboard and responsive behavior work.
- User-facing behavior matches the docs, or the docs change with it.

## 10. Post-hackathon upgrade path

Add a database or object storage only if later requirements include:

- Accounts and cross-device history.
- Durable uploaded source collections.
- Multiple backend replicas.
- Public release.
- Collaboration or sharing.

Those requirements do not belong in the hackathon implementation.
