# Product Requirements

## 1. Product summary

AI Study Workspace is a source-grounded revision tool for college students. It
turns course PDFs into a workspace for cited questions, concise study material,
active recall, and teach-back practice.

The product is not a general chatbot and is not a complete adaptive-learning
platform. Its core promise is:

> Every factual answer should be traceable to the student's own material, and
> every study activity should help reveal what the student has not mastered.

## 2. Problem

Students often have large, fragmented notes but limited time to revise them.
Ordinary summarizers compress content without checking learning. Generic
chatbots can answer from outside knowledge, hide uncertainty, and provide no
fast path back to the source.

The product should reduce three types of friction:

1. Finding an answer across several course PDFs.
2. Verifying that answer against the exact source page.
3. Discovering weak understanding before an exam.

## 3. Target user

Primary user: a college student revising one subject from lecture notes,
handouts, or textbook chapters on a laptop.

Initial constraints:

- English, digitally readable PDFs only.
- One temporary session per browser with no login.
- One bundled demo PDF plus up to two temporary uploads.
- Up to 50 pages per uploaded PDF and 100 uploaded pages per session.
- Temporary uploads and activity may disappear after 60 minutes or a server
  restart.
- No claims that AI feedback is an authoritative grade.

## 4. Product principles

- Source before fluency: an unsupported polished answer is a failure.
- Evidence stays one click away.
- Active learning over passive content generation.
- The interface should make the next useful action obvious.
- Deterministic code owns scores and states; the model provides language and
  evidence.
- Reliability and demo polish outrank feature count.

## 5. Core user journeys

### 5.1 Understand the product and start

1. The visitor opens the landing page.
2. The hero explains source-grounded study assistance in one screen.
3. The visitor selects Start studying.
4. The application navigates to `/workspace`.

Acceptance criteria:

- The primary call to action is visible at common laptop sizes.
- The landing page requires no account, upload, or OpenAI request.
- The visitor can understand Sources, Chat, and Studio before entering.

### 5.2 Open and prepare the workspace

1. The workspace opens with a polished, pre-indexed demo source ready.
2. The student may upload one or two additional PDFs.
3. Each uploaded source reports uploading, extracting, embedding, ready, or
   failed.
4. The app offers suggested questions for ready sources.

Acceptance criteria:

- Unsupported or oversized files fail with a specific recovery action.
- The bundled demo remains usable if an upload or live API request fails.
- Refreshing recovers the session while the backend process and TTL remain
  active.
- Reset removes temporary files, chunks, embeddings, messages, and artifacts.
- The UI clearly labels temporary-session behavior.

### 5.3 Ask a grounded question

1. The student chooses which ready sources are active.
2. The student asks a question.
3. The assistant answers only from retrieved source chunks.
4. Citations identify the source and page.
5. Selecting a citation opens the source at that page.

Acceptance criteria:

- The assistant explicitly says when the sources do not contain enough
  evidence.
- Factual claims carry citations where practical.
- A citation never points to a source outside the current session and selected
  source set.
- The student can inspect the retrieved excerpt.

### 5.4 Generate a summary

The student generates a structured brief containing:

- Core concepts and definitions.
- Relationships or comparisons.
- Common confusions.
- Formulae or procedures when present.
- Likely revision questions.
- Citations for every section.

### 5.5 Practice active recall

1. The student starts a five-question quiz.
2. Questions mix MCQ and short-answer formats.
3. Before revealing feedback, the student records confidence.
4. The app shows the answer, explanation, and cited evidence.
5. The attempt updates concept mastery.

Attempt classifications:

- Mastered: correct with medium or high confidence.
- Lucky guess: correct with low confidence.
- Needs practice: incorrect with low or medium confidence.
- Confident misconception: incorrect with high confidence.

### 5.6 Teach back a concept

1. The student selects a concept and explains it in their own words.
2. The system compares the response with source-derived rubric points.
3. Feedback separates covered, missing, and potentially incorrect ideas.
4. Each factual correction includes source evidence.

Teach-Back is formative feedback, not grading.

### 5.7 Use Studio

The right-hand Studio panel is the home for generated learning tools:

- Summary.
- Flashcards.
- Quiz.
- Teach Back.
- Temporary progress signals.

Studio uses the source selection from the left panel. Generated tools appear in
the panel without replacing the center chat.

## 6. Release scope

### Must have

- Concise landing page with hero, product explanation, workspace preview, and
  Start studying CTA.
- Ready-to-use pre-indexed demo source.
- Temporary PDF upload, processing status, retry, delete, and reset.
- Source-scoped chat with page-level citations.
- Citation preview and PDF page navigation.
- Cited summary.
- Cited flashcards.
- Cited five-question quiz.
- Confidence capture and attempt classifications.
- Right-side Studio panel for study tools.
- In-session state only.

### Should have

- Suggested questions.
- Weak-concept summary and next-question recommendation.
- Teach-Back.
- Responsive tablet layout.

### Could have

- Ten-, twenty-, or thirty-minute Exam Sprint.
- Markdown/text note ingestion.
- Export of a study brief.

### Will not have in the hackathon release

- OCR or handwriting recognition.
- Video, audio, website, or YouTube ingestion.
- Audio overviews or podcasts.
- Collaborative notebooks or public sharing.
- LMS integrations.
- Native mobile applications.
- General web search mixed into source answers.
- Multi-agent workflows.
- Multi-provider model configuration.
- Full spaced-repetition scheduling.
- User accounts, durable cloud storage, and cross-device history.

## 7. Success measures

Technical release gates:

- At least 85% correct answers on the fixed answerable evaluation set.
- At least 90% correct citation pages.
- At least four of five absent-answer questions correctly refused.
- At least 90% of generated quiz questions answerable from cited evidence.
- No cross-session source access in isolation tests.
- No broken citation links in three full demo rehearsals.

Usability release gates:

- Four of five testers complete upload, cited question, and quiz without help.
- The first useful answer is reachable without reading documentation.
- All critical flows work at 375, 768, 1024, and 1440 pixel widths.

## 8. Demo narrative

1. Open the landing page and state the problem and value proposition.
2. Select Start studying to enter the ready workspace.
3. Show the left Sources panel and optionally upload one short PDF.
4. Ask a comparison question in the center Chat panel and jump to evidence.
5. Generate flashcards or a quiz from the right Studio panel.
6. Answer a quiz question incorrectly with high confidence.
7. Show the new confident-misconception state.
8. Use Teach-Back to identify one missing point with evidence.

## 9. Risks

- PDF extraction loses layout or page fidelity.
- Retrieved chunks are relevant but insufficient for an answer.
- The model emits invalid or unsupported citations.
- Long processing blocks the demo.
- API billing, quota, or network failure interrupts the live presentation.
- Azure restarts and clears temporary sessions.

Mitigations are specified in
[AI_RAG_SPEC.md](AI_RAG_SPEC.md) and
[QUALITY_SECURITY.md](QUALITY_SECURITY.md).
