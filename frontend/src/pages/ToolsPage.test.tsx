import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ToolsPage } from './ToolsPage'

describe('ToolsPage', () => {
  it('renders the explore experience from the curated catalog', () => {
    render(
      <MemoryRouter>
        <ToolsPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /go beyond reading/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', {
        name: 'Search tools, subjects, or concepts',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Featured tools' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /python tutor/i }).length).toBeGreaterThan(0)
  })

  it('searches metadata and opens tools in a new tab', () => {
    render(
      <MemoryRouter>
        <ToolsPage />
      </MemoryRouter>,
    )

    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Search tools, subjects, or concepts',
      }),
      { target: { value: 'RC circuit' } },
    )

    const falstad = screen.getAllByRole('button', { name: /falstad/i })[0]
    fireEvent.click(falstad)
    const open = screen.getAllByRole('link', { name: /open tool/i })[0]
    expect(open).toHaveAttribute('target', '_blank')
    expect(open).toHaveAttribute('href', expect.stringContaining('falstad.com'))
  })

  it('filters by subject without exposing a raw URL list', () => {
    render(
      <MemoryRouter>
        <ToolsPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Electronics' }))
    expect(screen.getByRole('heading', { name: 'Matching tools' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /falstad/i }).length).toBeGreaterThan(0)
    expect(screen.queryByText('https://')).not.toBeInTheDocument()
  })
})
