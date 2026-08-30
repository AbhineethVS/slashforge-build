import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { WorkspacePage } from './WorkspacePage'

const session = {
  id: 'c47dcf01-ea9a-47d9-b4cc-80a7bf8c12f8',
  created_at: '2026-08-30T00:00:00Z',
  expires_at: '2026-08-30T01:00:00Z',
  sources: [],
  messages: [],
  artifacts: [],
  attempts: [],
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
})

