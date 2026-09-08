# LUMA

Documentation-first design for **LUMA**, a citation-grounded study assistant
inspired by NotebookLM and Open Notebook.

The application will let a student upload course PDFs, ask questions against
those sources, open evidence at the cited page, generate revision material, and
identify confident misconceptions through active recall.

The demo opens with a polished pre-indexed source and also accepts temporary
PDF uploads. The root URL is a concise product landing page whose primary
Start studying action opens `/workspace`. The desktop workspace uses Sources
on the left, Chat in the center, and Studio on the right.

## Current status

Phase 0 local feasibility work is complete and cloud deployment is deferred
until the product is further along. The repository now contains:

- Page-aware PyMuPDF extraction and page-bounded chunking spikes.
- OpenAI embedding, NumPy retrieval, and structured citation spikes.
- Deterministic tests for unsupported PDFs, source filtering, trusted page
  mapping, and fabricated citation rejection.
- A FastAPI service that serves the compiled React application.
- A bounded temporary session lifecycle with restore, expiry, cleanup, and
  reset behavior.
- The LUMA landing page and responsive Sources–Chat–Studio workspace shell.
- A bundled demo catalog (`demo_assets/`) with precomputed chunks and
  embeddings for *Economics - Theory of Cost.pdf* and
  *DSA - Data Structures.pdf*.
- Session startup attachment of the ready bundled sources, suggested questions,
  and authenticated PDF serving at `/api/v1/sources/{source_id}/file`.
- Session-scoped PDF upload with page-aware extraction, OpenAI embeddings,
  retryable failures, source deletion, and automatic temporary-file cleanup.

Phases 1–6 are complete locally. The workspace opens with a ready economics
source, accepts up to two temporary PDF uploads, answers against selected
sources with backend-validated page citations, and opens cited PDFs in an
evidence sheet. Studio generates cited summaries plus focused Flashcard and
Quiz practice experiences, records deterministic confidence-aware learning
signals, recommends weak concepts, and provides cited Teach-Back feedback.
The same attempt stream now feeds a session-scoped Learning memory map that
Chat and Studio share. Cached demo artifacts keep the bundled source presentable during a live OpenAI
generation outage.

Phase 6 adds English-India push-to-talk dictation with an editable transcript,
narration of owned assistant answers, spoken Teach-Back input and narration of
already validated feedback, and a 3–5 minute single-narrator Audio Overview
with a transcript and backend-validated page citations. OpenAI remains
responsible for selected-source retrieval and overview content; Sarvam Saaras
v3 and Bulbul v3 are used only for speech-to-text and text-to-speech. Audio
remains temporary, session-scoped, bounded, and optional, with text fallback on
speech failure. The bundled demo includes a cached overview transcript; cached
speech is intentionally unavailable until redistribution rights are confirmed.

## Phase 0 setup

```bash
cd backend
python -m pip install -e ".[dev]"
python -m pytest

cd ../frontend
npm install
npm run build
```

Run the combined local service after building the frontend:

```bash
cd backend
python -m uvicorn luma_api.main:app --reload
```

Run extraction against a representative PDF:

```bash
cd backend
python -m luma_spikes.cli extract ../path/to/source.pdf
```

Live retrieval and answer commands require `OPENAI_API_KEY`. The answer model
defaults to `gpt-5-mini` and can be changed with `OPENAI_CHAT_MODEL`; Audio
Overview defaults to `gpt-5` and can be changed with
`OPENAI_AUDIO_OVERVIEW_MODEL`. Phase 6 speech calls additionally require a
server-only `SARVAM_API_KEY`; `SARVAM_TTS_SPEAKER` selects the Bulbul voice.
Neither key may be shipped to the browser.

Rebuild bundled demo assets after changing a source PDF:

```bash
cd backend
python -m luma_api.demo_assets ../demo.pdf --output ../demo_assets/economics --display-name "Economics - Theory of Cost.pdf" --source-id 8f4d0f62-5b8a-4f1e-9c2d-6a7b1c3d4e5f
python -m luma_api.demo_assets ../dsa.pdf --output ../demo_assets/dsa --display-name "DSA - Data Structures.pdf" --source-id c3e8a914-7f2b-4d91-9e55-2b6f0a8d1c47
```

## Documentation

- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [UX design specification](docs/UX_DESIGN_SPEC.md)
- [System architecture](docs/ARCHITECTURE.md)
- [AI and RAG specification](docs/AI_RAG_SPEC.md)
- [Data model and API contracts](docs/DATA_AND_API_SPEC.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Quality, security, and cost plan](docs/QUALITY_SECURITY.md)
- [Architecture decisions](docs/DECISIONS.md)
- [References and licenses](docs/REFERENCES.md)

## Proposed stack

- React, Vite, TypeScript, Tailwind CSS, and shadcn/ui
- FastAPI and Python for PDF processing and AI orchestration
- OpenAI Responses API, structured outputs, and `text-embedding-3-small`
- Sarvam Saaras v3 for English-India STT and Bulbul v3 for TTS
- PyMuPDF for page-aware PDF extraction
- NumPy for in-memory vector similarity
- Browser `sessionStorage`, backend memory, and temporary files
- One Azure App Service deployment serving the frontend and API

There is no database, account system, durable file storage, or separate
frontend deployment in the hackathon release. Temporary session work may
disappear after expiry or a server restart; the bundled demo sources remain.

## Important API prerequisite

A ChatGPT subscription does not include OpenAI API usage. Before implementation,
create an OpenAI Platform API key and enable separate API billing or prepaid
credits. The product will fail gracefully when the API key or available credit
is missing.

## Project skills

Project-specific Cursor Agent Skills live in `.cursor/skills/`:

- `slashforge-frontend` for UI implementation and review
- `slashforge-rag` for ingestion, retrieval, citations, and AI artifacts
- `slashforge-quality` for tests, accessibility, privacy, and release gates

These are deliberately small, project-specific instructions. They follow the
Agent Skills pattern without copying the large knowledge bases from the
reference repositories.
