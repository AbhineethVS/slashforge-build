---
name: slashforge-frontend
description: Designs, implements, and reviews the AI Study Workspace frontend using the project UX system. Use for React, Vite, Tailwind, shadcn/ui, responsive layout, Sources–Chat–Studio panels, PDF evidence views, chat, flashcards, quizzes, accessibility, or visual-polish work.
---

# SlashForge Frontend

## Read first

Read:

- `docs/UX_DESIGN_SPEC.md`
- Relevant journey in `docs/PRODUCT_REQUIREMENTS.md`
- Relevant contract in `docs/DATA_AND_API_SPEC.md`

Do not invent API states or product behavior that conflict with those files.

## Design workflow

Before implementing a screen:

1. Identify the user's immediate goal and the one dominant action.
2. List loading, empty, partial, success, failure, disabled, and retry states.
3. Decide desktop, tablet, and mobile behavior.
4. Reuse existing domain components and semantic tokens.
5. Implement semantic HTML and keyboard behavior before decorative polish.
6. Verify the screen at 375, 768, 1024, and 1440 px.

## Product visual direction

Use academic editorial clarity with a modern productivity-workspace layout.

- Prefer warm neutral surfaces, near-black text, deep blue actions, and
  restrained semantic accents.
- Use whitespace and separators before shadows.
- Keep generated study content readable at 65–80 characters per line.
- Keep Sources on the left, Chat dominant in the center, and Studio on the
  right.
- Use one SVG icon family; do not use emojis as interface icons.
- Avoid generic AI gradients, gratuitous glassmorphism, oversized cards,
  nested borders, and chat bubbles for long answers.
- Do not add animation unless it explains state or spatial change.

## Domain rules

- Keep `/` as a concise static landing page and `/workspace` as the functional
  app.
- The landing hero has one dominant Start studying action linking to
  `/workspace`; do not place upload or OpenAI calls on the landing page.
- Source status always includes text; never communicate it by color alone.
- Keep ready sources usable while another source processes.
- Factual answers display citation controls near supported claims.
- Citation controls expose source, page, and excerpt to keyboard and pointer
  users.
- Selecting a citation opens the trusted page in the evidence viewer.
- Citation evidence temporarily overlays the right side and restores Studio
  state when closed.
- Summary, Flashcards, Quiz, Teach Back, and Progress belong in Studio rather
  than the Chat transcript.
- Quiz correctness remains hidden until the student selects confidence.
- Confident misconception is serious feedback, not a celebratory state.
- Teach-Back uses formative, uncertainty-aware language.

## Component rules

- Build primitives from shadcn/ui/Radix where they fit; wrap them in project
  components rather than scattering variants.
- Use semantic design tokens instead of page-specific color values.
- Keep state local and temporary; use `sessionStorage` only for documented UI
  state and the opaque backend session ID.
- Lazy-load the PDF viewer and other heavy code.
- Use native controls and links when custom behavior is unnecessary.
- Give icon buttons accessible names and tooltips.
- Support long filenames, generated text, browser zoom, and text scaling.

## Accessibility gate

Verify:

- Logical heading structure and landmarks.
- Visible focus and predictable tab order.
- Focus trapping/restoration for sheets and dialogs.
- Polite live announcements for processing state.
- Keyboard-operable citation previews.
- Text excerpt fallback for PDF evidence.
- WCAG AA contrast.
- `prefers-reduced-motion`.
- No clipping at 200% zoom.

## Delivery gate

Do not call a page complete until:

- Real API states or contract-faithful fixtures are represented.
- Empty, loading, failure, and retry paths work.
- Keyboard and responsive checks pass.
- Relevant component tests exist.
- No OpenAI key or trusted citation metadata is generated in browser code.
