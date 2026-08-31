import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState, type FormEvent } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AudioOverviewArtifact } from '../lib/session'
import { AudioOverviewOverlay } from './AudioOverviewOverlay'
import { NarrationPlayer } from './NarrationPlayer'
import { VoiceRecorder } from './VoiceRecorder'

class FakeMediaRecorder {
  static isTypeSupported = () => true
  state: RecordingState = 'inactive'
  mimeType = 'audio/webm'
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onerror: (() => void) | null = null
  onstop: (() => void) | null = null

  start() {
    this.state = 'recording'
  }

  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({
      data: new Blob(['voice'], { type: 'audio/webm' }),
    } as BlobEvent)
    this.onstop?.()
  }
}

function installRecorder() {
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder)
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },
  })
}

function RecorderHarness({
  initial = '',
  onSubmit,
}: {
  initial?: string
  onSubmit: () => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <form
      onSubmit={(event: FormEvent) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <label>
        Question
        <textarea value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <VoiceRecorder sessionId="session-1" onTranscript={setValue} />
      <button type="submit">Send</button>
    </form>
  )
}

const overview: AudioOverviewArtifact = {
  id: 'overview-1',
  type: 'audio_overview',
  title: 'Grounded overview',
  source_ids: ['source-1'],
  created_at: '2026-08-31T00:00:00Z',
  content: {
    audio_status: 'ready',
    estimated_duration_seconds: 210,
    prompt_version: 'audio_overview.v1',
    sections: [
      {
        title: 'Cost foundations',
        transcript: 'Explicit and implicit costs capture different sacrifices.',
        audio_clip_ids: ['clip-1'],
        citations: [
          {
            id: 'citation-1',
            chunk_id: 'chunk-1',
            source_id: 'source-1',
            source_name: 'Theory of Cost.pdf',
            page_start: 2,
            page_end: 2,
            excerpt: 'Explicit cost is an actual payment.',
            claim: 'Cost foundations',
            viewer_url: '/api/v1/sources/source-1/file#page=2',
          },
        ],
      },
    ],
  },
}

describe('voice learning controls', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    })
  })

  it('adds an editable transcript without submitting', async () => {
    installRecorder()
    const submit = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ transcript: 'What is total cost?', language_code: 'en-IN' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    render(<RecorderHarness onSubmit={submit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Record voice' }))
    fireEvent.click(
      await screen.findByRole('button', { name: /Stop recording/ }),
    )

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue(
        'What is total cost?',
      ),
    )
    expect(submit).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('preserves typed text when transcription fails', async () => {
    installRecorder()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: 'Voice is unavailable.',
            action: 'Continue typing.',
          },
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    render(<RecorderHarness initial="Keep this draft" onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Record voice' }))
    fireEvent.click(
      await screen.findByRole('button', { name: /Stop recording/ }),
    )

    expect(
      (await screen.findAllByText(/Voice is unavailable/)).length,
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue(
      'Keep this draft',
    )
  })

  it('loads owned answer and Teach-Back narration through session headers', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:luma-audio')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input) => {
        const url = String(input)
        if (url.startsWith('/api/v1/audio/')) {
          return new Response(new Blob(['audio']), {
            status: 200,
            headers: { 'Content-Type': 'audio/mpeg' },
          })
        }
        const isAnswer = url.includes('/chat/messages/')
        const resourceId = isAnswer ? 'answer-1' : 'teach-1'
        const clipId = isAnswer ? 'clip-1' : 'clip-2'
        return new Response(
          JSON.stringify({
            resource_id: resourceId,
            clips: [
              {
                id: clipId,
                url: `/api/v1/audio/${clipId}`,
                mime_type: 'audio/mpeg',
                sequence: 0,
                section_index: null,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      },
    )
    render(
      <>
        <NarrationPlayer
          sessionId="session-1"
          resource={{ kind: 'message', id: 'answer-1' }}
        />
        <NarrationPlayer
          sessionId="session-1"
          resource={{ kind: 'artifact', id: 'teach-1' }}
        />
      </>,
    )

    screen.getAllByRole('button', { name: 'Listen' }).forEach(fireEvent.click)

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Play' })).toHaveLength(2),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/chat/messages/answer-1/audio',
      expect.objectContaining({
        headers: { 'X-Session-ID': 'session-1' },
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/artifacts/teach-1/audio',
      expect.objectContaining({
        headers: { 'X-Session-ID': 'session-1' },
      }),
    )
  })

  it('keeps overview transcript citations keyboard accessible', () => {
    render(
      <AudioOverviewOverlay
        artifact={overview}
        sessionId="session-1"
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText(overview.content.sections[0].transcript)).toBeVisible()
    expect(
      screen.getByRole('button', {
        name: 'Citation 1: Theory of Cost.pdf, page 2',
      }),
    ).toBeEnabled()
    expect(
      screen.getByRole('link', { name: 'Cost foundations' }),
    ).toBeEnabled()
  })
})
