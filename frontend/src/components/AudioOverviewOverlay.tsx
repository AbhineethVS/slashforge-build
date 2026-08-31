import { useEffect, useRef, useState, type MouseEvent } from 'react'

import type {
  AudioOverviewArtifact,
  Citation,
} from '../lib/session'
import { EvidencePanel } from './EvidencePanel'
import { NarrationPlayer } from './NarrationPlayer'

type AudioOverviewOverlayProps = {
  artifact: AudioOverviewArtifact
  sessionId: string
  onClose: () => void
}

export function AudioOverviewOverlay({
  artifact,
  sessionId,
  onClose,
}: AudioOverviewOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const citationTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [currentSection, setCurrentSection] = useState<number | null>(null)
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (activeCitation) return
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
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
  }, [activeCitation, onClose])

  function showCitation(
    citation: Citation,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    citationTriggerRef.current = event.currentTarget
    setActiveCitation(citation)
  }

  function closeCitation() {
    setActiveCitation(null)
    window.setTimeout(() => citationTriggerRef.current?.focus(), 0)
  }

  return (
    <div className="practice-backdrop">
      <div
        ref={dialogRef}
        className="practice-dialog audio-overview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audio-overview-title"
        tabIndex={-1}
      >
        <header className="practice-header">
          <div>
            <p className="panel-kicker">Grounded Audio Overview</p>
            <h1 id="audio-overview-title">{artifact.title}</h1>
            <p>
              About {Math.max(1, Math.round(artifact.content.estimated_duration_seconds / 60))}{' '}
              minutes · {artifact.content.sections.length} sections
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Audio Overview">
            Close
          </button>
        </header>

        {artifact.content.fallback && (
          <p className="fallback-notice">
            Cached demo transcript · live generation was unavailable.
          </p>
        )}
        {artifact.content.audio_status === 'unavailable' && (
          <p className="audio-unavailable-notice" role="status">
            Narration is currently unavailable. The complete cited transcript
            remains available below.
          </p>
        )}

        <div className="audio-overview-player">
          <NarrationPlayer
            sessionId={sessionId}
            resource={{ kind: 'artifact', id: artifact.id }}
            onSectionChange={setCurrentSection}
          />
        </div>

        <div className="audio-overview-layout">
          <nav aria-label="Overview sections">
            <ol>
              {artifact.content.sections.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#overview-section-${index + 1}`}
                    aria-current={currentSection === index ? 'true' : undefined}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <article className="audio-overview-transcript">
            {artifact.content.sections.map((section, index) => (
              <section
                key={section.title}
                id={`overview-section-${index + 1}`}
                className={currentSection === index ? 'is-current' : undefined}
              >
                <p className="panel-kicker">Section {index + 1}</p>
                <h2>{section.title}</h2>
                <p>{section.transcript}</p>
                <div className="citation-list" aria-label={`${section.title} citations`}>
                  {section.citations.map((citation, citationIndex) => (
                    <button
                      key={`${citation.id}-${citation.chunk_id}`}
                      type="button"
                      onClick={(event) => showCitation(citation, event)}
                      aria-label={`Citation ${citationIndex + 1}: ${citation.source_name}, page ${citation.page_start}`}
                    >
                      [{citationIndex + 1}] {citation.source_name}, p.
                      {citation.page_start}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
      {activeCitation && (
        <EvidencePanel
          key={activeCitation.id}
          citation={activeCitation}
          sessionId={sessionId}
          onClose={closeCitation}
        />
      )}
    </div>
  )
}
