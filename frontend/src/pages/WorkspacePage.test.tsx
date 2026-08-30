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
    expect(screen.getByText('Economics - Theory of Cost.pdf')).toBeInTheDocument()
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
})

