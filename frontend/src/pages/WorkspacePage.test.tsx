import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { WorkspacePage } from './WorkspacePage'

const session = {
  id: 'c47dcf01-ea9a-47d9-b4cc-80a7bf8c12f8',
  created_at: '2026-08-30T00:00:00Z',
  expires_at: '2026-08-30T01:00:00Z',
  sources: [
    {
      id: '8f4d0f62-5b8a-4f1e-9c2d-6a7b1c3d4e5f',
      display_name: 'Economics - Theory of Cost.pdf',
      kind: 'bundled',
      page_count: 43,
      status: 'ready',
      error_code: null,
    },
  ],
  messages: [],
  artifacts: [],
  attempts: [],
  suggested_questions: [
    'What is the difference between explicit and implicit cost?',
    'Explain the relation between total cost, total fixed cost, and total variable cost.',
  ],
}

describe('WorkspacePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a temporary session and shows the workspace shell', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(session), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Preparing your study desk' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Chat' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sources' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Studio' })).toBeInTheDocument()
    expect(
      screen.getByRole('separator', {
        name: 'Resize Chat and Studio panels',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText('Economics - Theory of Cost.pdf').length,
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('1 active source')).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'What is the difference between explicit and implicit cost?',
      }),
    ).toBeInTheDocument()
    expect(sessionStorage.getItem('luma.session_id')).toBe(session.id)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/session', { method: 'POST' })
  })

  it('recovers by creating a session when the stored one expired', async () => {
    sessionStorage.setItem('luma.session_id', 'expired-session')
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 410 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(
      await screen.findByRole('heading', { name: 'Chat' }),
    ).toBeInTheDocument()
    expect(sessionStorage.getItem('luma.session_id')).toBe(session.id)
  })

  it('shows a recoverable error when session creation fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: 'The demo is temporarily full.' } }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The demo is temporarily full.',
    )
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
  })

  it('uploads a PDF and adds the ready source', async () => {
    const uploadedSource = {
      id: '50afd35a-17a0-46b8-a333-04a328affd00',
      display_name: 'my-notes.pdf',
      kind: 'uploaded',
      page_count: 3,
      status: 'ready',
      error_code: null,
    }
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(uploadedSource), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Sources' })
    fireEvent.change(screen.getByLabelText('Choose a PDF source'), {
      target: {
        files: [new File(['%PDF-readable'], 'my-notes.pdf', { type: 'application/pdf' })],
      },
    })

    expect(await screen.findByText('Ready · 3 pages')).toBeInTheDocument()
    expect(screen.getByText('my-notes.pdf')).toBeInTheDocument()
    expect(screen.getByText('2 active sources')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/sources',
      expect.objectContaining({
        method: 'POST',
        headers: { 'X-Session-ID': session.id },
      }),
    )
  })

  it('shows upload recovery and retries the same file', async () => {
    const error = {
      error: {
        code: 'SOURCE_TEXT_NOT_FOUND',
        message: 'This PDF does not contain enough readable text.',
        retryable: false,
        action: 'Upload a digitally generated PDF instead.',
      },
    }
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(error), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: '50afd35a-17a0-46b8-a333-04a328affd00',
            display_name: 'scan.pdf',
            kind: 'uploaded',
            page_count: 2,
            status: 'ready',
            error_code: null,
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Sources' })
    fireEvent.change(screen.getByLabelText('Choose a PDF source'), {
      target: {
        files: [new File(['%PDF-scan'], 'scan.pdf', { type: 'application/pdf' })],
      },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This PDF does not contain enough readable text.',
    )
    expect(
      screen.getByText('Upload a digitally generated PDF instead.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Ready · 2 pages')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('removes an uploaded source', async () => {
    const withUpload = {
      ...session,
      sources: [
        ...session.sources,
        {
          id: '50afd35a-17a0-46b8-a333-04a328affd00',
          display_name: 'temporary.pdf',
          kind: 'uploaded',
          page_count: 4,
          status: 'ready',
          error_code: null,
        },
      ],
    }
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(withUpload), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )
    await screen.findByText('temporary.pdf')
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    await waitFor(() =>
      expect(screen.queryByText('temporary.pdf')).not.toBeInTheDocument(),
    )
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/v1/sources/50afd35a-17a0-46b8-a333-04a328affd00',
      {
        method: 'DELETE',
        headers: { 'X-Session-ID': session.id },
      },
    )
  })

  it('selects sources and submits a grounded question', async () => {
    const answer = {
      id: '88563a22-8bba-4d4d-8b56-5227729b27ee',
      role: 'assistant',
      content_markdown: '**Explicit cost** is a direct monetary payment.',
      citations: [
        {
          id: 'citation-1',
          chunk_id: '83479ac1-c190-46ec-a835-b21ed5e8d005',
          source_id: session.sources[0].id,
          source_name: session.sources[0].display_name,
          page_start: 5,
          page_end: 5,
          excerpt: 'Explicit cost is the money expenditure incurred.',
          claim: 'Explicit costs are direct monetary payments.',
          viewer_url: `/api/v1/sources/${session.sources[0].id}/file#page=5`,
        },
      ],
      insufficient_evidence: false,
      follow_up_questions: ['How does implicit cost differ?'],
      status: 'complete',
      created_at: '2026-08-30T05:00:00Z',
    }
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(answer), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(new Blob(['%PDF-evidence'], { type: 'application/pdf' }), {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        }),
      )
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:evidence'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )
    const suggestion = await screen.findByRole('button', {
      name: 'What is the difference between explicit and implicit cost?',
    })
    fireEvent.click(suggestion)
    const input = screen.getByRole('textbox', {
      name: 'Ask your selected sources',
    })
    expect(input).toHaveValue(
      'What is the difference between explicit and implicit cost?',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }))

    expect(
      await screen.findByText('Explicit cost', { selector: 'strong' }),
    ).toBeInTheDocument()
    const citation = screen.getByRole('button', {
      name: 'Citation 1: Economics - Theory of Cost.pdf, page 5',
    })
    fireEvent.click(citation)
    expect(
      await screen.findByRole('heading', {
        name: 'Economics - Theory of Cost.pdf',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Explicit cost is the money/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close evidence' }))
    await waitFor(() => expect(citation).toHaveFocus())
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/chat/messages',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': session.id,
        },
      }),
    )
  })

  it('requires at least one selected source before asking', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(session), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Sources' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Use in chat' }))

    expect(screen.getByText('0 active sources')).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Ask your selected sources' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
  })

  it('generates flashcards in a large practice overlay', async () => {
    const flashcards = {
      id: 'c828a8f4-6136-4931-9393-6747c1aaf45e',
      type: 'flashcards',
      title: 'Theory of Cost cards',
      content: {
        cards: Array.from({ length: 6 }, (_, index) => ({
          id: `card-${index}`,
          front: `Card question ${index + 1}`,
          back_markdown: `**Card answer ${index + 1}**`,
          concept_label: 'Costs',
          difficulty: 'recall',
          citations: [],
        })),
      },
      source_ids: [session.sources[0].id],
      created_at: '2026-08-30T05:00:00Z',
    }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(flashcards), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Flashcards/ }))

    expect(
      await screen.findByRole('dialog', { name: 'Theory of Cost cards' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Card question 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reveal answer' }))
    expect(screen.getByText('Card answer 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Card question 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.getByText('Generated study tools')).toBeInTheDocument()
    expect(screen.getByText('6 flashcards')).toBeInTheDocument()
  })

  it('uses a demo quiz answer without revealing feedback early', async () => {
    const quiz = {
      id: 'ed4d3f55-00c5-4db1-bf08-438e0d9fbb93',
      type: 'quiz',
      title: 'Theory of Cost quiz',
      content: {
        questions: Array.from({ length: 5 }, (_, index) => ({
          id: `question-${index}`,
          type: 'mcq',
          prompt: `Quiz prompt ${index + 1}?`,
          options: ['Correct answer', 'Option B', 'Option C', 'Option D'],
          expected_answer: 'Correct answer',
          explanation_markdown: `Explanation ${index + 1}`,
          demo_response: 'Correct answer',
          concept_label: 'Costs',
          difficulty: 'understanding',
          citations: [],
        })),
      },
      source_ids: [session.sources[0].id],
      created_at: '2026-08-30T05:00:00Z',
    }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(quiz), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'attempt-1',
            artifact_id: quiz.id,
            activity_type: 'quiz',
            concept_label: 'Costs',
            confidence: 1,
            is_correct: true,
            classification: 'lucky_guess',
            feedback:
              'Correct, but low confidence suggests this is worth revisiting.',
            created_at: '2026-08-30T05:01:00Z',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            total_attempts: 1,
            concepts: [],
            recommended_concept: null,
            recommendation: 'Complete another question.',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /^Quiz/ }))
    await screen.findByRole('dialog', { name: 'Theory of Cost quiz' })

    expect(screen.queryByText('Expected answer')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Fill demo answer/ }))
    expect(screen.getByRole('radio', { name: 'Correct answer' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: 'Low' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }))

    expect(await screen.findByText('Expected answer')).toBeInTheDocument()
    expect(screen.getByText('Lucky guess signal')).toBeInTheDocument()
    expect(screen.getByText('Explanation 1')).toBeInTheDocument()
  })

  it('keeps cited summaries inside Studio', async () => {
    const summary = {
      id: '7c1d2a66-d399-4c82-9e0e-504494ae3a55',
      type: 'summary',
      title: 'Theory of Cost summary',
      content: {
        sections: [
          {
            title: 'Explicit cost',
            content_markdown: 'Direct monetary payments.',
            citations: [],
          },
          {
            title: 'Implicit cost',
            content_markdown: 'Opportunity cost of owned inputs.',
            citations: [],
          },
        ],
        revision_questions: ['How do the two costs differ?'],
      },
      source_ids: [session.sources[0].id],
      created_at: '2026-08-30T05:00:00Z',
    }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(summary), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /^Summary/ }))

    expect(
      await screen.findByRole('heading', { name: 'Theory of Cost summary' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Direct monetary payments.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Back to Studio' }),
    ).toBeInTheDocument()
  })

  it('shows a confident misconception and updates Studio progress', async () => {
    const quiz = {
      id: 'ed4d3f55-00c5-4db1-bf08-438e0d9fbb93',
      type: 'quiz',
      title: 'Confidence check',
      content: {
        questions: [
          {
            id: 'question-1',
            type: 'mcq',
            prompt: 'Which equation is correct?',
            options: ['TC = TFC + TVC', 'TC = TFC - TVC', 'TFC = TC + TVC', 'None'],
            expected_answer: 'TC = TFC + TVC',
            explanation_markdown: 'Total cost combines fixed and variable cost.',
            demo_response: 'TC = TFC + TVC',
            concept_label: 'Total cost',
            difficulty: 'understanding',
            citations: [],
          },
        ],
      },
      source_ids: [session.sources[0].id],
      created_at: '2026-08-30T05:00:00Z',
    }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(quiz), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'attempt-wrong',
            artifact_id: quiz.id,
            activity_type: 'quiz',
            concept_label: 'Total cost',
            confidence: 3,
            is_correct: false,
            classification: 'confident_misconception',
            feedback:
              'Your high confidence and incorrect answer signal a misconception to revisit.',
            created_at: '2026-08-30T05:01:00Z',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            total_attempts: 1,
            concepts: [
              {
                concept_label: 'Total cost',
                attempt_count: 1,
                classification: 'confident_misconception',
                mastered: 0,
                lucky_guess: 0,
                needs_practice: 0,
                confident_misconception: 1,
                unscored: 0,
              },
            ],
            recommended_concept: 'Total cost',
            recommendation: 'Teach back Total cost using the source evidence.',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /^Quiz/ }))
    await screen.findByRole('dialog', { name: 'Confidence check' })
    fireEvent.click(screen.getByRole('radio', { name: 'TC = TFC - TVC' }))
    fireEvent.click(screen.getByRole('radio', { name: 'High' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }))

    expect(
      await screen.findByText('Confident misconception'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Misconception')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Teach back Total cost' }),
    ).toBeInTheDocument()
  })

  it('returns cited formative Teach-Back feedback', async () => {
    const feedback = {
      id: 'teach-back-1',
      type: 'teach_back',
      title: 'Teach Back: Total cost',
      content: {
        concept: 'Total cost',
        rubric_points: [],
        covered: [{ text: 'Total cost includes fixed and variable cost.', citations: [] }],
        missing: [{ text: 'Fixed cost does not vary with output.', citations: [] }],
        check_this: [],
        next_prompt: 'Why can variable cost be zero?',
      },
      source_ids: [session.sources[0].id],
      created_at: '2026-08-30T05:00:00Z',
    }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(feedback), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            total_attempts: 1,
            concepts: [],
            recommended_concept: null,
            recommendation: 'Complete a quiz next.',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: /^Teach Back/ }))
    fireEvent.change(screen.getByLabelText('Concept'), {
      target: { value: 'Total cost' },
    })
    fireEvent.change(screen.getByLabelText('Your explanation'), {
      target: {
        value:
          'Total cost is the combined cost a firm faces when producing output.',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Get cited feedback' }))

    expect(
      await screen.findByRole('heading', { name: 'Teach Back: Total cost' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Covered')).toBeInTheDocument()
    expect(screen.getByText('Missing')).toBeInTheDocument()
    expect(screen.getByText('Check this idea')).toBeInTheDocument()
  })

  it('exposes responsive Sources and Studio sheet controls', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(session), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    )

    const sourcesButton = await screen.findByRole('button', { name: 'Sources' })
    const studioButton = screen.getByRole('button', { name: 'Studio' })
    fireEvent.click(sourcesButton)
    expect(sourcesButton).toHaveAttribute('aria-expanded', 'true')
    expect(
      await screen.findByRole('dialog', { name: 'Sources' }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Close Sources panel' }),
      ).toHaveFocus(),
    )
    fireEvent.click(studioButton)
    expect(studioButton).toHaveAttribute('aria-expanded', 'true')
    expect(sourcesButton).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Close Studio panel' }))
    await waitFor(() => expect(studioButton).toHaveFocus())
  })
})

