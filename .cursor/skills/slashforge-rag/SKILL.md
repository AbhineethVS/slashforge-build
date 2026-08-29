---
name: slashforge-rag
description: Implements and reviews page-aware PDF ingestion, in-memory NumPy retrieval, grounded OpenAI responses, citations, summaries, flashcards, quizzes, and Teach-Back behavior. Use for FastAPI, PyMuPDF, embeddings, OpenAI API, prompts, structured outputs, temporary source processing, demo assets, or RAG evaluation work.
---

# SlashForge RAG

## Read first

Read:

- `docs/AI_RAG_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_AND_API_SPEC.md`
- AI-related controls in `docs/QUALITY_SECURITY.md`

Treat those documents as requirements, not suggestions.

## Non-negotiable invariants

- Extract and retain one-based PDF page metadata.
- Chunks do not cross pages in the first release.
- Every retrieval query filters the current temporary session and selected
  ready sources.
- The model receives opaque chunk IDs and may cite only those IDs.
- The server maps validated chunk IDs to trusted source and page metadata.
- Uploaded source text is untrusted data, not system instruction.
- If evidence is insufficient, abstain.
- Never expose OpenAI credentials to the browser.

## Ingestion workflow

1. Validate the temporary session and enforce upload limits.
2. Validate PDF signature, size, encryption, and page count.
3. Extract text page by page with PyMuPDF.
4. Normalize text without losing page boundaries.
5. Reject image-only or text-empty files with a stable error code.
6. Create page-bounded chunks and content hashes.
7. Batch embeddings with bounded transient retries.
8. Build a NumPy embedding matrix.
9. Attach the source only after all chunks succeed.
10. Store it in bounded session memory and a randomized temporary path.

Do not leave partially embedded chunks active.

## Retrieval workflow

1. Normalize and embed the question.
2. Search only current-session, selected-source vectors with NumPy.
3. Deduplicate and select context within a fixed token budget.
4. Add adjacent context only when it improves completeness.
5. Label every context block with an opaque chunk ID.
6. Generate a schema-constrained answer.
7. Validate every citation against the exact supplied set.
8. Map citations from backend metadata and retain the response temporarily.

Measure retrieval hit rate separately from answer quality.

## OpenAI rules

- Use the official Python SDK and Responses API.
- Read the model from `OPENAI_CHAT_MODEL`.
- Begin with the documented cost-conscious model candidate; verify current
  model support before pinning dependencies.
- Use Pydantic structured outputs for grounded answers and artifacts.
- Set explicit timeouts and bounded retries.
- Do not retry authentication, billing, quota exhaustion, or irreparable schema
  errors in a loop.
- Record model, prompt version, token usage, latency, and estimated cost.
- Never log prompts containing source text in production.

## Artifact rules

For summaries, flashcards, quizzes, and Teach-Back:

- Retrieve evidence before generation.
- Require evidence chunk IDs in the output schema.
- Validate citations and task-specific fields.
- Reject unsupported quiz answers and ambiguous MCQs.
- Generate extra quiz candidates, then retain validated items.
- Use deterministic code for confidence classifications and mastery updates.
- Describe Teach-Back judgments as formative and uncertainty-aware.

## Testing gate

Add tests for:

- Page extraction and chunk boundaries.
- Empty/encrypted/corrupt PDFs.
- All-or-nothing source attachment and retry.
- Cross-session and selected-source retrieval filters.
- Bundled demo manifest and embedding compatibility.
- Citation allow-list enforcement.
- Prompt injection inside source text.
- Abstention on missing evidence.
- OpenAI timeout, invalid output, and billing failures.
- Retrieval hit@5 and citation page accuracy on fixed fixtures.

Do not improve prompts blindly. Classify a failure as extraction, retrieval,
context selection, generation, citation validation, or UI mapping before
changing behavior.
