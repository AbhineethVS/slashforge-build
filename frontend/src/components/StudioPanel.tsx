import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import {
  ApiRequestError,
  deleteStudioArtifact,
  generateStudioArtifact,
  type Citation,
  type SourceSummary,
  type StudioArtifact,
  type SummaryArtifact,
} from '../lib/session'
import { PracticeOverlay } from './PracticeOverlay'

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

type StudioPanelProps = {
  sessionId: string
  selectedSources: SourceSummary[]
  initialArtifacts: StudioArtifact[]
  onCitation: (citation: Citation, trigger: HTMLButtonElement) => void
}

const tools = [
  ['summary', 'Summary', 'Build a cited revision brief.'],
  ['flashcards', 'Flashcards', 'Recall key ideas in a focused deck.'],
  ['quiz', 'Quiz', 'Test understanding and confidence.'],
] as const

export function StudioPanel({
  sessionId,
  selectedSources,
  initialArtifacts,
  onCitation,
}: StudioPanelProps) {
  const [artifacts, setArtifacts] =
    useState<StudioArtifact[]>(initialArtifacts)
  const [activeSummary, setActiveSummary] =
    useState<SummaryArtifact | null>(null)
  const [practiceArtifact, setPracticeArtifact] = useState<
    Extract<StudioArtifact, { type: 'flashcards' | 'quiz' }> | null
  >(null)
  const [generation, setGeneration] = useState<
    | { status: 'idle' }
    | { status: 'loading'; kind: StudioArtifact['type'] }
    | { status: 'error'; kind: StudioArtifact['type']; message: string; action?: string }
  >({ status: 'idle' })
  const launcherRef = useRef<HTMLButtonElement | null>(null)

  async function generate(
    kind: StudioArtifact['type'],
    trigger?: HTMLButtonElement,
  ) {
    if (selectedSources.length === 0 || generation.status === 'loading') return
    if (trigger) launcherRef.current = trigger
    setGeneration({ status: 'loading', kind })
    try {
      const artifact = await generateStudioArtifact(
        sessionId,
        kind,
        selectedSources.map((source) => source.id),
      )
      setArtifacts((current) => [
        artifact,
        ...current.filter((item) => item.id !== artifact.id),
      ])
      setGeneration({ status: 'idle' })
      openArtifact(artifact)
    } catch (error) {
      const requestError =
        error instanceof ApiRequestError
          ? error
          : new ApiRequestError('The study tool could not be generated.')
      setGeneration({
        status: 'error',
        kind,
        message: requestError.message,
        action: requestError.action,
      })
    }
  }

  function openArtifact(artifact: StudioArtifact) {
    if (artifact.type === 'summary') {
      setActiveSummary(artifact)
    } else {
      setPracticeArtifact(artifact)
    }
  }

  function closePractice() {
    setPracticeArtifact(null)
    window.setTimeout(() => launcherRef.current?.focus(), 0)
  }

  async function removeArtifact(artifactId: string) {
    try {
      await deleteStudioArtifact(sessionId, artifactId)
      setArtifacts((current) =>
        current.filter((artifact) => artifact.id !== artifactId),
      )
    } catch (error) {
      setGeneration({
        status: 'error',
        kind: 'summary',
        message:
          error instanceof Error
            ? error.message
            : 'The generated item could not be removed.',
      })
    }
  }

  if (activeSummary) {
    return (
      <aside className="studio-panel studio-summary" aria-labelledby="studio-title">
        <button
          className="studio-back"
          type="button"
          onClick={() => setActiveSummary(null)}
        >
          Back to Studio
        </button>
        <p className="panel-kicker">Cited summary</p>
        <h1 id="studio-title">{activeSummary.title}</h1>
        {activeSummary.content.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <ReactMarkdown allowedElements={summaryMarkdownElements}>
              {section.content_markdown}
            </ReactMarkdown>
            <CitationButtons
              citations={section.citations}
              onCitation={onCitation}
            />
          </section>
        ))}
        <section className="revision-questions">
          <h2>Revision questions</h2>
          <ul>
            {activeSummary.content.revision_questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      </aside>
    )
  }

  return (
    <>
      <aside className="studio-panel" aria-labelledby="studio-title">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">Active learning</p>
            <h1 id="studio-title">Studio</h1>
          </div>
        </div>
        <p className="studio-intro">
          Create study tools from {selectedSources.length}{' '}
          {selectedSources.length === 1 ? 'selected source' : 'selected sources'}.
        </p>
        {selectedSources.length > 0 && (
          <p className="studio-source-names">
            {selectedSources.map((source) => source.display_name).join(', ')}
          </p>
        )}

        <div className="studio-tools">
          {tools.map(([kind, title, description]) => (
            <button
              key={kind}
              type="button"
              onClick={(event) => void generate(kind, event.currentTarget)}
              disabled={
                selectedSources.length === 0 || generation.status === 'loading'
              }
            >
              <strong>
                {generation.status === 'loading' && generation.kind === kind
                  ? `Generating ${title}…`
                  : title}
              </strong>
              <span>{description}</span>
            </button>
          ))}
          <button type="button" disabled>
            <strong>Teach Back</strong>
            <span>Formative feedback arrives in Phase 5.</span>
          </button>
        </div>

        {generation.status === 'error' && (
          <div className="studio-error" role="alert">
            <strong>Generation failed</strong>
            <p>{generation.message}</p>
            {generation.action && <p>{generation.action}</p>}
            <button
              type="button"
              onClick={() => void generate(generation.kind)}
            >
              Retry
            </button>
          </div>
        )}

        {artifacts.length > 0 && (
          <section className="recent-artifacts" aria-labelledby="recent-title">
            <h2 id="recent-title">Generated study tools</h2>
            <ul>
              {artifacts.map((artifact) => (
                <li key={artifact.id}>
                  <button
                    type="button"
                    onClick={(event) => {
                      launcherRef.current = event.currentTarget
                      openArtifact(artifact)
                    }}
                  >
                    <strong>{artifact.title}</strong>
                    <span>
                      {artifact.type === 'summary'
                        ? 'Summary'
                        : artifact.type === 'flashcards'
                          ? `${artifact.content.cards.length} flashcards`
                          : `${artifact.content.questions.length} questions`}
                    </span>
                  </button>
                  <button
                    className="artifact-remove"
                    type="button"
                    onClick={() => void removeArtifact(artifact.id)}
                    aria-label={`Remove ${artifact.title}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="session-ready" role="status">
          <span aria-hidden="true" />
          Studio ready
        </div>
      </aside>

      {practiceArtifact && (
        <PracticeOverlay
          artifact={practiceArtifact}
          sessionId={sessionId}
          onClose={closePractice}
        />
      )}
    </>
  )
}

function CitationButtons({
  citations,
  onCitation,
}: {
  citations: Citation[]
  onCitation: (citation: Citation, trigger: HTMLButtonElement) => void
}) {
  return (
    <div className="citation-list" aria-label="Section citations">
      {citations.map((citation, index) => (
        <button
          key={`${citation.id}-${citation.chunk_id}`}
          type="button"
          onClick={(event) => onCitation(citation, event.currentTarget)}
          aria-label={`Citation ${index + 1}: ${citation.source_name}, page ${citation.page_start}`}
        >
          [{index + 1}] p.{citation.page_start}
        </button>
      ))}
    </div>
  )
}
