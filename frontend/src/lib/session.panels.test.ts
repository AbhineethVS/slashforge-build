import { describe, expect, it } from 'vitest'

import {
  constrainPanelWidths,
  DEFAULT_SOURCES_WIDTH,
  DEFAULT_STUDIO_WIDTH,
  MAX_STUDIO_WIDTH,
  MIN_CHAT_WIDTH,
  MIN_SOURCES_WIDTH,
  MIN_STUDIO_WIDTH,
  persistPanelWidths,
  restorePanelWidths,
} from './session'

describe('panel width helpers', () => {
  it('restores defaults when nothing is stored', () => {
    expect(restorePanelWidths()).toEqual({
      sources: DEFAULT_SOURCES_WIDTH,
      studio: DEFAULT_STUDIO_WIDTH,
    })
  })

  it('persists and restores panel widths within bounds', () => {
    persistPanelWidths({ sources: 300, studio: 400 })
    expect(restorePanelWidths()).toEqual({ sources: 300, studio: 400 })
  })

  it('keeps enough room for chat when sides grow too wide', () => {
    const available = MIN_SOURCES_WIDTH + MIN_STUDIO_WIDTH + MIN_CHAT_WIDTH + 40
    const next = constrainPanelWidths(
      { sources: MAX_STUDIO_WIDTH, studio: MAX_STUDIO_WIDTH },
      available,
    )
    expect(next.sources + next.studio).toBeLessThanOrEqual(
      available - MIN_CHAT_WIDTH,
    )
    expect(next.sources).toBeGreaterThanOrEqual(MIN_SOURCES_WIDTH)
    expect(next.studio).toBeGreaterThanOrEqual(MIN_STUDIO_WIDTH)
  })
})
