# AI Study Workspace

Documentation-first design for a citation-grounded study assistant inspired by
NotebookLM and Open Notebook.

The application will let a student upload course PDFs, ask questions against
those sources, open evidence at the cited page, generate revision material, and
identify confident misconceptions through active recall.

The demo opens with a polished pre-indexed source and also accepts temporary
PDF uploads. The root URL is a concise product landing page whose primary
Start studying action opens `/workspace`. The desktop workspace uses Sources
on the left, Chat in the center, and Studio on the right.

## Current status

This repository is intentionally in the documentation phase. No application
implementation has started. Architecture, scope, interfaces, quality gates, and
agent guidance must be reviewed before scaffolding the product.

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
- PyMuPDF for page-aware PDF extraction
- NumPy for in-memory vector similarity
- Browser `sessionStorage`, backend memory, and temporary files
- One Azure App Service deployment serving the frontend and API

There is no database, account system, durable file storage, or separate
frontend deployment in the hackathon release. Temporary session work may
disappear after expiry or a server restart; the bundled demo source remains.

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
