import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import ReactMarkdown from 'react-markdown'

import {
  submitQuizAttempt,
  type Attempt,
  type Citation,
  type FlashcardArtifact,
  type QuizArtifact,
} from '../lib/session'
import { EvidencePanel } from './EvidencePanel'
import { Icon } from './Icon'

const markdownElements = [
  'p',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'blockquote',
  'code',
]

type PracticeOverlayProps = {
  artifact: FlashcardArtifact | QuizArtifact
  sessionId: string
  onClose: () => void
  onAttemptRecorded: () => void
}

export function PracticeOverlay({
  artifact,
  sessionId,
  onClose,
  onAttemptRecorded,
}: PracticeOverlayProps) {
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
        'button, input, textarea, [href], [tabindex]:not([tabindex="-1"])',
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
    <div className="practice-backdrop">
      <div
        ref={dialogRef}
        className="practice-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-title"
        tabIndex={-1}
      >
        <header className="practice-header">
          <div>
            <p className="panel-kicker">
              {artifact.type === 'flashcards' ? 'Flashcard deck' : 'Quiz'}
            </p>
            <h1 id="practice-title">{artifact.title}</h1>
            {artifact.type === 'quiz' && artifact.content.exam_style?.applied && (
              <p>{artifact.content.exam_style.summary}</p>
            )}
          </div>
          <button type="button" onClick={onClose}>
            <Icon name="close" size={15} />
            Close
          </button>
        </header>

        {artifact.type === 'flashcards' ? (
          <FlashcardPractice artifact={artifact} onCitation={openEvidence} />
        ) : (
          <QuizPractice
            artifact={artifact}
            sessionId={sessionId}
            onCitation={openEvidence}
            onAttemptRecorded={onAttemptRecorded}
          />
        )}

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

function FlashcardPractice({
  artifact,
  onCitation,
}: {
  artifact: FlashcardArtifact
  onCitation: (citation: Citation, event: MouseEvent<HTMLButtonElement>) => void
}) {
  const [order, setOrder] = useState(() => artifact.content.cards.map((_, index) => index))
  const [position, setPosition] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const card = artifact.content.cards[order[position]]

  function move(direction: -1 | 1) {
    setPosition((current) => {
      const next = current + direction
      return Math.max(0, Math.min(order.length - 1, next))
    })
    setRevealed(false)
  }

  useEffect(() => {
    function handleKeys(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return
      if (event.key === 'ArrowLeft') move(-1)
      if (event.key === 'ArrowRight') move(1)
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setRevealed((current) => !current)
      }
    }
    document.addEventListener('keydown', handleKeys)
    return () => document.removeEventListener('keydown', handleKeys)
  })

  function shuffle() {
    setOrder((current) => [...current].sort(() => Math.random() - 0.5))
    setPosition(0)
    setRevealed(false)
  }

  return (
    <section className="flashcard-practice" aria-label="Flashcard practice">
      <div className="practice-progress">
        Card {position + 1} of {order.length}
        <span>{card.concept_label} · {card.difficulty}</span>
      </div>
      <div
        className={`large-flashcard ${revealed ? 'is-revealed' : ''}`}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return
          const distance =
            (event.changedTouches[0]?.clientX ?? touchStartX.current) -
            touchStartX.current
          touchStartX.current = null
          if (distance > 50) move(-1)
          if (distance < -50) move(1)
        }}
      >
        <p className="panel-kicker">{revealed ? 'Answer' : 'Question'}</p>
        {revealed ? (
          <ReactMarkdown allowedElements={markdownElements}>
            {card.back_markdown}
          </ReactMarkdown>
        ) : (
          <h2>{card.front}</h2>
        )}
        {!revealed && (
          <button type="button" onClick={() => setRevealed(true)}>
            Reveal answer
          </button>
        )}
        {revealed && (
          <CitationButtons
            citations={card.citations}
            onCitation={onCitation}
          />
        )}
      </div>
      <div className="practice-controls">
        <button type="button" onClick={() => move(-1)} disabled={position === 0}>
          <Icon name="arrow-left" size={15} />
          Previous
        </button>
        <button type="button" onClick={shuffle}>
          Shuffle
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={position === order.length - 1}
        >
          Next
          <Icon name="arrow-right" size={15} />
        </button>
      </div>
      <p className="keyboard-hint">
        Swipe or use arrow keys to move. Space or Enter reveals the answer.
      </p>
    </section>
  )
}

function QuizPractice({
  artifact,
  sessionId,
  onCitation,
  onAttemptRecorded,
}: {
  artifact: QuizArtifact
  sessionId: string
  onCitation: (citation: Citation, event: MouseEvent<HTMLButtonElement>) => void
  onAttemptRecorded: () => void
}) {
  const questions = artifact.content.questions
  const [position, setPosition] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [confidence, setConfidence] = useState<Record<string, 1 | 2 | 3>>({})
  const [submitted, setSubmitted] = useState<Set<string>>(() => new Set())
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({})
  const [submissionState, setSubmissionState] = useState<
    { status: 'idle' } | { status: 'submitting' } | { status: 'error'; message: string }
  >({ status: 'idle' })
  const [complete, setComplete] = useState(false)
  const question = questions[position]
  const answer = answers[question.id] || ''
  const isSubmitted = submitted.has(question.id)
  const completedCount = submitted.size
  const correctMcqCount = useMemo(
    () =>
      questions.filter(
        (item) =>
          item.type === 'mcq' &&
          submitted.has(item.id) &&
          answers[item.id] === item.expected_answer,
      ).length,
    [answers, questions, submitted],
  )

  function setAnswer(value: string) {
    setAnswers((current) => ({ ...current, [question.id]: value }))
  }

  async function submit() {
    if (!answer.trim() || !confidence[question.id]) return
    setSubmissionState({ status: 'submitting' })
    try {
      const attempt = await submitQuizAttempt(
        sessionId,
        artifact.id,
        question.id,
        answer,
        confidence[question.id],
      )
      setAttempts((current) => ({ ...current, [question.id]: attempt }))
      setSubmitted((current) => new Set(current).add(question.id))
      setSubmissionState({ status: 'idle' })
      onAttemptRecorded()
    } catch (error) {
      setSubmissionState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'This attempt could not be saved.',
      })
    }
  }

  function next() {
    if (position === questions.length - 1) {
      setComplete(true)
      return
    }
    setPosition((current) => current + 1)
  }

  if (complete) {
    const misconceptionCount = Object.values(attempts).filter(
      (attempt) => attempt.classification === 'confident_misconception',
    ).length
    const needsPracticeCount = Object.values(attempts).filter((attempt) =>
      ['needs_practice', 'lucky_guess'].includes(attempt.classification),
    ).length
    return (
      <section className="quiz-complete">
        <p className="eyebrow">Quiz complete</p>
        <h2>{completedCount} of {questions.length} questions completed</h2>
        <p>
          {correctMcqCount} multiple-choice answers were correct. Short answers
          remain formative comparisons rather than authoritative grades.
        </p>
        {misconceptionCount > 0 && (
          <p className="misconception-summary">
            {misconceptionCount} confident misconception{' '}
            {misconceptionCount === 1 ? 'signal needs' : 'signals need'} priority
            repair in Learning memory.
          </p>
        )}
        {misconceptionCount === 0 && needsPracticeCount > 0 && (
          <p>{needsPracticeCount} concept signals are worth another look.</p>
        )}
        <button
          type="button"
          onClick={() => {
            setPosition(0)
            setComplete(false)
          }}
        >
          Review questions
        </button>
      </section>
    )
  }

  return (
    <section className="quiz-practice" aria-label="Quiz practice">
      <div className="practice-progress">
        Question {position + 1} of {questions.length}
        <span>{question.concept_label} · {question.difficulty}</span>
      </div>
      <div className="quiz-question">
        <h2>{question.prompt}</h2>
        {question.type === 'mcq' ? (
          <fieldset disabled={isSubmitted}>
            <legend className="sr-only">Choose one answer</legend>
            {question.options.map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answer === option}
                  onChange={() => setAnswer(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <label className="short-answer">
            <span>Your answer</span>
            <textarea
              rows={5}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={isSubmitted}
            />
          </label>
        )}

        {!isSubmitted && (
          <button
            className="demo-answer"
            type="button"
            onClick={() => setAnswer(question.demo_response)}
          >
            <Icon name="sparkle" size={14} />
            Fill demo answer
            <span>Presentation aid</span>
          </button>
        )}

        <fieldset className="confidence-picker" disabled={isSubmitted}>
          <legend>How confident are you?</legend>
          {([
            [1, 'Low'],
            [2, 'Medium'],
            [3, 'High'],
          ] as const).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name={`confidence-${question.id}`}
                checked={confidence[question.id] === value}
                onChange={() =>
                  setConfidence((current) => ({
                    ...current,
                    [question.id]: value,
                  }))
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>

        {!isSubmitted ? (
          <button
            className="quiz-submit"
            type="button"
            onClick={() => void submit()}
            disabled={
              !answer.trim() ||
              !confidence[question.id] ||
              submissionState.status === 'submitting'
            }
          >
            {submissionState.status === 'submitting'
              ? 'Saving attempt…'
              : 'Submit answer'}
          </button>
        ) : (
          <div className="quiz-feedback" aria-live="polite">
            <p
              className={`classification classification-${attempts[question.id]?.classification}`}
            >
              {classificationLabel(attempts[question.id]?.classification)}
            </p>
            <p>{attempts[question.id]?.feedback}</p>
            <h3>Expected answer</h3>
            <p>{question.expected_answer}</p>
            <ReactMarkdown allowedElements={markdownElements}>
              {question.explanation_markdown}
            </ReactMarkdown>
            <CitationButtons
              citations={question.citations}
              onCitation={onCitation}
            />
            <button className="next-question" type="button" onClick={next}>
              {position === questions.length - 1
                ? 'Finish quiz'
                : 'Next question'}
            </button>
          </div>
        )}
        {submissionState.status === 'error' && (
          <div className="attempt-error" role="alert">
            <p>{submissionState.message}</p>
            <button type="button" onClick={() => void submit()}>
              Retry saving attempt
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function classificationLabel(
  classification: Attempt['classification'] | undefined,
): string {
  return {
    mastered: 'Mastered signal',
    lucky_guess: 'Lucky guess signal',
    needs_practice: 'Needs practice',
    confident_misconception: 'Confident misconception',
    unscored: 'Formative comparison',
  }[classification || 'unscored']
}

function CitationButtons({
  citations,
  onCitation,
}: {
  citations: Citation[]
  onCitation: (citation: Citation, event: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <div className="citation-list" aria-label="Source evidence">
      {citations.map((citation, index) => (
        <button
          key={`${citation.id}-${citation.chunk_id}`}
          type="button"
          onClick={(event) => onCitation(citation, event)}
          aria-label={`Evidence ${index + 1}: ${citation.source_name}, page ${citation.page_start}`}
        >
          [{index + 1}] {citation.source_name}, p.{citation.page_start}
        </button>
      ))}
    </div>
  )
}
