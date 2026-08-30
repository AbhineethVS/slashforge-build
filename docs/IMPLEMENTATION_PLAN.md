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
- NumPy cosine similarity for in-memory retrieval.
- Browser `sessionStorage` for temporary UI state.
- FastAPI memory and temporary filesystem for uploaded data.
- One Azure App Service deployment serving both API and compiled frontend.
- No database, user accounts, object storage, queue, or separate frontend host.

## 3. Prerequisites

- Confirm the final deadline and judging format.
- Create an OpenAI Platform API key with separate API billing or prepaid credit.
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
- The local suite passes with 15 tests; the frontend production build and lint
  pass.
- Live OpenAI retrieval and grounded-answer evaluation still require the two
  representative PDFs, fixed known-question set, and API billing.
- Azure deployment, cold-start, and memory observations remain outstanding.
- Phase 0 is not complete until those live and deployed checks satisfy the exit
  criterion.

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

### Phase 4: right Studio

- Build the Studio home with Summary, Flashcards, Quiz, and Teach Back.
- Show active sources before generation.
- Generate structured cited summaries.
- Generate and validate flashcard decks.
- Generate extra quiz candidates and retain five valid questions.
- Implement one-question-at-a-time quiz and confidence selection.
- Preserve Studio state when evidence opens.

Exit criteria:

- Generated study tools remain in Studio rather than cluttering Chat.
- Every factual artifact links back to valid evidence.
- Flashcards and quiz are keyboard-operable.

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

### Phase 6: hardening and presentation

- Run file-abuse, prompt-injection, session-isolation, and API-failure tests.
- Run RAG evaluation and fix the earliest failing layer.
- Test keyboard use, 200% zoom, reduced motion, and contrast.
- Measure Azure cold start, memory, latency, tokens, and demo cost.
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

- Add Teach-Back and temporary progress.
- Improve measured RAG failures and accessibility.
- Harden cleanup and fallback behavior.
- Spend remaining time on presentation quality, not new infrastructure.

## 8. Scope-cut order

Cut in this order if behind:

1. Teach-Back.
2. Temporary progress history.
3. Short-answer quiz grading; retain MCQs.
4. Streaming responses.
5. More than one temporary uploaded PDF.

Never cut:

- Landing hero and Start studying route.
- Bundled pre-indexed demo source.
- Temporary upload.
- Source-scoped retrieval.
- Citation validation.
- Abstention behavior.
- Summary, flashcards, and quiz in Studio.
- OpenAI outage fallback for the demo.

## 9. Definition of done

A task is complete only when:

- Acceptance criteria pass.
- Loading, success, failure, expiry, and retry states exist.
- Session and resource limits are enforced.
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
