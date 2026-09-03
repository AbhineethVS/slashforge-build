import { useEffect, useRef, useState } from 'react'

import {
  fetchVisualDeckPdf,
  type VisualDeckArtifact,
} from '../lib/session'

type VisualDeckOverlayProps = {
  artifact: VisualDeckArtifact
  sessionId: string
  onClose: () => void
}

export function VisualDeckOverlay({
  artifact,
  sessionId,
  onClose,
}: VisualDeckOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    void fetchVisualDeckPdf(sessionId, artifact.content.file_url)
      .then((pdf) => {
        if (!active) return
        objectUrl = URL.createObjectURL(pdf)
        setPdfUrl(objectUrl)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(
          reason instanceof Error
            ? reason.message
            : 'The visual deck could not be opened.',
        )
      })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [artifact.content.file_url, sessionId])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], iframe, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="practice-backdrop">
      <div
        ref={dialogRef}
        className="practice-dialog visual-deck-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="visual-deck-title"
        tabIndex={-1}
      >
        <header className="practice-header">
          <div>
            <p className="panel-kicker">Visual Deck</p>
            <h1 id="visual-deck-title">{artifact.title}</h1>
            <p>{artifact.content.page_count} slides · PDF presentation</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Visual Deck">
            Close
          </button>
        </header>
        <p className="fallback-notice">
          Cached demo deck · your request was saved with this temporary session.
          Live deck composition will replace this fallback in a later iteration.
        </p>
        <div className="visual-deck-request">
          <strong>Your requested focus</strong>
          <p>{artifact.content.prompt}</p>
        </div>
        {error ? (
          <div className="studio-error" role="alert">
            <strong>Deck preview unavailable</strong>
            <p>{error}</p>
          </div>
        ) : !pdfUrl ? (
          <p className="visual-deck-loading" role="status">
            Opening the presentation…
          </p>
        ) : (
          <>
            <div className="visual-deck-preview">
              <iframe title={`${artifact.title} PDF preview`} src={pdfUrl} />
            </div>
            <a
              className="visual-deck-download"
              href={pdfUrl}
              download="the-economic-blueprint.pdf"
            >
              Download PDF presentation
            </a>
          </>
        )}
      </div>
    </div>
  )
}
