---
name: slashforge-quality
description: Tests and reviews LUMA for correctness, groundedness, privacy, security, accessibility, performance, and demo readiness. Use when writing tests, evaluating RAG, reviewing changes, hardening uploads or authorization, checking accessibility, measuring cost, or preparing a release.
---

# LUMA Quality

## Read first

Read:

- `docs/QUALITY_SECURITY.md`
- Relevant acceptance criteria in `docs/PRODUCT_REQUIREMENTS.md`
- Relevant invariant in `docs/ARCHITECTURE.md` or `docs/AI_RAG_SPEC.md`

## Review order

Review in this order:

1. Temporary session isolation and resource limits.
2. Citation trust and groundedness.
3. Cleanup, expiry, and reset.
4. Error recovery and idempotency.
5. Core user-flow correctness.
6. Accessibility and responsive behavior.
7. Performance and cost.
8. Visual polish.

Do not approve a polished flow with an ownership or citation defect.

## Required adversarial cases

Test:

- Another session's source, artifact, and temporary PDF route.
- An expired or malformed session ID.
- Model output containing a fabricated chunk ID.
- Source text containing instructions to ignore the system prompt.
- Encrypted, corrupt, image-only, oversized, and misleadingly named files.
- Interrupted upload, ingestion, embedding, generation, and stream.
- Repeated retries, simultaneous operations, and session-memory limits.
- OpenAI authentication, rate-limit, billing, timeout, and malformed-output
  failures.
- Sarvam authentication, rate-limit, timeout, malformed STT/TTS, and partial
  speech failures with preserved text fallback.
- Oversized, over-duration, malformed, cross-session, and repeatedly retried
  recordings and generated audio.
- Arbitrary-client-text narration attempts and unvalidated Audio Overview
  citations.
- Long filenames, long words, long answers, narrow screens, and 200% zoom.

## RAG diagnosis

For every wrong answer, record the earliest failed stage:

- Extraction omitted or corrupted the evidence.
- Chunking separated necessary context.
- Retrieval missed the expected chunk.
- Context selection discarded it.
- Generation misread supplied evidence.
- Citation validation or UI mapping was wrong.

Report retrieval hit@5, answer correctness, citation precision, citation-page
accuracy, claim coverage, and abstention accuracy separately.

## Accessibility review

- Run automated checks but also use keyboard-only navigation.
- Verify focus movement for sheets, dialogs, citations, and the PDF viewer.
- Verify live announcements for source states and quiz results.
- Verify reduced motion and WCAG AA contrast.
- Ensure PDF evidence has a selectable text excerpt fallback.
- Check 375, 768, 1024, and 1440 px widths.

## Privacy and logging review

Reject changes that log or expose:

- Session IDs or API keys.
- Temporary filesystem paths.
- Uploaded source text.
- Student answers in operational logs.
- OpenAI credentials in browser code.
- Sarvam credentials in browser code.
- Speech transcripts, recordings, or generated audio in operational logs.

Logs may include hashed user identifiers, resource IDs, stage timings, model
names, token usage, retrieval scores, validated chunk IDs, and bounded speech
metrics such as duration, bytes, character count, and failure category.

## Release gate

Before release, verify:

- Required automated tests pass.
- RAG evaluation meets documented targets.
- Cross-session isolation, expiry, and reset tests pass.
- Temporary files and memory are removed.
- Temporary recordings, transcripts, narrations, and overview audio are
  session-isolated, bounded, and removed.
- English-India dictation stays editable; narration ownership and Audio
  Overview citation validation tests pass.
- Every speech failure leaves the equivalent typed or readable flow usable.
- Three full demo rehearsals pass.
- The bundled demo source, cached fallback artifacts, and recording are
  available.
- OpenAI credit and project cost controls are checked.
- Sarvam credit, rate limits, speech cost controls, and server-only key
  configuration are checked.
- Bundled overview audio is included only with confirmed redistribution rights.
- Documentation matches behavior.

When a target is missed, report the measured result and blocker. Do not weaken
the target or label an unmeasured claim as passed.
