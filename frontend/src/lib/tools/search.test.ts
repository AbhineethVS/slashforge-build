import { describe, expect, it } from 'vitest'

import { LEARNING_TOOLS } from './catalog'
import { recommendTools } from './recommend'
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
})
