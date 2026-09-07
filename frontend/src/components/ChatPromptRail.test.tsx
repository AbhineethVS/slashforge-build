import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ChatPromptRail } from './ChatPromptRail'

describe('ChatPromptRail', () => {
  it('renders nothing without prompts', () => {
    const { container } = render(
      <ChatPromptRail prompts={[]} onJump={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('lists prompts and jumps on click', () => {
    const onJump = vi.fn()
    render(
      <ChatPromptRail
        prompts={[
          { id: 'a', text: 'How does merge sort divide an array?' },
          {
            id: 'b',
            text: 'Can you explain quicksort pivot selection with a longer question text for truncation?',
          },
        ]}
        onJump={onJump}
      />,
    )

    expect(
      screen.getByRole('navigation', { name: 'Jump to earlier questions' }),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'How does merge sort divide an array?',
      }),
    )
    expect(onJump).toHaveBeenCalledWith('a')
    expect(
      screen.getByRole('button', {
        name: /Can you explain quicksort pivot selection/,
      }).textContent,
    ).toMatch(/…$/)
  })
})
