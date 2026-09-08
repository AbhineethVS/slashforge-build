import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import ReactMarkdown from 'react-markdown'

import {
  stripVisibleChunkIds,
  type Citation,
  type SummaryArtifact,
} from '../lib/session'
import { EvidencePanel } from './EvidencePanel'
import { Icon } from './Icon'

const summaryMarkdownElements = [
  'p',
  'h3',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'blockquote',
  'code',
]

type SummaryOverlayProps = {
  artifact: SummaryArtifact
  sessionId: string
  onClose: () => void
}

export function SummaryOverlay({
  artifact,
  sessionId,
  onClose,
}: SummaryOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const citationTriggerRef = useRef<HTMLButtonElement | null>(null)
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
        'button, [href], [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return
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

  function openEvidence(
    citation: Citation,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    citationTriggerRef.current = event.currentTarget
    setActiveCitation(citation)
  }

  function closeEvidence() {
    setActiveCitation(null)
    window.setTimeout(() => citationTriggerRef.current?.focus(), 0)
  }

  return (
    <div className="practice-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className="practice-dialog summary-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-overlay-title"
        tabIndex={-1}
      >
        <header className="practice-header">
          <div>
            <p className="panel-kicker">Cited summary</p>
            <h1 id="summary-overlay-title">
              {stripVisibleChunkIds(artifact.title)}
            </h1>
          </div>
          <button type="button" onClick={onClose}>
            <Icon name="close" size={15} />
            Close
          </button>
        </header>

        {artifact.content.fallback && (
          <p className="fallback-notice">
            <Icon name="alert" size={14} />
            Cached demo brief · live generation was unavailable.
          </p>
        )}

        <div className="summary-overlay-body">
          {artifact.content.sections.map((section) => (
            <section key={section.title}>
              <h2>{stripVisibleChunkIds(section.title)}</h2>
              <ReactMarkdown allowedElements={summaryMarkdownElements}>
                {stripVisibleChunkIds(section.content_markdown)}
              </ReactMarkdown>
              <div
                className="citation-list"
                aria-label={`${section.title} citations`}
              >
                {section.citations.map((citation, index) => (
                  <button
                    key={`${citation.id}-${citation.chunk_id}`}
                    type="button"
                    title={`${citation.source_name}, page ${citation.page_start}`}
                    aria-label={`Citation ${index + 1}: ${citation.source_name}, page ${citation.page_start}`}
                    onClick={(event) => openEvidence(citation, event)}
                  >
                    [{index + 1}] p.{citation.page_start}
                  </button>
                ))}
              </div>
            </section>
          ))}

          <section className="revision-questions">
            <h2>Revision questions</h2>
            <ul>
              {artifact.content.revision_questions.map((question) => (
                <li key={question}>{stripVisibleChunkIds(question)}</li>
              ))}
            </ul>
          </section>
        </div>

        {activeCitation && (
          <div className="practice-evidence">
            <EvidencePanel
              key={activeCitation.id}
              citation={activeCitation}
              sessionId={sessionId}
              onClose={closeEvidence}
            />
          </div>
        )}
      </div>
    </div>
  )
}
