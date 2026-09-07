import { describe, expect, it } from 'vitest'

import { LEARNING_TOOLS } from './catalog'
import { recommendChatTool, recommendTools } from './recommend'
import { searchTools } from './search'

describe('learning tool search', () => {
  it('finds circuit simulators for RC circuit queries', () => {
    const names = searchTools(LEARNING_TOOLS, 'RC circuit').map((tool) => tool.name)
    expect(names.some((name) => /falstad/i.test(name))).toBe(true)
    expect(names.some((name) => /circuit/i.test(name))).toBe(true)
  })

  it('finds processor tools for CPU queries', () => {
    const names = searchTools(LEARNING_TOOLS, 'CPU').map((tool) => tool.name)
    expect(names.some((name) => /ripes/i.test(name))).toBe(true)
    expect(names.some((name) => /nand2tetris/i.test(name))).toBe(true)
  })

  it('finds molecular viewers and anatomy tools', () => {
    expect(
      searchTools(LEARNING_TOOLS, 'molecules').some((tool) => /molview/i.test(tool.name)),
    ).toBe(true)
    expect(
      searchTools(LEARNING_TOOLS, '3d anatomy').some((tool) =>
        /anatomy|biodigital/i.test(tool.name),
      ),
    ).toBe(true)
  })
})

describe('tool recommendations', () => {
  it('returns sparse featured tools when the query is empty', () => {
    const tools = recommendTools('', 3)
    expect(tools.length).toBeLessThanOrEqual(3)
    expect(tools.every((tool) => tool.featured)).toBe(true)
  })

  it('recommends a chat tip for circuit questions with citations', () => {
    const tip = recommendChatTool({
      question: 'Explain Ohm’s law for an RC circuit and how current changes.',
      answer:
        'Ohm’s law relates voltage and current. In an RC circuit the capacitor charges over time.',
      hasCitations: true,
    })
    expect(tip).not.toBeNull()
    expect(tip?.name).toMatch(/falstad|circuit|phet/i)
  })

  it('skips chat tips without citations or with abstention', () => {
    expect(
      recommendChatTool({
        question: 'Explain Ohm’s law for an RC circuit.',
        answer: 'Voltage and current are related.',
        hasCitations: false,
      }),
    ).toBeNull()
    expect(
      recommendChatTool({
        question: 'Explain Ohm’s law for an RC circuit.',
        answer: 'Not enough evidence.',
        hasCitations: true,
        insufficientEvidence: true,
      }),
    ).toBeNull()
  })

  it('avoids repeating a recently suggested tool', () => {
    const first = recommendChatTool({
      question: 'Show me how an RC circuit behaves.',
      answer: 'Current in an RC circuit decays as the capacitor charges.',
      hasCitations: true,
    })
    expect(first).not.toBeNull()
    const second = recommendChatTool({
      question: 'Show me how an RC circuit behaves.',
      answer: 'Current in an RC circuit decays as the capacitor charges.',
      hasCitations: true,
      excludeIds: first ? [first.id] : [],
    })
    expect(second?.id).not.toBe(first?.id)
  })
})
