import { useEffect, useRef, useState, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'

import {
  ApiRequestError,
  deleteStudioArtifact,
  fetchProgress,
  generateAudioOverview,
  generateTeachBack,
  type AudioOverviewArtifact,
  generateStudioArtifact,
  type Citation,
  type LearningMemory,
  type Progress,
  type SourceSummary,
  type StudioArtifact,
  type SummaryArtifact,
  type TeachBackArtifact,
  type VisualDeckArtifact,
  generateVisualDeck as generateVisualDeckArtifact,
} from '../lib/session'
import { AudioOverviewOverlay } from './AudioOverviewOverlay'
import { Icon, type IconName } from './Icon'
import { NarrationPlayer } from './NarrationPlayer'
import { PracticeOverlay } from './PracticeOverlay'
import { QuizSetupOverlay } from './QuizSetupOverlay'
import { VisualDeckOverlay } from './VisualDeckOverlay'
import { VoiceRecorder } from './VoiceRecorder'

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
  onAskQuestion?: (question: string) => void
  onLearningMemory?: (memory: LearningMemory) => void
}

const tools: readonly (readonly [
  'summary' | 'flashcards' | 'quiz',
  string,
  string,
  IconName,
])[] = [
  ['summary', 'Summary', 'Build a cited revision brief.', 'book'],
  ['flashcards', 'Flashcards', 'Recall key ideas in a focused deck.', 'cards'],
  ['quiz', 'Quiz', 'Test understanding and confidence.', 'check-circle'],
]

const DEFAULT_VISUAL_DECK_PROMPT =
  'Create a presentation that visualizes and explains the key economic graphs from the sources. Include the Production Possibility Frontier, Law of Variable Proportions, Market Equilibrium, short-run cost curves, the long-run average cost envelope curve, the Break-Even Chart, and demand and revenue curves for different market structures.'

export function StudioPanel({
  sessionId,
  selectedSources,
  initialArtifacts,
  initialAttemptCount,
  onCitation,
  onCloseResponsive,
  onAskQuestion,
  onLearningMemory,
}: StudioPanelProps) {
  const [artifacts, setArtifacts] =
    useState<StudioArtifact[]>(initialArtifacts)
  const [activeSummary, setActiveSummary] =
    useState<SummaryArtifact | null>(null)
  const [audioOverview, setAudioOverview] =
    useState<AudioOverviewArtifact | null>(null)
  const [visualDeck, setVisualDeck] = useState<VisualDeckArtifact | null>(null)
  const [visualDeckOpen, setVisualDeckOpen] = useState(false)
  const [visualDeckPrompt, setVisualDeckPrompt] = useState(
    DEFAULT_VISUAL_DECK_PROMPT,
  )
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
  const onLearningMemoryRef = useRef(onLearningMemory)
  const [quizSetupOpen, setQuizSetupOpen] = useState(false)

  useEffect(() => {
    onLearningMemoryRef.current = onLearningMemory
  }, [onLearningMemory])

  useEffect(() => {
    if (initialAttemptCount === 0 && progressRevision === 0) return
    let active = true
    fetchProgress(sessionId)
      .then((next) => {
        if (!active) return
        if (!Array.isArray(next.concepts)) return
        setProgress(next)
        if (next.learning_memory) onLearningMemoryRef.current?.(next.learning_memory)
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
    examPapers: File[] = [],
  ) {
    if (selectedSources.length === 0 || generation.status === 'loading') return
    if (kind === 'quiz' && trigger && !quizSetupOpen) {
      launcherRef.current = trigger
      setQuizSetupOpen(true)
      return
    }
    if (trigger) launcherRef.current = trigger
    if (kind === 'quiz') setQuizSetupOpen(false)
    setGeneration({ status: 'loading', kind })
    try {
      const artifact = await generateStudioArtifact(
        sessionId,
        kind,
        selectedSources.map((source) => source.id),
        examPapers,
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

  async function generateOverview(trigger?: HTMLButtonElement) {
    if (selectedSources.length === 0 || generation.status === 'loading') return
    if (trigger) launcherRef.current = trigger
    setGeneration({ status: 'loading', kind: 'audio_overview' })
    try {
      const artifact = await generateAudioOverview(
        sessionId,
        selectedSources.map((source) => source.id),
      )
      setArtifacts((current) => [
        artifact,
        ...current.filter((item) => item.id !== artifact.id),
      ])
      setAudioOverview(artifact)
      setGeneration({ status: 'idle' })
    } catch (error) {
      const requestError =
        error instanceof ApiRequestError
          ? error
          : new ApiRequestError('The Audio Overview could not be generated.')
      setGeneration({
        status: 'error',
        kind: 'audio_overview',
        message: requestError.message,
        action: requestError.action,
      })
    }
  }

  async function submitVisualDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      visualDeckPrompt.trim().length < 20 ||
      selectedSources.length === 0 ||
      generation.status === 'loading'
    ) {
      return
    }
    setGeneration({ status: 'loading', kind: 'visual_deck' })
    try {
      const artifact = await generateVisualDeckArtifact(
        sessionId,
        selectedSources.map((source) => source.id),
        visualDeckPrompt.trim(),
      )
      setArtifacts((current) => [
        artifact,
        ...current.filter((item) => item.id !== artifact.id),
      ])
      setVisualDeckOpen(false)
      setVisualDeck(artifact)
      setGeneration({ status: 'idle' })
    } catch (error) {
      const requestError =
        error instanceof ApiRequestError
          ? error
          : new ApiRequestError('The visual deck could not be generated.')
      setGeneration({
        status: 'error',
        kind: 'visual_deck',
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
    } else if (artifact.type === 'audio_overview') {
      setAudioOverview(artifact)
    } else if (artifact.type === 'visual_deck') {
      setVisualDeck(artifact)
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

  if (visualDeckOpen) {
    return (
      <aside className="studio-panel visual-deck-form-panel" aria-labelledby="visual-deck-form-title">
        <button
          className="studio-back"
          type="button"
          onClick={() => setVisualDeckOpen(false)}
        >
          <Icon name="arrow-left" size={15} />
          Back to Studio
        </button>
        <div>
          <p className="panel-kicker">Visual study deck</p>
          <h1 id="visual-deck-form-title">Infographics</h1>
        </div>
        <p>
          Describe the diagrams, comparisons, and explanations the deck should
          cover. Slides stay grounded in your selected sources.
        </p>
        <form onSubmit={(event) => void submitVisualDeck(event)}>
          <label>
            <span>Deck prompt</span>
            <textarea
              rows={10}
              maxLength={2000}
              value={visualDeckPrompt}
              onChange={(event) => setVisualDeckPrompt(event.target.value)}
              placeholder="Describe the graphs, comparisons, and explanations to include."
            />
          </label>
          <p className="visual-deck-form-note">
            <Icon name="alert" size={14} />
            Bundled demo deck
          </p>
          <button
            className="teach-back-submit"
            type="submit"
            disabled={
              visualDeckPrompt.trim().length < 20 ||
              selectedSources.length === 0 ||
              generation.status === 'loading'
            }
          >
            {generation.status === 'loading'
              ? 'Opening visual deck…'
              : 'Generate presentation'}
          </button>
          {generation.status === 'error' && (
            <div className="studio-error" role="alert">
              <strong>Visual Deck could not be opened</strong>
              <p>{generation.message}</p>
              {generation.action && <p>{generation.action}</p>}
            </div>
          )}
        </form>
      </aside>
    )
  }

  if (activeSummary) {
    return (
      <aside className="studio-panel studio-summary" aria-labelledby="studio-title">
        <button
          className="studio-back"
          type="button"
          onClick={() => setActiveSummary(null)}
        >
          <Icon name="arrow-left" size={15} />
          Back to Studio
        </button>
        <div>
          <p className="panel-kicker">Cited summary</p>
          <h1 id="studio-title">{activeSummary.title}</h1>
        </div>
        {activeSummary.content.fallback && (
          <p className="fallback-notice">
            <Icon name="alert" size={14} />
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
          <Icon name="arrow-left" size={15} />
          Back to Studio
        </button>
        <div>
          <p className="panel-kicker">Explain it in your words</p>
          <h1 id="teach-back-title">Teach Back</h1>
        </div>
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
                rows={8}
                maxLength={4000}
                value={teachBackExplanation}
                onChange={(event) => setTeachBackExplanation(event.target.value)}
                placeholder="Explain the concept in about 3–6 sentences. Include the relationships you think matter."
              />
            </label>
            <VoiceRecorder
              sessionId={sessionId}
              label="Record explanation"
              disabled={generation.status === 'loading'}
              onTranscript={(transcript) =>
                setTeachBackExplanation((current) =>
                  [current.trim(), transcript.trim()].filter(Boolean).join(' '),
                )
              }
            />
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
            <NarrationPlayer
              sessionId={sessionId}
              resource={{ kind: 'artifact', id: teachBackResult.id }}
            />
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

  const isBusy = generation.status === 'loading'
  const noSources = selectedSources.length === 0

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
              <Icon name="close" size={15} />
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
            <Icon name="file" size={13} />
            {selectedSources.map((source) => source.display_name).join(', ')}
          </p>
        )}

        <div className="studio-tools">
          {tools.map(([kind, title, description, icon]) => (
            <button
              key={kind}
              type="button"
              onClick={(event) => void generate(kind, event.currentTarget)}
              disabled={
                noSources || isBusy || (kind === 'quiz' && quizSetupOpen)
              }
            >
              <span className="tool-icon" aria-hidden="true">
                <Icon name={icon} size={17} />
              </span>
              <span className="tool-copy">
                <strong>
                  {isBusy && generation.kind === kind
                    ? `Generating ${title}…`
                    : title}
                </strong>
                <span>{description}</span>
              </span>
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
            disabled={noSources || isBusy}
          >
            <span className="tool-icon" aria-hidden="true">
              <Icon name="teach" size={17} />
            </span>
            <span className="tool-copy">
              <strong>Teach Back</strong>
              <span>Explain a concept and find gaps with cited feedback.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={(event) => {
              launcherRef.current = event.currentTarget
              setVisualDeckOpen(true)
              setGeneration({ status: 'idle' })
            }}
            disabled={noSources || isBusy}
          >
            <span className="tool-icon" aria-hidden="true">
              <Icon name="chart" size={17} />
            </span>
            <span className="tool-copy">
              <strong>Infographics</strong>
              <span>Describe a visual deck of diagrams and graphs.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={(event) => void generateOverview(event.currentTarget)}
            disabled={noSources || isBusy}
          >
            <span className="tool-icon" aria-hidden="true">
              <Icon name="audio" size={17} />
            </span>
            <span className="tool-copy">
              <strong>
                {isBusy && generation.kind === 'audio_overview'
                  ? 'Generating Audio Overview…'
                  : 'Audio Overview'}
              </strong>
              <span>Listen to a focused, cited 3–5 minute source overview.</span>
            </span>
          </button>
        </div>

        <ProgressSummary
          progress={progress}
          onTeachBack={(concept) => {
            setTeachBackConcept(concept)
            setTeachBackResult(null)
            setTeachBackOpen(true)
          }}
          onAskQuestion={onAskQuestion}
        />

        {generation.status === 'error' &&
          !(quizSetupOpen && generation.kind === 'quiz') && (
          <div className="studio-error" role="alert">
            <strong>Generation failed</strong>
            <p>{generation.message}</p>
            {generation.action && <p>{generation.action}</p>}
            {generation.kind !== 'teach_back' && (
              <button
                type="button"
                onClick={() => {
                  const kind = generation.kind
                  if (kind === 'audio_overview') {
                    void generateOverview()
                  } else if (kind === 'summary' || kind === 'flashcards') {
                    void generate(kind)
                  } else if (kind === 'quiz') {
                    setQuizSetupOpen(true)
                  }
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {artifacts.length > 0 && (
          <section
            className="recent-artifacts studio-section"
            aria-labelledby="recent-title"
          >
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
                          : artifact.type === 'teach_back'
                              ? `Teach Back · ${artifact.content.concept}`
                              : artifact.type === 'audio_overview'
                                ? `${artifact.content.sections.length} section Audio Overview`
                                : `${artifact.content.page_count} slide Visual Deck`}
                    </span>
                  </button>
                  <button
                    className="artifact-remove"
                    type="button"
                    onClick={() => void removeArtifact(artifact.id)}
                    aria-label={`Remove ${artifact.title}`}
                  >
                    <Icon name="trash" size={14} />
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

      {quizSetupOpen && (
        <QuizSetupOverlay
          sourceNames={selectedSources.map((source) => source.display_name)}
          busy={generation.status === 'loading' && generation.kind === 'quiz'}
          error={
            generation.status === 'error' && generation.kind === 'quiz'
              ? { message: generation.message, action: generation.action }
              : undefined
          }
          onGenerate={(papers) => void generate('quiz', undefined, papers)}
          onClose={() => {
            setQuizSetupOpen(false)
            if (generation.status === 'error' && generation.kind === 'quiz') {
              setGeneration({ status: 'idle' })
            }
            launcherRef.current?.focus()
          }}
        />
      )}
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
      {audioOverview && (
        <AudioOverviewOverlay
          artifact={audioOverview}
          sessionId={sessionId}
          onClose={() => {
            setAudioOverview(null)
            window.setTimeout(() => launcherRef.current?.focus(), 0)
          }}
        />
      )}
      {visualDeck && (
        <VisualDeckOverlay
          artifact={visualDeck}
          sessionId={sessionId}
          onClose={() => {
            setVisualDeck(null)
            window.setTimeout(() => launcherRef.current?.focus(), 0)
          }}
        />
      )}
    </>
  )
}

function ProgressSummary({
  progress,
  onTeachBack,
  onAskQuestion,
}: {
  progress: Progress | null
  onTeachBack: (concept: string) => void
  onAskQuestion?: (question: string) => void
}) {
  const memory = progress?.learning_memory
  const focus = memory?.open_misconception
  const concepts = memory?.concepts?.length
    ? memory.concepts
    : progress?.concepts.map((concept) => ({
        concept_id: concept.concept_label,
        concept_label: concept.concept_label,
        state: 'needs_recheck' as const,
        classification: concept.classification,
        attempt_count: concept.attempt_count,
        confidence_pattern: null,
        misconception: null,
        confused_with: [],
        next_action: null,
        next_action_label: '',
        evidence_pages: [],
      }))

  return (
    <section
      className="studio-progress studio-section"
      aria-labelledby="progress-title"
    >
      <div>
        <p className="panel-kicker">Session learning memory</p>
        <h2 id="progress-title">Learning memory</h2>
      </div>
      {!progress || progress.total_attempts === 0 ? (
        <p>
          Complete a quiz to reveal which ideas are stable, guessed, or still a
          misconception. This map stays in the current session only.
        </p>
      ) : (
        <>
          {focus?.misconception && (
            <article className="memory-focus" aria-label="Open misconception">
              <p className="panel-kicker">
                {focus.misconception.status === 'repairing'
                  ? 'Repairing'
                  : 'Open misconception'}
              </p>
              <strong>{focus.concept_label}</strong>
              <p>{focus.misconception.claim}</p>
              {focus.misconception.evidence_pages.length > 0 && (
                <p>
                  Evidence:{' '}
                  {focus.misconception.source_name || 'Selected source'}, p.
                  {focus.misconception.evidence_pages.join(', p.')}
                </p>
              )}
              {focus.confused_with.length > 0 && (
                <p>Often confused with {focus.confused_with.join(', ')}</p>
              )}
            </article>
          )}
          <ul>
            {(concepts || []).slice(0, 4).map((concept) => (
              <li key={concept.concept_id || concept.concept_label}>
                <div>
                  <strong>{concept.concept_label}</strong>
                  <span>
                    {stateLabel(concept.state)} · {concept.attempt_count} attempt
                    {concept.attempt_count === 1 ? '' : 's'}
                  </span>
                </div>
                <span className={`concept-badge concept-${concept.classification}`}>
                  {classificationLabel(concept.classification)}
                </span>
              </li>
            ))}
          </ul>
          <p>{memory?.next_action || progress.recommendation}</p>
          {progress.recommended_concept && (
            <button
              type="button"
              onClick={() => onTeachBack(progress.recommended_concept!)}
            >
              <Icon name="teach" size={15} />
              Teach back {progress.recommended_concept}
            </button>
          )}
          {focus?.misconception?.transfer_question && onAskQuestion && (
            <button
              className="memory-ask"
              type="button"
              onClick={() => onAskQuestion(focus.misconception!.transfer_question)}
            >
              <Icon name="target" size={15} />
              Ask contrast question
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

function stateLabel(state: string): string {
  return {
    unseen: 'Unseen',
    emerging: 'Emerging',
    stable: 'Stable',
    needs_recheck: 'Needs recheck',
  }[state] || 'Needs recheck'
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
