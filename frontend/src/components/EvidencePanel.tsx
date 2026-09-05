import { useEffect, useRef, useState } from 'react'

import {
  fetchSourcePdf,
  type Citation,
} from '../lib/session'
import { Icon } from './Icon'

type EvidencePanelProps = {
  citation: Citation
  sessionId: string
  onClose: () => void
}

export function EvidencePanel({
  citation,
  sessionId,
  onClose,
}: EvidencePanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ready'; url: string }
    | { status: 'error'; message: string }
  >({ status: 'loading' })

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    fetchSourcePdf(sessionId, citation.source_id)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setState({ status: 'ready', url: objectUrl })
      })
      .catch((error: unknown) => {
        if (!active) return
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'The source PDF could not be opened.',
        })
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [citation.source_id, sessionId])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, iframe, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
  }, [onClose])

  return (
    <aside
      ref={panelRef}
      className="evidence-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-title"
    >
      <div className="evidence-toolbar">
        <div>
          <p className="panel-kicker">Source evidence</p>
          <h1 id="evidence-title">{citation.source_name}</h1>
          <span>
            Page {citation.page_start}
            {citation.page_end !== citation.page_start
              ? `–${citation.page_end}`
              : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close evidence"
          autoFocus
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <blockquote className="evidence-excerpt">
        <p>{citation.excerpt}</p>
        <footer>Evidence for: {citation.claim}</footer>
      </blockquote>

      <div className="evidence-document">
        {state.status === 'loading' && (
          <div className="evidence-state" aria-busy="true">
            Loading cited page…
          </div>
        )}
        {state.status === 'error' && (
          <div className="evidence-state" role="alert">
            <strong>PDF unavailable</strong>
            <p>{state.message}</p>
            <p>The trusted excerpt remains available above.</p>
          </div>
        )}
        {state.status === 'ready' && (
          <iframe
            title={`${citation.source_name}, page ${citation.page_start}`}
            src={`${state.url}#page=${citation.page_start}`}
          />
        )}
      </div>
    </aside>
  )
}
