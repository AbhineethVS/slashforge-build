# AI and RAG Specification

## 1. Purpose

This document defines how course PDFs become grounded answers and learning
artifacts. Page-level citation correctness is the primary technical invariant.

## 2. Why custom retrieval

OpenAI's Responses API offers managed File Search over vector stores and
returns file citation annotations. It is a strong future simplification, but
the product requires exact source-page navigation. The first release therefore
stores page metadata with every chunk and treats backend-owned chunk metadata
as the authority for citations.

This is an ingestion and retrieval pipeline, not a newly trained parsing model.

## 3. PDF extraction

Use PyMuPDF in the backend.

For each PDF:

1. Verify the PDF signature, size, page limit, and encryption status.
2. Open it with a bounded timeout and memory policy.
3. Extract text one page at a time.
4. Normalize Unicode, repeated whitespace, soft hyphens, and null characters.
5. Preserve paragraph and heading boundaries where extraction permits.
6. Calculate text-density statistics.
7. Reject the document as scanned/unsupported when usable text is below the
   documented threshold.

Store page numbers as one-based values because that matches the PDF viewer.
Never infer page numbers after text has been concatenated.

## 4. Chunking

Initial strategy:

- Target 450–650 tokens.
- Overlap 60–90 tokens.
- Never cross a page boundary in the first release.
- Prefer paragraph boundaries; split long paragraphs recursively.
- Drop tiny chunks unless they complete a neighboring chunk.
- Preserve a normalized content hash for idempotency.

Each chunk contains:

- Stable UUID.
- Session and source IDs.
- One-based page start and end.
- Position within the source.
- Plain content.
- Token count.
- Content hash.
- Embedding vector.
- Embedding model.

Not crossing pages may reduce context continuity, but it makes citations
unambiguous. Retrieval can select adjacent chunks when more context is needed.

## 5. Embeddings

Use `text-embedding-3-small` initially and keep the model in configuration.

- Batch chunks within OpenAI limits.
- Normalize input before hashing and embedding.
- Retry transient failures with exponential backoff and jitter.
- Do not retry billing, authentication, or invalid-request failures.
- Keep temporary vectors in a NumPy matrix attached to the in-memory session.
- Remove the temporary source if any embedding batch fails.
- Precompute and package the demo PDF's chunks and embeddings so the judged
  flow does not wait for indexing.
- Record the extraction and embedding version in the packaged demo manifest;
  regenerate the assets when either changes.

## 6. Retrieval

### Query preparation

- Trim and normalize the question.
- Reject empty or excessively long questions.
- Do not use an LLM to rewrite every query in the first release.
- Add a query rewrite only if evaluation proves a specific retrieval problem.

### Candidate search

Run NumPy cosine similarity over the current in-memory session with mandatory
filters:

- Opaque session ID.
- Selected ready source IDs.

Initial semantic candidate count: 12.

Do not build lexical search or a vector database for the hackathon release.
The intentionally small source limit keeps a linear in-memory scan fast enough.

### Context selection

- Deduplicate near-identical chunks.
- Prefer source and page diversity when scores are close.
- Add one neighboring chunk where it completes a definition or procedure.
- Limit final context to approximately six to eight chunks and a fixed token
  budget.
- If the best score is below a calibrated threshold, return an insufficient
  evidence response.

Do not hard-code a final similarity threshold before testing representative
course material.

## 7. Grounded answer contract

The model receives:

- A concise role and abstention policy.
- The user's question.
- Retrieved blocks labeled with opaque chunk IDs.
- A required output schema.

Required answer shape:

```json
{
  "answer_markdown": "string",
  "citations": [
    {
      "chunk_id": "uuid",
      "claim": "short supported claim"
    }
  ],
  "insufficient_evidence": false,
  "follow_up_questions": ["string"]
}
```

Server validation:

- Every citation chunk ID is in the supplied retrieval set.
- Every cited chunk belongs to an active source in the current session.
- No client-provided source title or page is trusted.
- An insufficient-evidence response contains no invented answer.
- Unknown IDs are removed and the answer is retried once if that would leave a
  factual claim unsupported.

The API maps valid chunk IDs from in-memory source metadata to source name,
page, and excerpt after model generation.

## 8. Streaming

The final production shape should use server-sent events:

- `response.started`
- `response.delta`
- `citation.ready`
- `response.completed`
- `response.error`

Structured citation validation occurs before `response.completed`. During the
first vertical slice, a non-streaming structured response is acceptable because
correct citations are more important than typing animation.

## 9. Summary generation

Generate from a retrieval sweep, not all selected source text in one prompt.

1. Identify candidate concepts from source headings and representative chunks.
2. Retrieve evidence for each concept.
3. Generate a structured summary with concepts, definitions, relationships,
   confusion points, and revision prompts.
4. Validate all cited chunk IDs.
5. Merge duplicate concepts deterministically.

Large-document map-reduce generation is deferred until required by the page
limit.

## 10. Flashcard generation

Each card contains:

- Short front prompt.
- Concise back answer.
- Concept label.
- Difficulty.
- One or more evidence chunk IDs.

Generate candidate cards, remove duplicates, validate their answers against the
evidence, and return a small deck. Avoid cards that merely split one paragraph
into arbitrary sentences.

## 11. Quiz generation

Question schema:

- ID and type: MCQ or short answer.
- Prompt.
- Four options for MCQ and exactly one best option.
- Expected answer.
- Explanation.
- Concept label.
- Difficulty: recall, understanding, or application.
- Evidence chunk IDs.

Validation:

- Evidence exists in active sources.
- The expected answer follows from evidence.
- Distractors are plausible but not supported as correct.
- The prompt is answerable without hidden context.
- No duplicate question or answer leakage.

Generate more candidates than needed, validate, then keep five. Retry invalid
items once rather than regenerating the entire quiz.

## 12. Confidence and mastery

Confidence values:

- Low: 1
- Medium: 2
- High: 3

Deterministic classification:

- Correct and confidence 2–3: mastered signal.
- Correct and confidence 1: lucky-guess signal.
- Incorrect and confidence 1–2: needs-practice signal.
- Incorrect and confidence 3: confident-misconception signal.

Concept mastery is a transparent weighted score over recent attempts. Exact
weights will be calibrated with sample sessions and documented in code.

## 13. Teach-Back

1. Retrieve source evidence for the selected concept.
2. Generate three to five atomic rubric points with citations.
3. Compare the student's explanation with those points.
4. Return covered points, missing points, possible misconceptions, and one next
   prompt.
5. Validate every correction citation.

The system must use uncertainty language for semantic judgments and must not
claim objective grading.

## 14. Grounded voice learning

Speech does not change the retrieval or citation trust model.

### Dictation

- Chat and Teach-Back use bounded push-to-talk recordings, never ambient or
  continuously open microphone capture.
- FastAPI sends English-India audio to Sarvam Saaras v3 with transcription
  output, not translation.
- The transcript is untrusted user input, remains editable, and is never
  submitted automatically.

### Narration

- Sarvam Bulbul v3 may narrate only text resolved by the backend from a
  session-owned assistant answer, already validated Teach-Back feedback, or
  validated Audio Overview artifact.
- User-authored text, arbitrary client text, source PDFs, flashcards, and
  quizzes are not narration inputs.
- Page numbers and citation labels are rendered from backend-owned citation
  objects; speech output is never a citation authority.

### Audio Overview

1. Validate the current session and selected ready source IDs.
2. Run a broad selected-source retrieval sweep sufficient for a coherent short
   overview.
3. Ask OpenAI for a structured, single-narrator script targeting 3–5 minutes,
   with section-level opaque chunk IDs.
4. Validate every chunk ID against the exact supplied retrieval set and map it
   to trusted source/page metadata.
5. Reject or retry unsupported sections before narration.
6. Send only the final validated transcript to Sarvam Bulbul v3.
7. Return the transcript, normalized page citations, and optional temporary
   audio. If TTS fails, return the readable validated artifact without audio.

The overview is explanatory study content, not a multi-speaker podcast. It
must not introduce facts absent from selected-source evidence. Cached bundled
overview transcripts must pass the same citation validation; cached audio is
packaged only when redistribution is allowed.

## 15. Provider and model policy

- Use the OpenAI Responses API through the official Python SDK.
- Keep the generation model configurable as `OPENAI_CHAT_MODEL`.
- Start evaluation with `gpt-5-mini`; change only after measuring quality,
  latency, and cost.
- Use low or minimal reasoning for ordinary grounded Q&A.
- Use structured outputs with Pydantic schemas for artifacts.
- Set explicit request timeouts and bounded retries.
- Store model and prompt versions with every generated artifact.
- OpenAI remains the sole provider for embeddings, retrieval-related model
  work, grounded content generation, and structured learning artifacts.
- Sarvam is a narrow speech provider only: `saaras:v3` for STT and
  `bulbul:v3` for TTS, configured for English-India where applicable.
- Keep `OPENAI_API_KEY` and `SARVAM_API_KEY` server-only and record speech
  model versions with temporary speech artifacts.

## 16. Prompt versioning

Prompts live as versioned files or constants grouped by task:

- `grounded_answer`
- `summary`
- `flashcard_generation`
- `quiz_generation`
- `quiz_validation`
- `teach_back_rubric`
- `teach_back_feedback`
- `audio_overview`

Every response records its prompt version in temporary diagnostics. Prompt
changes require running the fixed evaluation set before release.

## 17. Evaluation

Maintain two representative, redistributable fixture PDFs with:

- 15 answerable questions.
- 5 questions absent from all sources.
- Similar terms on different pages.
- At least 3 cross-source comparison questions.
- Definitions, lists, and one multistep procedure.

Track retrieval hit rate separately from answer correctness. If the required
evidence is absent from the selected context, the generation model is not the
first problem to fix.

Phase 6 adds fixed English-India speech fixtures for transcription usability,
recording limits, narration ownership, speech fallback, overview duration,
script groundedness, and citation-page accuracy. Evaluate transcript quality
separately from OpenAI content quality and citation validation.
