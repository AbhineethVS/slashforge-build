# Quality, Security, and Cost Plan

## 1. Quality strategy

The release is judged by grounded behavior, not by whether an API request
returns successfully. Test the system in layers so retrieval failures are not
misdiagnosed as model failures.

## 2. Test layers

### Frontend unit and component tests

- Landing hero CTA routes to `/workspace`.
- Landing page performs no OpenAI or session request before navigation.
- Source status rendering.
- Citation keyboard and pointer behavior.
- PDF page navigation.
- Quiz confidence gating.
- Attempt classification display.
- Empty, loading, interrupted, and error states.
- Responsive sheet focus restoration.
- Push-to-talk permission, duration, cancellation, editable transcript, and
  text fallback states.
- Narration ownership controls, keyboard playback, and Audio Overview
  transcript/citation behavior.

Suggested tools: Vitest, React Testing Library, and axe.

### Backend unit tests

- PDF validation and scanned-text threshold.
- Unicode and whitespace normalization.
- Page-bounded chunking and overlap.
- Demo-asset manifest compatibility.
- NumPy retrieval filtering and ranking.
- Citation allow-list validation.
- Deterministic mastery classification.
- Derived session learning memory and misconception repair states.
- Error mapping and retry policy.
- Speech media/size/duration limits, narration resource ownership, and cleanup.
- Audio Overview chunk allow-listing before narration.

Suggested tools: pytest, pytest-asyncio, and Hypothesis for chunking invariants
where useful.

### Integration tests

- New session includes the ready bundled demo source.
- Multipart upload produces a temporary ready source.
- Cross-session source selection is rejected.
- Session reset and expiry remove temporary files and memory.
- A server restart returns users to the bundled demo.
- OpenAI timeout, rate limit, billing failure, and invalid output handled.
- Sarvam authentication, rate limit, timeout, malformed response, and partial
  speech failure handled without losing the text path.
- Cross-session recording and generated-audio access is rejected.
- Optional previous-year papers change quiz style without becoming sources.

### End-to-end tests

With Playwright:

1. Open the landing page and select Start studying.
2. Verify `/workspace` opens with the ready demo source.
3. Ask a known question.
4. Open its citation at the expected page.
5. Generate Studio flashcards and a quiz.
6. Complete a quiz with a high-confidence wrong answer.
7. Verify the confident-misconception state.
8. Upload a small fixture PDF and ask a cited question about it.
9. Dictate and edit one Chat question and one Teach-Back response.
10. Narrate an owned answer, generate an Audio Overview, inspect its
    transcript, and open a validated page citation.

Keep one mocked deterministic run for CI and one live OpenAI smoke run that is
manual or budget-controlled.

## 3. RAG evaluation

Fixture set:

- Two legally redistributable course PDFs.
- 15 answerable questions.
- 5 absent-answer questions.
- 3 cross-source comparison questions.
- Expected source IDs and page ranges.

Measure:

- Retrieval hit@5: expected evidence appears in top five.
- Answer correctness: human-reviewed.
- Citation precision: citation supports the associated claim.
- Citation page accuracy.
- Citation coverage: factual claims with evidence.
- Abstention accuracy.
- Quiz answerability and answer-key correctness.
- Median and p95 processing/chat latency.
- English-India transcription usability and word/error review on fixed speech
  fixtures.
- Audio Overview groundedness, citation-page accuracy, spoken duration, and
  transcript/audio agreement.

Release targets:

- Answer correctness at least 85%.
- Citation page accuracy at least 90%.
- At least four of five absent questions refused.
- Quiz answerability at least 90%.
- Three demo rehearsals without broken citation navigation.

Store evaluation results by:

- Commit.
- Model.
- Prompt version.
- Embedding model.
- Extraction and bundled-demo asset version.

Do not silently change models or prompts after a passing evaluation.

## 4. Security controls

### Temporary session isolation

- Generate high-entropy opaque session IDs.
- Require the session header for all temporary resources.
- Resolve source and artifact IDs only inside the current session.
- Expire inactive sessions and bound total active sessions.
- Never expose the OpenAI key to the browser.
- Never expose the Sarvam key to the browser.
- Treat this as controlled-demo isolation, not public authentication.

### Files

- Allow PDF only in the first release.
- Validate magic bytes, MIME, file size, and page count.
- Reject encrypted, corrupt, and text-empty PDFs.
- Use randomized temporary paths; preserve display names as metadata only.
- Never execute or render embedded PDF scripts.
- Serve PDFs only through session-checked API routes.
- Bound parser time, memory, pages, and extracted characters.
- Remove failed uploads immediately and expired sessions on schedule.
- Treat browser recordings and generated audio as temporary files: validate
  media type, bytes, duration, decoding behavior, and safe response MIME type;
  randomize paths and remove them on completion, reset, expiry, or restart.

### API

- Strict Pydantic request and response schemas.
- Same-origin production deployment; restrict development CORS.
- Per-session and per-IP rate limits for upload, chat, and generation.
- Request size and question-length limits.
- One concurrent upload and generation per session.
- No stack traces or provider responses in client errors.
- Resolve narration text from a session-owned resource ID; reject arbitrary
  client-provided narration text.

### Model safety

- Treat uploaded text as untrusted data, not instructions.
- Delimit source chunks and tell the model to ignore instructions inside them.
- Never give the model secrets or service capabilities.
- Validate structured output and citations.
- Validate the entire Audio Overview script and citation allow-list before
  sending its transcript to TTS.
- Do not mix web search or external knowledge into grounded answers.
- Escape or sanitize generated Markdown before rendering.

### Privacy

- State that PDFs are processed by OpenAI for requested AI features.
- State that voice recordings are processed by Sarvam for transcription and
  that owned generated text is processed by Sarvam for optional narration.
- Explain temporary retention and reset behavior in the UI.
- Provide a Reset session action.
- Do not use uploaded course material as public demo data without permission.
- Do not log raw source text, user responses, speech transcripts, recordings,
  generated audio, session IDs, or tokens.

## 5. Threat checklist

- Cross-session source access through guessed resource IDs.
- Session-memory exhaustion.
- Path traversal through filenames.
- Malicious or decompression-heavy PDFs.
- Stored XSS in filenames or generated Markdown.
- Prompt injection inside uploaded notes.
- Forged model citation IDs.
- Temporary PDF route accessed without the correct session.
- Cached visual-deck PDF route accessed without the owning artifact and session.
- Unbounded generation or repeated retries causing cost abuse.
- Temporary filesystem exhaustion.
- Microphone recordings crafted to exhaust decoders or bypass duration limits.
- Narration endpoint abused as arbitrary TTS or to access another session's
  text/audio.

Every item requires either a test or a documented platform control.

## 6. Accessibility quality

Automated checks are necessary but insufficient:

- Run axe on primary screens.
- Navigate upload, chat, citation, viewer, and quiz by keyboard.
- Test visible focus and focus restoration.
- Test at 200% zoom.
- Test reduced motion.
- Check text and non-text contrast.
- Verify status and quiz result announcements with a screen reader.
- Keep a text excerpt available when PDF canvas content is inaccessible.
- Test push-to-talk and audio playback by keyboard and screen reader; never
  require a timed hold gesture as the only interaction.
- Verify every narrated artifact has an equivalent readable transcript and
  independently operable citations.

## 7. Performance budgets

Initial budgets:

- Useful app shell visible within 2.5 seconds on a typical college connection.
- UI interaction response under 100 ms where no network is required.
- Grounded answer median under 8 seconds after retrieval.
- Citation panel open under 300 ms when the PDF is loaded.
- Avoid shipping the PDF viewer on the landing page.
- Lazy-load recording/playback support and cap buffered audio memory.
- Virtualize or paginate long chat and artifact histories if needed.

Indexing time is variable; honest staged progress and recoverability matter more
than a misleading percentage.

## 8. Cost controls

- Default to a cost-conscious OpenAI model verified to support required
  structured outputs.
- Use `text-embedding-3-small`.
- Enforce page, chunk, question, artifact, and context limits.
- Precompute the bundled demo embeddings.
- Do not regenerate unchanged artifacts automatically.
- Record token usage and estimated cost per request.
- Add daily per-anonymous-user generation limits.
- Abort retries on authentication, billing, quota, and validation errors that
  cannot improve.
- Keep seeded demo results available if live API use is unavailable.
- Enforce Sarvam recording, character, audio-byte, and request limits; measure
  STT/TTS cost separately from OpenAI token cost.

The operator should configure an OpenAI project budget alert and a low hard
usage limit where available.

## 9. Demo resilience

- Pre-index the exact bundled demo source.
- Keep a second browser and fresh-session path tested.
- Store a local screen recording of the full flow.
- Do not upload or index for the first time during judging.
- Verify OpenAI credit, Azure status, and bundled PDF access before the
  presentation.
- Warm the Azure App Service before judging.
- Keep cached demo artifacts that can show answers and citations when live
  generation is unavailable.
- Keep a citation-validated bundled Audio Overview transcript and, only when
  redistribution is permitted, its audio as the speech fallback.

## 10. Release checklist

- Environment variables are documented and no secrets are committed.
- Both OpenAI and Sarvam keys are server-only and absent from frontend output.
- Critical test suites pass.
- RAG evaluation meets targets.
- Cross-session isolation and expiry tests pass.
- Reset removes all temporary session data.
- UI states and responsive widths are reviewed.
- Accessibility manual checks are recorded.
- Costs for three complete demo runs are measured.
- README contains setup, limitations, privacy note, and attribution.
- Three complete demo rehearsals pass.
- Voice denial/failure rehearsals confirm Chat, Teach-Back, and Audio Overview
  remain usable as text.
