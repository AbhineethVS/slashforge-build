import { useEffect, useRef, useState } from 'react'

import { ApiRequestError, transcribeVoice } from '../lib/session'
import { Icon } from './Icon'

type VoiceRecorderProps = {
  sessionId: string
  disabled?: boolean
  label?: string
  onTranscript: (transcript: string) => void
}

type RecorderState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'transcribing'
  | 'complete'
  | 'error'

const MAX_RECORDING_SECONDS = 30

export function VoiceRecorder({
  sessionId,
  disabled = false,
  label = 'Record voice',
  onTranscript,
}: VoiceRecorderProps) {
  const supported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  const [state, setState] = useState<RecorderState>('idle')
  const [secondsLeft, setSecondsLeft] = useState(MAX_RECORDING_SECONDS)
  const [error, setError] = useState<string | null>(null)
  const [canRetry, setCanRetry] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const lastRecordingRef = useRef<Blob | null>(null)
  const cancelledRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function closeStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(
    () => () => {
      clearTimer()
      const recorder = recorderRef.current
      cancelledRef.current = true
      if (recorder?.state === 'recording') recorder.stop()
      closeStream()
    },
    [],
  )

  async function transcribe(recording: Blob) {
    setState('transcribing')
    setError(null)
    try {
      const transcript = await transcribeVoice(sessionId, recording)
      onTranscript(transcript)
      setCanRetry(false)
      setState('complete')
    } catch (requestError) {
      setError(
        requestError instanceof ApiRequestError
          ? `${requestError.message}${requestError.action ? ` ${requestError.action}` : ''}`
          : 'The recording could not be transcribed. You can continue typing.',
      )
      setState('error')
    }
  }

  async function startRecording() {
    if (!supported || disabled) return
    setState('requesting')
    setError(null)
    setCanRetry(false)
    cancelledRef.current = false
    chunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const preferredType = [
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/webm',
      ].find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(
        stream,
        preferredType ? { mimeType: preferredType } : undefined,
      )
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        clearTimer()
        closeStream()
        setError('Recording failed. You can continue typing.')
        setState('error')
      }
      recorder.onstop = () => {
        clearTimer()
        closeStream()
        const recording = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        recorderRef.current = null
        if (cancelledRef.current) {
          chunksRef.current = []
          setState('idle')
          return
        }
        lastRecordingRef.current = recording
        setCanRetry(true)
        void transcribe(recording)
      }
      setSecondsLeft(MAX_RECORDING_SECONDS)
      recorder.start(250)
      setState('recording')
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((current) => {
          if (current <= 1) {
            if (recorder.state === 'recording') recorder.stop()
            return 0
          }
          return current - 1
        })
      }, 1000)
    } catch {
      clearTimer()
      closeStream()
      setError(
        'Microphone access was not available. Allow permission or continue typing.',
      )
      setState('error')
    }
  }

  function stopRecording(cancel = false) {
    cancelledRef.current = cancel
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
  }

  if (!supported) {
    return (
      <span className="voice-unavailable" title="Voice input is not supported here.">
        Voice unavailable
      </span>
    )
  }

  return (
    <div className="voice-recorder">
      {state === 'recording' ? (
        <>
          <button
            className="voice-control is-recording"
            type="button"
            onClick={() => stopRecording()}
            aria-label={`Stop recording, ${secondsLeft} seconds remaining`}
          >
            <Icon name="stop" size={14} />
            Stop · 0:{String(secondsLeft).padStart(2, '0')}
          </button>
          <button type="button" onClick={() => stopRecording(true)}>
            Cancel
          </button>
        </>
      ) : (
        <button
          className="voice-control"
          type="button"
          onClick={() => void startRecording()}
          disabled={
            disabled || state === 'requesting' || state === 'transcribing'
          }
        >
          <Icon name="mic" size={14} />
          {state === 'requesting'
            ? 'Opening microphone…'
            : state === 'transcribing'
              ? 'Transcribing…'
              : label}
        </button>
      )}
      {state === 'error' && canRetry && (
        <button
          type="button"
          onClick={() => void transcribe(lastRecordingRef.current!)}
        >
          Retry transcription
        </button>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {state === 'recording' && `Recording. ${secondsLeft} seconds remaining.`}
        {state === 'transcribing' && 'Transcribing your recording.'}
        {state === 'complete' &&
          'Transcript added. Review and edit it before submitting.'}
        {state === 'error' && error}
      </span>
      {error && <span className="voice-inline-error">{error}</span>}
    </div>
  )
}
