import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('explains the product and links directly to the workspace', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        name: /study what matters.*verify every answer/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: /start studying/i })[0],
    ).toHaveAttribute('href', '/workspace')
    expect(
      screen.getAllByRole('link', { name: /explore tools/i })[0],
    ).toHaveAttribute('href', '/tools')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

