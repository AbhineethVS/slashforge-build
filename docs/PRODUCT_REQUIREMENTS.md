# Product Requirements

## 1. Product summary

**LUMA** is a source-grounded revision tool for college students. It turns
course PDFs into a workspace for cited questions, concise study material,
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

- English, digitally readable PDFs only; Phase 6 speech is English-India
  (`en-IN`) only.
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
- Audio Overview.
- Temporary learning memory.
- Infographics: a prompt-led visual deck with a cached bundled-demo fallback.

Studio uses the source selection from the left panel. Generated tools appear in
the panel without replacing the center chat.

### 5.8 Use grounded voice learning

1. The student explicitly starts and stops a bounded push-to-talk recording in
   Chat or Teach Back.
2. Sarvam Saaras v3 transcribes English-India speech into an editable text
   draft; the student reviews or changes it before submission.
3. The student may play narration only for LUMA-owned assistant answers and
   already backend-validated Teach-Back feedback.
4. From selected ready sources, the student may generate one 3–5 minute,
   single-narrator Audio Overview.
5. OpenAI builds the overview script from selected-source retrieval. The
   backend validates every cited chunk ID and maps it to trusted page metadata
   before Sarvam Bulbul v3 narrates the final transcript.

Acceptance criteria:

- Voice is optional and every flow remains usable through editable text.
- Push-to-talk has explicit start, recording, stop, transcribing, review,
  failure, and retry states; it never auto-submits a transcript.
- Narration does not read student-authored text, arbitrary PDFs, flashcards, or
  quizzes.
- Audio Overview always exposes its complete transcript and backend-validated
  page citations.
- Recording and generated audio are temporary, session-scoped, bounded, and
  removed on reset, expiry, or restart.
- Speech failures preserve the transcript or answer and provide a text
  fallback.

### 5.9 Use session learning memory

1. A quiz or Teach-Back attempt writes a concept-level memory record.
2. Deterministic code classifies understanding, confidence, and misconceptions.
3. Studio shows the shared memory map, including the open misconception and
   the next repair action.
4. Chat suggested questions and follow-ups prefer a contrast case for that
   misconception.
5. A later correct attempt or complete Teach-Back can mark the misconception
   as repairing or rechecked.

Learning memory is session-scoped. It resets with the temporary session and
does not persist across visits, accounts, or devices.

Acceptance criteria:

- A high-confidence wrong answer opens a misconception with source evidence.
- Chat, Quiz, Teach Back, and Studio read the same memory.
- The model cannot invent mastery or citation pages for memory records.
- Reset and expiry clear learning memory with the rest of the session.

### 5.10 Create an infographic presentation

1. The student opens **Infographics** in Studio and writes or edits a deck prompt.
2. The request is source-scoped and retained only with the temporary session.
3. The bundled economics demo opens a cached 15-slide PDF presentation while
   live deck composition is not yet available.
4. The student can preview and download the session-checked PDF.

Acceptance criteria:

- The fallback is visibly labeled as cached demo content, not newly generated.
- It is available only when the bundled economics source is the sole selected source.
- Another session cannot open or download the artifact.
- Reset and expiry remove the artifact record.

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
- Session learning memory shared by Chat, Quiz, Teach Back, and Studio.
- Right-side Studio panel for study tools.
- In-session state only.
- English-India push-to-talk Chat and Teach-Back dictation with editable
  transcripts.
- Optional narration of owned assistant answers and validated Teach-Back
  feedback.
- A cited 3–5 minute single-narrator Audio Overview with transcript.

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
- Video, audio-source, website, or YouTube ingestion.
- Multi-speaker podcasts or conversational audio overviews.
- Voice flashcards or voice quizzes.
- Collaborative notebooks or public sharing.
- LMS integrations.
- Native mobile applications.
- General web search mixed into source answers.
- Multi-agent workflows.
- User-selectable provider or model configuration.
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
- At least 90% usable English-India transcription on the fixed voice fixture
  set, with every transcript editable before submission.
- No unvalidated page citation or non-owned text reaches narration.

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
7. Show the new confident-misconception state and the Learning memory record.
8. Use Teach-Back to identify one missing point with evidence.
9. Generate or play the bundled-source Audio Overview, show its transcript,
   and open one validated page citation.

## 9. Risks

- PDF extraction loses layout or page fidelity.
- Retrieved chunks are relevant but insufficient for an answer.
- The model emits invalid or unsupported citations.
- Long processing blocks the demo.
- API billing, quota, or network failure interrupts the live presentation.
- Azure restarts and clears temporary sessions.
- Microphone permission, Sarvam availability, or speech quality interrupts a
  voice flow.

Mitigations are specified in
[AI_RAG_SPEC.md](AI_RAG_SPEC.md) and
[QUALITY_SECURITY.md](QUALITY_SECURITY.md).
