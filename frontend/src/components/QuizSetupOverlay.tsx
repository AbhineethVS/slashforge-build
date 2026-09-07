import { useEffect, useId, useRef, useState } from 'react'

import { Icon } from './Icon'

const MAX_EXAM_PAPERS = 2

type QuizSetupOverlayProps = {
  sourceNames: string[]
  busy: boolean
  error?: { message: string; action?: string }
  onGenerate: (papers: File[]) => void
  onClose: () => void
}

export function QuizSetupOverlay({
  sourceNames,
  busy,
  error,
  onGenerate,
  onClose,
}: QuizSetupOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const [papers, setPapers] = useState<File[]>([])

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (busy || event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
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
  }, [busy, onClose])

  function addFiles(list: FileList | null) {
    if (!list) return
    const incoming = Array.from(list).filter(
      (file) =>
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf'),
    )
    setPapers((current) => [...current, ...incoming].slice(0, MAX_EXAM_PAPERS))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="practice-backdrop">
      <div
        ref={dialogRef}
        className="practice-dialog quiz-setup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="practice-header">
          <div>
            <p className="panel-kicker">Quiz</p>
            <h1 id={titleId}>Match exam style</h1>
            <p>
              Optional. Upload one or two previous-year papers so the quiz can
              follow that question style. Answers still come only from{' '}
              {sourceNames.join(', ') || 'your selected sources'}.
            </p>
          </div>
          <button type="button" onClick={onClose}>
            <Icon name="close" size={14} />
            Close
          </button>
        </header>

        <div className="quiz-setup-body">
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={busy || papers.length >= MAX_EXAM_PAPERS}
            aria-label="Choose previous-year papers"
            onChange={(event) => addFiles(event.target.files)}
          />
          <button
            className="quiz-setup-upload"
            type="button"
            disabled={busy || papers.length >= MAX_EXAM_PAPERS}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="file" size={16} />
            {papers.length >= MAX_EXAM_PAPERS
              ? 'Two papers added'
              : 'Upload previous-year papers'}
          </button>
          <p className="quiz-setup-note">
            Use a text PDF, not a scan. Papers are read for style only and are
            not added as study sources.
          </p>
          {papers.length > 0 && (
            <ul className="quiz-setup-files">
              {papers.map((file, index) => (
                <li key={`${file.name}-${file.size}-${index}`}>
                  <span>{file.name}</span>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Remove ${file.name}`}
                    onClick={() =>
                      setPapers((current) =>
                        current.filter((_, item) => item !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <div className="studio-error" role="alert">
              <strong>Quiz could not be generated</strong>
              <p>{error.message}</p>
              {error.action && <p>{error.action}</p>}
            </div>
          )}
        </div>

        <footer className="quiz-setup-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => onGenerate([])}
          >
            {busy && papers.length === 0 ? 'Generating quiz…' : 'Skip and generate'}
          </button>
          <button
            className="quiz-setup-primary"
            type="button"
            disabled={busy || papers.length === 0}
            onClick={() => onGenerate(papers)}
          >
            {busy && papers.length > 0
              ? 'Matching exam style…'
              : 'Generate styled quiz'}
          </button>
        </footer>
      </div>
    </div>
  )
}
