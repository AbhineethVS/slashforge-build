import { useEffect, useRef, useState, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'

import {
  ApiRequestError,
  deleteStudioArtifact,
  fetchProgress,
  generateTeachBack,
  generateStudioArtifact,
  type Citation,
  type Progress,
  type SourceSummary,
  type StudioArtifact,
  type SummaryArtifact,
  type TeachBackArtifact,
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
  initialAttemptCount: number
  onCitation: (citation: Citation, trigger: HTMLButtonElement) => void
  onCloseResponsive?: () => void
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
  initialAttemptCount,
  onCitation,
  onCloseResponsive,
}: StudioPanelProps) {
  const [artifacts, setArtifacts] =
    useState<StudioArtifact[]>(initialArtifacts)
  const [activeSummary, setActiveSummary] =
    useState<SummaryArtifact | null>(null)
  const [teachBackOpen, setTeachBackOpen] = useState(false)
  const [teachBackResult, setTeachBackResult] =
    useState<TeachBackArtifact | null>(null)
  const [teachBackConcept, setTeachBackConcept] = useState('')
  const [teachBackExplanation, setTeachBackExplanation] = useState('')
  const [progress, setProgress] = useState<Progress | null>(null)
  const [progressRevision, setProgressRevision] = useState(0)
  const [practiceArtifact, setPracticeArtifact] = useState<
    Extract<StudioArtifact, { type: 'flashcards' | 'quiz' }> | null
  >(null)
  const [generation, setGeneration] = useState<
    | { status: 'idle' }
    | { status: 'loading'; kind: StudioArtifact['type'] }
    | { status: 'error'; kind: StudioArtifact['type']; message: string; action?: string }
  >({ status: 'idle' })
  const launcherRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (initialAttemptCount === 0 && progressRevision === 0) return
    let active = true
    fetchProgress(sessionId)
      .then((next) => {
        if (!active) return
        if (!Array.isArray(next.concepts)) return
        setProgress(next)
        setTeachBackConcept((current) => current || next.recommended_concept || '')
      })
      .catch(() => {
        if (active) setProgress(null)
      })
    return () => {
      active = false
    }
  }, [initialAttemptCount, progressRevision, sessionId])

  async function generate(
    kind: 'summary' | 'flashcards' | 'quiz',
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
    } else if (artifact.type === 'teach_back') {
      setTeachBackResult(artifact)
      setTeachBackConcept(artifact.content.concept)
      setTeachBackOpen(true)
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

  async function submitTeachBack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      !teachBackConcept.trim() ||
      teachBackExplanation.trim().length < 20 ||
      selectedSources.length === 0 ||
      generation.status === 'loading'
    ) {
      return
    }
    setGeneration({ status: 'loading', kind: 'teach_back' })
    try {
      const artifact = await generateTeachBack(
        sessionId,
        selectedSources.map((source) => source.id),
        teachBackConcept.trim(),
        teachBackExplanation.trim(),
      )
      setArtifacts((current) => [
        artifact,
        ...current.filter((item) => item.id !== artifact.id),
      ])
      setTeachBackResult(artifact)
      setProgressRevision((current) => current + 1)
      setGeneration({ status: 'idle' })
    } catch (error) {
      const requestError =
        error instanceof ApiRequestError
          ? error
          : new ApiRequestError('Teach-Back feedback could not be generated.')
      setGeneration({
        status: 'error',
        kind: 'teach_back',
        message: requestError.message,
        action: requestError.action,
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
        {activeSummary.content.fallback && (
          <p className="fallback-notice">
            Cached demo brief · live generation was unavailable.
          </p>
        )}
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

  if (teachBackOpen) {
    return (
      <aside className="studio-panel teach-back-panel" aria-labelledby="teach-back-title">
        <button
          className="studio-back"
          type="button"
          onClick={() => {
            setTeachBackOpen(false)
            setTeachBackResult(null)
          }}
        >
          Back to Studio
        </button>
        <p className="panel-kicker">Explain it in your words</p>
        <h1 id="teach-back-title">Teach Back</h1>
        {!teachBackResult ? (
          <form className="teach-back-form" onSubmit={(event) => void submitTeachBack(event)}>
            <label>
              <span>Concept</span>
              <input
                value={teachBackConcept}
                maxLength={120}
                onChange={(event) => setTeachBackConcept(event.target.value)}
                placeholder="e.g. Marginal and average cost"
              />
            </label>
            <label>
              <span>Your explanation</span>
              <textarea
                rows={9}
                maxLength={4000}
                value={teachBackExplanation}
                onChange={(event) => setTeachBackExplanation(event.target.value)}
                placeholder="Explain the concept in about 3–6 sentences. Include the relationships you think matter."
              />
            </label>
            <p>
              Feedback is formative and checked only against your selected
              sources; it is not an authoritative grade.
            </p>
            <button
              className="teach-back-submit"
              type="submit"
              disabled={
                !teachBackConcept.trim() ||
                teachBackExplanation.trim().length < 20 ||
                selectedSources.length === 0 ||
                generation.status === 'loading'
              }
            >
              {generation.status === 'loading'
                ? 'Checking against sources…'
                : 'Get cited feedback'}
            </button>
            {generation.status === 'error' && (
              <div className="studio-error" role="alert">
                <strong>Teach-Back could not be completed</strong>
                <p>{generation.message}</p>
                {generation.action && <p>{generation.action}</p>}
              </div>
            )}
          </form>
        ) : (
          <div className="teach-back-feedback">
            <h2>{teachBackResult.title}</h2>
            <FeedbackGroup
              title="Covered"
              empty="No rubric point was clearly covered yet."
              points={teachBackResult.content.covered}
              onCitation={onCitation}
            />
            <FeedbackGroup
              title="Missing"
              empty="No important omissions were identified."
              points={teachBackResult.content.missing}
              onCitation={onCitation}
            />
            <FeedbackGroup
              title="Check this idea"
              empty="No potentially conflicting claim was identified."
              points={teachBackResult.content.check_this}
              onCitation={onCitation}
            />
            <section className="teach-back-next">
              <h3>Try next</h3>
              <p>{teachBackResult.content.next_prompt}</p>
            </section>
            <button
              className="teach-back-submit"
              type="button"
              onClick={() => {
                setTeachBackResult(null)
                setTeachBackExplanation('')
              }}
            >
              Explain again
            </button>
          </div>
        )}
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
          {onCloseResponsive && (
            <button
              className="responsive-sheet-close"
              type="button"
              aria-label="Close Studio panel"
              onClick={onCloseResponsive}
            >
              Close
            </button>
          )}
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
          <button
            type="button"
            onClick={(event) => {
              launcherRef.current = event.currentTarget
              setTeachBackOpen(true)
              setTeachBackResult(null)
              setGeneration({ status: 'idle' })
            }}
            disabled={selectedSources.length === 0 || generation.status === 'loading'}
          >
            <strong>Teach Back</strong>
            <span>Explain a concept and find gaps with cited feedback.</span>
          </button>
        </div>

        <ProgressSummary
          progress={progress}
          onTeachBack={(concept) => {
            setTeachBackConcept(concept)
            setTeachBackResult(null)
            setTeachBackOpen(true)
          }}
        />

        {generation.status === 'error' && (
          <div className="studio-error" role="alert">
            <strong>Generation failed</strong>
            <p>{generation.message}</p>
            {generation.action && <p>{generation.action}</p>}
            {generation.kind !== 'teach_back' && (
              <button
                type="button"
                onClick={() => {
                  const kind = generation.kind
                  if (kind !== 'teach_back') void generate(kind)
                }}
              >
                Retry
              </button>
            )}
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
                          : artifact.type === 'quiz'
                            ? `${artifact.content.questions.length} questions`
                            : `Teach Back · ${artifact.content.concept}`}
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
          onAttemptRecorded={() =>
            setProgressRevision((current) => current + 1)
          }
        />
      )}
    </>
  )
}

function ProgressSummary({
  progress,
  onTeachBack,
}: {
  progress: Progress | null
  onTeachBack: (concept: string) => void
}) {
  return (
    <section className="studio-progress" aria-labelledby="progress-title">
      <div>
        <p className="panel-kicker">Temporary progress</p>
        <h2 id="progress-title">Learning signals</h2>
      </div>
      {!progress || progress.total_attempts === 0 ? (
        <p>Complete a quiz to reveal concepts that need another look.</p>
      ) : (
        <>
          <ul>
            {progress.concepts.slice(0, 4).map((concept) => (
              <li key={concept.concept_label}>
                <div>
                  <strong>{concept.concept_label}</strong>
                  <span>{concept.attempt_count} attempt{concept.attempt_count === 1 ? '' : 's'}</span>
                </div>
                <span className={`concept-badge concept-${concept.classification}`}>
                  {classificationLabel(concept.classification)}
                </span>
              </li>
            ))}
          </ul>
          <p>{progress.recommendation}</p>
          {progress.recommended_concept && (
            <button
              type="button"
              onClick={() => onTeachBack(progress.recommended_concept!)}
            >
              Teach back {progress.recommended_concept}
            </button>
          )}
        </>
      )}
    </section>
  )
}

function classificationLabel(classification: string): string {
  return {
    mastered: 'Mastered',
    lucky_guess: 'Lucky guess',
    needs_practice: 'Needs practice',
    confident_misconception: 'Misconception',
    unscored: 'Formative',
  }[classification] || 'Formative'
}

function FeedbackGroup({
  title,
  empty,
  points,
  onCitation,
}: {
  title: string
  empty: string
  points: { text: string; citations: Citation[] }[]
  onCitation: (citation: Citation, trigger: HTMLButtonElement) => void
}) {
  return (
    <section>
      <h3>{title}</h3>
      {points.length === 0 ? (
        <p>{empty}</p>
      ) : (
        <ul>
          {points.map((point, index) => (
            <li key={`${title}-${index}`}>
              <p>{point.text}</p>
              <CitationButtons citations={point.citations} onCitation={onCitation} />
            </li>
          ))}
        </ul>
      )}
    </section>
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
