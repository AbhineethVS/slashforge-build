# UX Design Specification

## 1. Experience goal

The interface should feel like a focused study desk, not an AI marketing page.
It must make source evidence, current activity, and the next revision action
visible without overwhelming the student.

Design direction: **academic editorial clarity + modern productivity
workspace**.

Avoid:

- Generic purple AI gradients.
- Excessive glassmorphism.
- Large decorative cards that reduce working space.
- Chat bubbles for long academic answers.
- Animation that delays reading.
- Icon-only controls without labels or accessible names.
- Dashboard metrics that do not change a study decision.

## 2. Information architecture

The product has a concise landing page and one workspace, not a dashboard of
persistent notebooks:

- `/`: product landing page.
- `/workspace`: Sources–Chat–Studio workspace.
- `/tools`: curated Learning Tools / Explore page for specialist interactive
  sites. Same catalog can recommend a tool inside Studio when a concept is
  already in session memory.
- No account, notebook list, settings area, or separate progress route.

The three permanent desktop regions are:

1. Sources on the left.
2. Chat in the center.
3. Studio on the right.

Label the third panel **Studio**. “LM Studio” is the name of a separate local
model application and would create unnecessary product confusion.

## 3. Landing page

The landing page explains the value quickly and directs users into the working
demo. It must not become a second product.

### Navigation

- **LUMA** wordmark on the left.
- Optional anchor links to How it works and Why LUMA.
- A quiet **Explore tools** link to `/tools`.
- Primary **Start studying** button on the right.

### Hero

- Clear outcome-focused headline.
- One short supporting paragraph explaining source-grounded chat and active
  revision.
- Primary **Start studying** button linking to `/workspace`.
- Secondary **Explore tools** button linking to `/tools`.
- A **See how it works** text link that scrolls down.
- A polished static or lightweight interactive preview of the
  Sources–Chat–Studio workspace.

Do not put an upload control in the hero. Upload and the bundled demo belong in
the workspace.

### Supporting sections

Keep the page short:

1. How it works: add sources, ask with citations, practise in Studio.
2. Feature highlights: grounded Chat, page citations, Flashcards, Quiz, and
   Teach Back; Phase 6 may also preview grounded voice learning without
   implying that it is already implemented.
3. Why it is trustworthy: answers stay tied to selected material and abstain
   when evidence is missing.
4. Final call to action linking to `/workspace`.

Avoid fabricated testimonials, customer logos, pricing, waitlists, and generic
AI statistics. The landing page should load without calling OpenAI.

### Responsive and accessibility behavior

- The hero CTA stays visible without scrolling at common laptop sizes.
- The workspace preview simplifies rather than becoming unreadably miniature.
- Heading order, landmarks, links, and CTA focus states are semantic.
- Decorative preview content is hidden appropriately from assistive
  technologies.
- Reduced-motion users receive no parallax or autoplaying animation.

## 4. Primary workspace

### Desktop, 1024 px and above

Use three regions:

1. **Sources**, approximately 240–280 px: bundled demo source, temporary
   uploads, selection, status, and Add source.
2. **Chat**, flexible and dominant: conversation, suggested questions,
   citations, and anchored composer.
3. **Studio**, approximately 300–360 px: Summary, Flashcards, Quiz, Teach Back,
   Audio Overview, Learning memory, and Progress tools.

Each panel has a clear heading and independent scrolling. The page itself
should not develop multiple competing scrollbars. Sources and Studio may
collapse to icon-and-label rails when the viewport is constrained.

Selecting a citation opens an evidence sheet over the right side with the PDF
at the cited page. Closing it restores the exact Studio tool and state; the
evidence viewer is not a fourth permanent panel.

### Tablet, 768–1023 px

- Chat remains visible and dominant.
- Sources and Studio become independently opened side sheets.
- Only one side sheet is open at a time.
- Evidence temporarily occupies the Studio sheet.

### Mobile, 375–767 px

- One region at a time.
- A compact header exposes Sources and Studio buttons.
- Sources, Studio, and evidence use full-height sheets.
- Citation selection opens the PDF on the cited page with a clear Back to
  Answer action.

Desktop quality is the judging priority, but mobile must not clip or lose data.

## 5. Core flows

### First run

1. Open directly into the workspace with the demo source already selected.
2. Show two or three useful suggested questions in Chat.
3. Mark the demo source as included and ready.
4. Offer Add source as a secondary action with temporary-storage disclosure.
5. After an upload, show stage-specific progress in the source row.

Only one dominant call to action should appear per state.

### Ask and verify

- Composer placeholder reflects active sources.
- Active source count appears next to the composer.
- An Answer format selector offers Auto, Concise points, Table, Steps, Code,
  and Paragraph. Auto selects the most suitable validated format.
- Answers use document typography rather than rounded chat bubbles.
- Comparisons render as semantic tables with horizontally scrollable overflow
  on narrow screens; explanations and procedures use readable lists; algorithm
  requests render in preformatted code blocks.
- Citation markers are compact numbered buttons.
- Hover/focus shows source name, page, and excerpt.
- Selection opens evidence and highlights the active citation.
- Follow-up prompts appear after the answer, not before evidence.
- New questions autoscroll the Chat panel to the latest turn.
- When the session has prompts, a thin marker rail sits on the right edge of
  Chat. Hover or focus reveals truncated earlier questions; choosing one
  scrolls that prompt into view.

### Studio

- The default Studio view uses compact tool cards for Summary, Flashcards,
  Quiz, Teach Back, Infographics, and Audio Overview.
- Learning memory sits below the tool cards and shows concept state, open
  misconceptions, cited evidence pages, and the next repair action.
- Summary opens in place within Studio with a clear Back to Studio action.
- Flashcards and Quiz open in a large, centered Practice overlay. The workspace
  remains visible under restrained dimming and background blur.
- Closing Practice returns focus to its Studio launcher. Generated decks and
  quizzes remain in a compact Studio list and can be reopened.
- The active source count and source names are visible before generation.
- Summary uses sections with citations, not one unbroken paragraph.
- Flashcards show one large card at a time and support reveal, previous/next,
  shuffle, touch swipe, and keyboard navigation without decorative 3D motion.
- Quiz shows one question at a time and follows the confidence flow below.
- Choosing Quiz first opens a compact setup dialog. Uploading previous-year
  papers is optional. Skip continues with the mixed cited quiz. Papers are
  described as style-only, session-temporary, and not added to Sources.
  Starting generation dismisses the setup dialog so the student can keep
  using the workspace; Close and Escape also dismiss it without cancelling
  generation.
- Evidence opens over the right side of Practice and restores the exact card
  or question when closed.
- Tool state survives opening a citation or temporarily collapsing Studio.
- Infographics opens a concise prompt editor. The bundled-demo fallback is
  explicitly described as a cached PDF presentation before submission and in
  the preview, with a keyboard-accessible close action and PDF download.
- Avoid placing all generated artifacts in the center Chat transcript.

### Quiz

- Show one question at a time.
- Do not reveal correctness until confidence is selected.
- A clearly labeled Fill demo answer action may supply a generated sample
  response for presentations, but it does not bypass confidence or submission.
- Confidence uses three labeled choices, not color-only icons.
- Feedback visually separates result, explanation, and source evidence.
- Progress shows question number, not an artificial percentage mastery claim.
- At completion, prioritize misconceptions and next action over celebratory
  effects. Direct the student back to Learning memory when a confident
  misconception was recorded.

### Teach Back

- Prompt explains the expected response length.
- Editor supports plain text only in the first release.
- Feedback groups Covered, Missing, and Check this idea.
- Each correction is linked to evidence.
- Use language such as “The source suggests” rather than “You are wrong” when
  judgment is semantic.

### Grounded voice learning

- Chat and Teach-Back expose a labeled push-to-talk control beside the existing
  text input. Voice is optional and does not replace typing.
- Recording begins only after an explicit pointer or keyboard action. Show
  recording state, elapsed time, duration cap, Stop, and Cancel without relying
  on color or animation.
- After transcription, place the editable transcript in the existing composer
  or Teach-Back editor. Never auto-submit it.
- Handle microphone permission denial, no captured speech, upload failure, and
  transcription failure inline while preserving typed text.
- Owned assistant answers may show a Play answer control. Validated Teach-Back
  feedback may show Play feedback. Do not offer narration for student text,
  arbitrary source text, flashcards, or quizzes.
- Narration never autoplays. Controls expose loading, play/pause, replay, and
  failure states and leave readable text available.
- Audio Overview opens within Studio and shows selected sources before
  generation, a 3–5 minute target, single-narrator label, generation progress,
  audio controls, complete transcript, and page citation controls.
- If overview narration fails, keep the validated transcript and citations as
  the successful core artifact and offer Retry audio.
- Cached bundled overview audio must be labeled as a fallback artifact and
  used only when redistribution is allowed.

### Explore tools

`/tools` is a discovery library for curated interactive sites. It is not a
second study product and does not mix external pages into grounded answers.

- Hero search matches name, description, subjects, modes, and keywords.
- Featured picks appear first; the full catalog is reached by search or filter.
- Hover or focus inspects a card in place without reflowing the grid. Touch
  taps toggle the same inspect state. External tools always open in a new tab.
- Studio may show at most one **Go interactive** recommendation when session
  learning memory already has a recommended concept.
- Chat may show at most one compact **Go interactive** tip under a cited
  grounded answer when the question and answer match a catalog tool strongly
  enough. Skip abstentions and answers without citations. Do not repeat the
  same tool for the next two tips. Keep the tip Listen-sized, open the tool
  externally, and never mix it into citation evidence.

## 6. Visual system

The product name is **LUMA**. The brand mark is the gradient `L` app icon
(`frontend/public/luma-mark.png`, with `favicon-32.png`, `favicon-64.png`, and
`luma-mark-512.png` derived from the same artwork). Pair the mark with the LUMA
wordmark on the landing page and in the workspace header. Keep colors and
spacing on semantic tokens so logo refinements do not force component rewrites.

### Themes

The product ships a light and a dark theme. Both are first-class: no screen may
be legible in only one of them.

- `data-theme` on `<html>` selects the theme; every component reads semantic
  tokens only, never a raw hex value or a theme-specific override.
- An inline script in `index.html` resolves the theme before first paint from
  `localStorage['luma.theme']`, falling back to `prefers-color-scheme`.
- The header exposes one labelled toggle. An explicit choice is persisted; until
  the student makes one, the system preference wins.

### Color intent

Neutrals are cool rather than warm, matching the brand mark.

- Background: near-white in light, near-black indigo in dark.
- Surface: an elevated panel surface plus a quieter secondary surface.
- Text: primary, muted, and faint roles at AA contrast in both themes.
- Accent: indigo for actions, selection, citations, and active navigation. The
  blue-to-violet brand gradient is reserved for the mark, the header hairline,
  the selected-source indicator, and one hero word.
- Warning: amber for needs-practice and cached fallbacks.
- Critical: muted red for failed processing and confident misconceptions.
- Success: green reserved for ready sources and verified completion.

All text and interactive states must meet WCAG AA contrast in both themes.
Status never depends on color alone. Do not accept a palette solely because the
hex values look cohesive.

### Typography

- Interface: Inter, with a system sans-serif fallback stack.
- Display: Instrument Serif for page, panel, and artifact titles only, with a
  Georgia fallback. It never carries body copy or interface labels.
- Code: a monospace stack for generated code blocks.
- Body line length: approximately 65–80 characters.
- Minimum body size: 16 px in reading surfaces.
- Use tabular numerals for page numbers and progress counts.

### Spacing and shape

- Base spacing unit: 4 px.
- Common rhythm: 8, 12, 16, 24, 32 px.
- Radius tokens run from 6 px controls to 24 px dialogs; nested cards should not
  each add another border.
- Use separators and whitespace before shadows; shadows stay soft and low.

### Iconography

Use the single stroke icon family in `frontend/src/components/Icon.tsx`. Icons
are always `aria-hidden` and clarify actions but never replace critical labels.
Emojis are content only, never interface icons.

## 7. Component inventory

Foundation:

- Landing navigation, hero, workspace preview, feature sections, and CTA.
- Three-panel app shell, compact header, collapsible rails, responsive sheets.
- Button, icon button, input, textarea, tooltip, dialog, dropdown, toast.
- Skeleton, progress indicator, empty state, inline error, retry panel.

Domain:

- Source row and source upload zone.
- Processing status timeline.
- Active source selector.
- Question composer.
- Grounded answer.
- Citation marker, preview, and evidence toolbar.
- PDF viewer.
- Studio home and Studio tool shell.
- Summary section.
- Flashcard deck and card.
- Quiz question, confidence selector, and answer feedback.
- Concept state badge.
- Learning memory map and open-misconception card.
- Teach-Back editor and rubric feedback.
- Push-to-talk recorder and editable transcript review.
- Owned-answer narration controls and accessible audio player.
- Audio Overview generator, transcript, and cited sections.

Reuse domain components across routes rather than building page-local variants.

## 8. Source states

Each source row must distinguish:

- Uploading: determinate progress when available.
- Extracting: reading pages.
- Embedding: preparing search.
- Ready: selectable.
- Failed: concise reason, Retry, and Delete.

Status meaning cannot rely on color. Include text and an icon. Long filenames
must truncate with an accessible full-name tooltip.

## 9. Empty, loading, and error states

- Session expired: reload the bundled demo and explain that temporary work was
  cleared.
- No answer evidence: state that the selected material does not support an
  answer and suggest selecting another source or asking differently.
- API billing unavailable: keep existing work accessible and tell the operator
  where configuration is required without exposing account details.
- Speech unavailable: preserve editable text, validated feedback, or overview
  transcript and offer typing, reading, or Retry audio as appropriate.
- Streaming interrupted: preserve partial text, mark it incomplete, and offer
  Regenerate.
- Temporary PDF unavailable: keep citation metadata and excerpt visible.

Never replace the whole workspace with a spinner when ready sources can remain
interactive.

## 10. Motion

- Interaction feedback: 100–180 ms.
- Panels: 180–240 ms.
- No looping decorative motion.
- Respect `prefers-reduced-motion`.
- The final semantic state and focus must remain correct if an animation is
  interrupted.

## 11. Accessibility

- Use semantic landmarks, headings, buttons, forms, and dialogs.
- Maintain visible keyboard focus.
- Move focus deliberately when opening/closing evidence sheets.
- Announce upload and processing state changes through a polite live region.
- Announce quiz correctness only after confidence submission.
- Support 200% browser zoom without horizontal loss of critical content.
- Touch targets are at least 44 by 44 CSS pixels where practical.
- Citation popovers are keyboard-operable and do not contain hover-only data.
- PDFs require a text excerpt fallback because canvas rendering is not enough
  for screen readers.
- Recording and playback controls have persistent text labels, expose state to
  assistive technology, and work by keyboard without requiring a timed
  press-and-hold gesture.
- Audio Overview narration has a synchronized readable transcript; citations
  remain operable independently of audio.

## 12. Content style

- Use direct, calm language.
- Say “Sources do not contain enough information” instead of blaming the user.
- Say “AI-generated; verify with source” in generated artifacts.
- Keep source names and page numbers explicit.
- Avoid claims such as “guaranteed,” “perfect,” or “exam-ready.”

## 13. UX validation checklist

Before a page is considered complete:

- It works at 375, 768, 1024, and 1440 px.
- Keyboard-only use reaches every action in logical order.
- Loading, empty, success, partial, and failure states are represented.
- Text and chips reflow without clipping.
- Long filenames and generated content do not break layout.
- Every interactive element has hover, focus, disabled, and busy behavior.
- Reduced-motion behavior works.
- Citation-to-page navigation works three times consecutively.
- A student can identify the next action within five seconds.
