import { useEffect, useRef, useState } from 'react'

import {
  ApiRequestError,
  createArtifactNarration,
  createMessageNarration,
  fetchAudioClip,
  type AudioClip,
} from '../lib/session'

type NarrationPlayerProps = {
  sessionId: string
  resource: { kind: 'message' | 'artifact'; id: string }
  compact?: boolean
  onSectionChange?: (sectionIndex: number | null) => void
}

type LoadedClip = AudioClip & { objectUrl: string }

export function NarrationPlayer({
  sessionId,
  resource,
  compact = false,
  onSectionChange,
}: NarrationPlayerProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  )
  const [clips, setClips] = useState<LoadedClip[]>([])
  const [clipIndex, setClipIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const objectUrlsRef = useRef<string[]>([])

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = speed
    if (playing) {
      void audio.play().catch(() => {
        setPlaying(false)
        setError('Playback was blocked. Press Play to continue.')
      })
    }
  }, [clipIndex, playing, speed])

  async function loadNarration() {
    setStatus('loading')
    setError(null)
    try {
      const narration =
        resource.kind === 'message'
          ? await createMessageNarration(sessionId, resource.id)
          : await createArtifactNarration(sessionId, resource.id)
      const loaded = await Promise.all(
        narration.clips
          .slice()
          .sort((left, right) => left.sequence - right.sequence)
          .map(async (clip) => {
            const blob = await fetchAudioClip(sessionId, clip.url)
            const objectUrl = URL.createObjectURL(blob)
            objectUrlsRef.current.push(objectUrl)
            return { ...clip, objectUrl }
          }),
      )
      if (loaded.length === 0) throw new Error('No audio clips were returned.')
      setClips(loaded)
      setClipIndex(0)
      onSectionChange?.(loaded[0].section_index)
      setStatus('ready')
    } catch (requestError) {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
      setStatus('error')
      setError(
        requestError instanceof ApiRequestError
          ? `${requestError.message}${requestError.action ? ` ${requestError.action}` : ''}`
          : 'Narration is unavailable. The readable text is still available.',
      )
    }
  }

  function togglePlayback() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      setError(null)
      setPlaying(true)
    }
  }

  function replay() {
    const audio = audioRef.current
    if (!audio || clips.length === 0) return
    setClipIndex(0)
    audio.currentTime = 0
    onSectionChange?.(clips[0].section_index)
    setPlaying(true)
  }

  function nextClip() {
    const next = clipIndex + 1
    if (next >= clips.length) {
      setPlaying(false)
      return
    }
    setClipIndex(next)
    onSectionChange?.(clips[next].section_index)
    setPlaying(true)
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <div className={`narration-player ${compact ? 'is-compact' : ''}`}>
        <button
          className="voice-control"
          type="button"
          onClick={() => void loadNarration()}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Preparing audio…' : 'Listen'}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {status === 'loading' && 'Preparing narrated audio.'}
        </span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`narration-player ${compact ? 'is-compact' : ''}`}>
        <button type="button" onClick={() => void loadNarration()}>
          Retry audio
        </button>
        <span className="voice-inline-error" role="status">
          {error}
        </span>
      </div>
    )
  }

  const activeClip = clips[clipIndex]
  return (
    <div className={`narration-player ${compact ? 'is-compact' : ''}`}>
      <audio
        ref={audioRef}
        src={activeClip.objectUrl}
        onEnded={nextClip}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <button className="voice-control" type="button" onClick={togglePlayback}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <span className="narration-position">
        Clip {clipIndex + 1} of {clips.length}
      </span>
      <label>
        <span className="sr-only">Playback speed</span>
        <select
          value={speed}
          aria-label="Playback speed"
          onChange={(event) => setSpeed(Number(event.target.value))}
        >
          <option value={0.8}>0.8×</option>
          <option value={1}>1×</option>
          <option value={1.25}>1.25×</option>
          <option value={1.5}>1.5×</option>
        </select>
      </label>
      <button type="button" onClick={replay}>
        Replay
      </button>
      {error && (
        <span className="voice-inline-error" role="status">
          {error}
        </span>
      )}
    </div>
  )
}
