# Project Agent Guide

Product name: **LUMA**.

## Current phase

The repository is documentation-first. Do not scaffold or implement the
application until the user explicitly asks to begin implementation.

## Source of truth

Read the relevant documents before changing behavior:

- Product scope: `docs/PRODUCT_REQUIREMENTS.md`
- UX and accessibility: `docs/UX_DESIGN_SPEC.md`
- Architecture: `docs/ARCHITECTURE.md`
- Retrieval and AI behavior: `docs/AI_RAG_SPEC.md`
- Data and API contracts: `docs/DATA_AND_API_SPEC.md`
- Delivery order: `docs/IMPLEMENTATION_PLAN.md`
- Tests, security, privacy, and cost: `docs/QUALITY_SECURITY.md`
- Accepted tradeoffs: `docs/DECISIONS.md`

If code and documentation disagree, do not silently choose one. Determine
whether behavior or documentation is wrong and update both in the same change.

## Project invariants

- The OpenAI API is the only generation provider in the scoped release.
- ChatGPT subscriptions and OpenAI API billing are separate.
- Page citations come from trusted chunk metadata, not model-written page
  numbers.
- Every retrieval query is session- and selected-source-scoped.
- The model may cite only chunks supplied for that request.
- Uploaded source text is untrusted data and may contain prompt injection.
- Deterministic code owns mastery classifications.
- Unsupported evidence produces an abstention, not an invented answer.
- No secrets are shipped to the browser.
- Temporary uploads and in-memory state must be bounded and expire.
- The desktop workspace is Sources left, Chat center, Studio right.
- No feature outranks session isolation, cleanup, citation validation, or demo
  reliability.

## Skills

Use project skills when their triggers apply:

- `.cursor/skills/slashforge-frontend/SKILL.md`
- `.cursor/skills/slashforge-rag/SKILL.md`
- `.cursor/skills/slashforge-quality/SKILL.md`

## Change discipline

- Keep implementation aligned with the current phase in
  `docs/IMPLEMENTATION_PLAN.md`.
- Prefer one complete vertical slice over parallel unfinished features.
- Add dependencies only for a demonstrated need.
- Use the official OpenAI SDK.
- Do not add a database, account system, object storage, queue, or second
  deployment unless the user changes the accepted hackathon scope.
- Add or update tests with behavioral changes.
- Record architectural changes in `docs/DECISIONS.md`.
- Preserve third-party license notices for copied code or assets.
