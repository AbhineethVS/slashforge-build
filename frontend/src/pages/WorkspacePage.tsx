import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'

import { EvidencePanel } from '../components/EvidencePanel'
import { StudioPanel } from '../components/StudioPanel'
import {
  ApiRequestError,
  askQuestion,
  constrainPanelWidths,
  deleteSource,
  MAX_SOURCES_WIDTH,
  MAX_STUDIO_WIDTH,
  MIN_SOURCES_WIDTH,
  MIN_STUDIO_WIDTH,
  persistPanelWidths,
  persistSelectedSourceIds,
  resetSession,
  restoreOrCreateSession,
  restorePanelWidths,
  restoreSelectedSourceIds,
  uploadSource,
  type ChatMessage,
  type Citation,
  type DemoSession,
  type PanelWidths,
  type SourceSummary,
} from '../lib/session'

type WorkspaceState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; session: DemoSession }

const groundedMarkdownElements = [
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
  'pre',
]

type PendingUpload = {
  file: File
  displayName: string
  status: SourceSummary['status']
  message?: string
  action?: string
}

export function WorkspacePage() {
  const [state, setState] = useState<WorkspaceState>({ status: 'loading' })
  const [isResetting, setIsResetting] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null)
  const [sourceActionError, setSourceActionError] = useState<string | null>(null)
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [chatState, setChatState] = useState<
    | { status: 'idle' }
    | { status: 'submitting'; question: string }
    | { status: 'error'; question: string; message: string; action?: string }
  >({ status: 'idle' })
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)
  const [panelWidths, setPanelWidths] = useState<PanelWidths>(() =>
    restorePanelWidths(),
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const questionInputRef = useRef<HTMLTextAreaElement>(null)
  const citationTriggerRef = useRef<HTMLButtonElement | null>(null)
  const workspaceGridRef = useRef<HTMLElement>(null)
  const panelWidthsRef = useRef(panelWidths)
  const resizeDragRef = useRef<{
    edge: 'sources' | 'studio'
    startX: number
    startWidths: PanelWidths
  } | null>(null)

  useEffect(() => {
    panelWidthsRef.current = panelWidths
  }, [panelWidths])

  useEffect(() => {
    function syncToViewport() {
      const available = workspaceGridRef.current?.clientWidth
      if (!available) return
      setPanelWidths((current) => {
        const next = constrainPanelWidths(current, available)
        if (next.sources === current.sources && next.studio === current.studio) {
          return current
        }
        persistPanelWidths(next)
        return next
      })
    }
    syncToViewport()
    window.addEventListener('resize', syncToViewport)
    return () => window.removeEventListener('resize', syncToViewport)
  }, [])

  function beginPanelResize(
    edge: 'sources' | 'studio',
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    event.preventDefault()
    resizeDragRef.current = {
      edge,
      startX: event.clientX,
      startWidths: panelWidthsRef.current,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    document.body.classList.add('is-resizing-panels')
  }

  function movePanelResize(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = resizeDragRef.current
    const grid = workspaceGridRef.current
    if (!drag || !grid) return

    const available = grid.clientWidth
    const delta = event.clientX - drag.startX
    let next: PanelWidths
    if (drag.edge === 'sources') {
      next = constrainPanelWidths(
        {
          sources: Math.min(
            MAX_SOURCES_WIDTH,
            Math.max(MIN_SOURCES_WIDTH, drag.startWidths.sources + delta),
          ),
          studio: drag.startWidths.studio,
        },
        available,
      )
    } else {
      next = constrainPanelWidths(
        {
          sources: drag.startWidths.sources,
          studio: Math.min(
            MAX_STUDIO_WIDTH,
            Math.max(MIN_STUDIO_WIDTH, drag.startWidths.studio - delta),
          ),
        },
        available,
      )
    }
    setPanelWidths(next)
  }

  function endPanelResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (!resizeDragRef.current) return
    resizeDragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    document.body.classList.remove('is-resizing-panels')
    persistPanelWidths(panelWidthsRef.current)
  }

  const requestSession = useCallback(() => {
    restoreOrCreateSession()
      .then((session) => {
        const selected = restoreSelectedSourceIds(session.sources)
        persistSelectedSourceIds(selected)
        setSelectedSourceIds(selected)
        setMessages(session.messages || [])
        setState({ status: 'ready', session })
      })
      .catch((error: unknown) =>
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'The workspace could not be opened.',
        }),
      )
  }, [])

  useEffect(() => {
    requestSession()
  }, [requestSession])

  function retrySession() {
    setState({ status: 'loading' })
    requestSession()
  }

  async function handleReset() {
    if (state.status !== 'ready') return
    const confirmed = window.confirm(
      'Reset this temporary session? Uploaded sources and study activity will be removed.',
    )
    if (!confirmed) return

    setIsResetting(true)
    try {
      const session = await resetSession(state.session.id)
      setPendingUpload(null)
      setSourceActionError(null)
      const selected = restoreSelectedSourceIds(session.sources)
      persistSelectedSourceIds(selected)
      setSelectedSourceIds(selected)
      setMessages([])
      setQuestion('')
      setChatState({ status: 'idle' })
      setActiveCitation(null)
      setState({ status: 'ready', session })
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof Error ? error.message : 'The session could not be reset.',
      })
    } finally {
      setIsResetting(false)
    }
  }

  async function processUpload(file: File) {
    if (state.status !== 'ready') return
    setSourceActionError(null)
    setPendingUpload({
      file,
      displayName: file.name,
      status: 'uploading',
    })
    const extractingTimer = window.setTimeout(
      () =>
        setPendingUpload((current) =>
          current ? { ...current, status: 'extracting' } : current,
        ),
      200,
    )
    const embeddingTimer = window.setTimeout(
      () =>
        setPendingUpload((current) =>
          current ? { ...current, status: 'embedding' } : current,
        ),
      700,
    )

    try {
      const source = await uploadSource(state.session.id, file)
      setState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              session: {
                ...current.session,
                sources: [...current.session.sources, source],
              },
            }
          : current,
      )
      setSelectedSourceIds((current) => {
        const next = [...current, source.id]
        persistSelectedSourceIds(next)
        return next
      })
      setPendingUpload(null)
    } catch (error) {
      const requestError =
        error instanceof ApiRequestError
          ? error
          : new ApiRequestError('The PDF could not be uploaded.')
      setPendingUpload({
        file,
        displayName: file.name,
        status: 'failed',
        message: requestError.message,
        action: requestError.action,
      })
    } finally {
      window.clearTimeout(extractingTimer)
      window.clearTimeout(embeddingTimer)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void processUpload(file)
  }

  async function handleDeleteSource(sourceId: string) {
    if (state.status !== 'ready') return
    setDeletingSourceId(sourceId)
    setSourceActionError(null)
    try {
      await deleteSource(state.session.id, sourceId)
      setSelectedSourceIds((current) => {
        const next = current.filter((id) => id !== sourceId)
        persistSelectedSourceIds(next)
        return next
      })
      setState({
        status: 'ready',
        session: {
          ...state.session,
          sources: state.session.sources.filter(
            (source) => source.id !== sourceId,
          ),
        },
      })
    } catch (error) {
      setSourceActionError(
        error instanceof Error ? error.message : 'The source could not be deleted.',
      )
    } finally {
      setDeletingSourceId(null)
    }
  }

  function handleSourceSelection(sourceId: string, selected: boolean) {
    setSelectedSourceIds((current) => {
      const next = selected
        ? [...new Set([...current, sourceId])]
        : current.filter((id) => id !== sourceId)
      persistSelectedSourceIds(next)
      return next
    })
  }

  function chooseQuestion(value: string) {
    setQuestion(value)
    questionInputRef.current?.focus()
  }

  async function submitQuestion(normalized: string) {
    if (
      state.status !== 'ready' ||
      chatState.status === 'submitting' ||
      selectedSourceIds.length === 0
    ) {
      return
    }
    setChatState({ status: 'submitting', question: normalized })
    try {
      const answer = await askQuestion(
        state.session.id,
        normalized,
        selectedSourceIds,
      )
      const userMessage: ChatMessage = {
        id: `user-for-${answer.id}`,
        role: 'user',
        content_markdown: normalized,
        citations: [],
        status: 'complete',
        created_at: new Date().toISOString(),
      }
      setMessages((current) => [...current, userMessage, answer])
      setQuestion('')
      setChatState({ status: 'idle' })
    } catch (error) {
      const requestError =
        error instanceof ApiRequestError
          ? error
          : new ApiRequestError('The grounded answer could not be generated.')
      setChatState({
        status: 'error',
        question: normalized,
        message: requestError.message,
        action: requestError.action,
      })
    }
  }

  function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = question.trim()
    if (normalized) void submitQuestion(normalized)
  }

  function showCitation(
    citation: Citation,
    trigger: HTMLButtonElement,
  ) {
    citationTriggerRef.current = trigger
    setActiveCitation(citation)
  }

  function closeCitation() {
    setActiveCitation(null)
    window.setTimeout(() => citationTriggerRef.current?.focus(), 0)
  }

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <Link className="wordmark" to="/" aria-label="LUMA home">
          LUMA
        </Link>
        <div className="workspace-title">
          <strong>Study workspace</strong>
          <span>Temporary session</span>
        </div>
        <button
          className="quiet-button"
          type="button"
          onClick={handleReset}
          disabled={state.status !== 'ready' || isResetting}
        >
          {isResetting ? 'Resetting…' : 'Reset session'}
        </button>
      </header>

      {state.status === 'loading' && (
        <main className="workspace-state" aria-busy="true">
          <div className="loading-mark" aria-hidden="true" />
          <h1>Preparing your study desk</h1>
          <p>Starting a private, temporary workspace…</p>
        </main>
      )}

      {state.status === 'error' && (
        <main className="workspace-state" role="alert">
          <p className="eyebrow">Workspace unavailable</p>
          <h1>We couldn’t start your session.</h1>
          <p>{state.message}</p>
          <button className="button" type="button" onClick={retrySession}>
            Try again
          </button>
        </main>
      )}

      {state.status === 'ready' && (() => {
        const readySources = state.session.sources.filter(
          (source) => source.status === 'ready',
        )
        const activeCount = readySources.filter((source) =>
          selectedSourceIds.includes(source.id),
        ).length
        const selectedSources = readySources.filter((source) =>
          selectedSourceIds.includes(source.id),
        )
        const uploadedCount = state.session.sources.filter(
          (source) => source.kind === 'uploaded',
        ).length
        const uploadLimitReached = uploadedCount >= 2

        return (
        <main
          ref={workspaceGridRef}
          className="workspace-grid"
          style={{
            gridTemplateColumns: `${panelWidths.sources}px 6px minmax(0, 1fr) 6px ${panelWidths.studio}px`,
          }}
        >
          <aside className="sources-panel" aria-labelledby="sources-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Library</p>
                <h1 id="sources-title">Sources</h1>
              </div>
              <button
                className="add-source"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={pendingUpload !== null || uploadLimitReached}
              >
                {uploadLimitReached ? '2 uploads added' : 'Add source'}
              </button>
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                aria-label="Choose a PDF source"
                disabled={pendingUpload !== null || uploadLimitReached}
              />
            </div>

            {state.session.sources.length === 0 ? (
              <div className="panel-empty">
                <span className="empty-file" aria-hidden="true">
                  PDF
                </span>
                <h2>No sources attached</h2>
                <p>
                  The bundled demo source could not be loaded. Restart the
                  session or check the server logs.
                </p>
              </div>
            ) : (
              <ul className="source-list">
                {state.session.sources.map((source) => (
                  <li key={source.id} className="source-card">
                    <div className="source-card-header">
                      <span className="file-mark" aria-hidden="true">
                        PDF
                      </span>
                      <div>
                        <strong title={source.display_name}>
                          {source.display_name}
                        </strong>
                        <span className="source-kind">
                          {source.kind === 'bundled' ? 'Bundled demo' : 'Upload'}
                        </span>
                      </div>
                    </div>
                    <span className="source-status">
                      {source.status === 'ready'
                        ? `Ready · ${source.page_count} pages`
                        : source.status}
                    </span>
                    <div className="source-actions">
                      <label className="source-selector">
                        <input
                          type="checkbox"
                          checked={selectedSourceIds.includes(source.id)}
                          onChange={(event) =>
                            handleSourceSelection(
                              source.id,
                              event.target.checked,
                            )
                          }
                        />
                        <span>Use in chat</span>
                      </label>
                      {source.kind === 'uploaded' && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteSource(source.id)}
                          disabled={deletingSourceId === source.id}
                        >
                          {deletingSourceId === source.id
                            ? 'Removing…'
                            : 'Remove'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                {pendingUpload && (
                  <li className={`source-card source-${pendingUpload.status}`}>
                    <div className="source-card-header">
                      <span className="file-mark" aria-hidden="true">
                        PDF
                      </span>
                      <div>
                        <strong>{pendingUpload.displayName}</strong>
                        <span className="source-kind">Temporary upload</span>
                      </div>
                    </div>
                    <div className="source-progress" aria-hidden="true">
                      <span />
                    </div>
                    <p
                      className="source-status"
                      role={pendingUpload.status === 'failed' ? 'alert' : 'status'}
                      aria-live="polite"
                    >
                      {pendingUpload.status === 'failed'
                        ? pendingUpload.message
                        : `${pendingUpload.status} PDF…`}
                    </p>
                    {pendingUpload.action && (
                      <p className="source-recovery">{pendingUpload.action}</p>
                    )}
                    {pendingUpload.status === 'failed' && (
                      <div className="source-actions">
                        <button
                          type="button"
                          onClick={() => {
                            const file = pendingUpload.file
                            setPendingUpload(null)
                            window.setTimeout(() => void processUpload(file), 0)
                          }}
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingUpload(null)}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </li>
                )}
              </ul>
            )}

            {sourceActionError && (
              <p className="source-action-error" role="alert">
                {sourceActionError}
              </p>
            )}
            <p className="temporary-note">
              Uploaded PDFs are sent to OpenAI for indexing. Uploads and
              activity are temporary and disappear after one hour of inactivity,
              reset, or a server restart.
            </p>
          </aside>

          <div
            className="panel-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize Sources and Chat panels"
            aria-valuemin={MIN_SOURCES_WIDTH}
            aria-valuemax={MAX_SOURCES_WIDTH}
            aria-valuenow={panelWidths.sources}
            tabIndex={0}
            onPointerDown={(event) => beginPanelResize('sources', event)}
            onPointerMove={movePanelResize}
            onPointerUp={endPanelResize}
            onPointerCancel={endPanelResize}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
              event.preventDefault()
              const available = workspaceGridRef.current?.clientWidth || 1200
              const delta = event.key === 'ArrowRight' ? 16 : -16
              const next = constrainPanelWidths(
                {
                  sources: panelWidths.sources + delta,
                  studio: panelWidths.studio,
                },
                available,
              )
              setPanelWidths(next)
              persistPanelWidths(next)
            }}
          />

          <section className="chat-panel" aria-labelledby="chat-title">
            <div className="panel-heading chat-heading">
              <div>
                <p className="panel-kicker">Selected material</p>
                <h1 id="chat-title">Chat</h1>
              </div>
              <span className="source-count">
                {activeCount} active {activeCount === 1 ? 'source' : 'sources'}
              </span>
            </div>

            <div className="chat-content">
              {messages.length === 0 && chatState.status === 'idle' ? (
                <div className="chat-empty">
                  <p className="eyebrow">Grounded study chat</p>
                  <h2>Ask your material, not the open web.</h2>
                  <p>
                    Answers use only the sources you select and link back to
                    trusted page evidence.
                  </p>
                  <div
                    className="suggestion-list"
                    aria-label="Suggested questions"
                  >
                    {state.session.suggested_questions?.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => chooseQuestion(suggestion)}
                        disabled={activeCount === 0}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="chat-thread" aria-live="polite">
                  {messages.map((message) =>
                    message.role === 'user' ? (
                      <section key={message.id} className="user-question">
                        <p className="panel-kicker">You asked</p>
                        <p>{message.content_markdown}</p>
                      </section>
                    ) : (
                      <article key={message.id} className="grounded-answer">
                        <p className="panel-kicker">Grounded answer</p>
                        {message.insufficient_evidence && (
                          <p className="evidence-warning">
                            The selected material does not contain enough
                            evidence for a supported answer.
                          </p>
                        )}
                        <ReactMarkdown allowedElements={groundedMarkdownElements}>
                          {message.content_markdown}
                        </ReactMarkdown>
                        {message.citations.length > 0 && (
                          <div
                            className="citation-list"
                            aria-label="Answer citations"
                          >
                            {message.citations.map((citation, index) => (
                              <button
                                key={citation.id}
                                type="button"
                                title={`${citation.source_name}, page ${citation.page_start}: ${citation.excerpt}`}
                                aria-label={`Citation ${index + 1}: ${citation.source_name}, page ${citation.page_start}`}
                                onClick={(event) =>
                                  showCitation(citation, event.currentTarget)
                                }
                              >
                                [{index + 1}] {citation.source_name}, p.
                                {citation.page_start}
                              </button>
                            ))}
                          </div>
                        )}
                        {message.follow_up_questions &&
                          message.follow_up_questions.length > 0 && (
                            <div
                              className="follow-up-list"
                              aria-label="Follow-up questions"
                            >
                              {message.follow_up_questions.map((followUp) => (
                                <button
                                  key={followUp}
                                  type="button"
                                  onClick={() => chooseQuestion(followUp)}
                                >
                                  {followUp}
                                </button>
                              ))}
                            </div>
                          )}
                      </article>
                    ),
                  )}
                  {chatState.status === 'submitting' && (
                    <>
                      <section className="user-question">
                        <p className="panel-kicker">You asked</p>
                        <p>{chatState.question}</p>
                      </section>
                      <div className="answer-pending" role="status">
                        <span className="loading-mark" aria-hidden="true" />
                        Searching selected sources and validating citations…
                      </div>
                    </>
                  )}
                  {chatState.status === 'error' && (
                    <div className="answer-error" role="alert">
                      <strong>The answer could not be completed.</strong>
                      <p>{chatState.message}</p>
                      {chatState.action && <p>{chatState.action}</p>}
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            void submitQuestion(chatState.question)
                          }
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuestion(chatState.question)
                            setChatState({ status: 'idle' })
                            questionInputRef.current?.focus()
                          }}
                        >
                          Edit question
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form className="chat-composer" onSubmit={handleAsk}>
              <label className="sr-only" htmlFor="question">
                Ask your selected sources
              </label>
              <textarea
                ref={questionInputRef}
                id="question"
                rows={2}
                maxLength={2000}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={
                  activeCount
                    ? 'Ask a question about your selected sources'
                    : 'Add or select a source to ask a question'
                }
                disabled={
                  activeCount === 0 || chatState.status === 'submitting'
                }
              />
              <div>
                <span>
                  {activeCount} {activeCount === 1 ? 'source' : 'sources'}{' '}
                  selected
                </span>
                <button
                  type="submit"
                  disabled={
                    activeCount === 0 ||
                    !question.trim() ||
                    chatState.status === 'submitting'
                  }
                >
                  {chatState.status === 'submitting' ? 'Working…' : 'Ask'}
                </button>
              </div>
            </form>
          </section>

          <div
            className="panel-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize Chat and Studio panels"
            aria-valuemin={MIN_STUDIO_WIDTH}
            aria-valuemax={MAX_STUDIO_WIDTH}
            aria-valuenow={panelWidths.studio}
            tabIndex={0}
            onPointerDown={(event) => beginPanelResize('studio', event)}
            onPointerMove={movePanelResize}
            onPointerUp={endPanelResize}
            onPointerCancel={endPanelResize}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
              event.preventDefault()
              const available = workspaceGridRef.current?.clientWidth || 1200
              const delta = event.key === 'ArrowLeft' ? 16 : -16
              const next = constrainPanelWidths(
                {
                  sources: panelWidths.sources,
                  studio: panelWidths.studio + delta,
                },
                available,
              )
              setPanelWidths(next)
              persistPanelWidths(next)
            }}
          />

          <div className="studio-region">
            <StudioPanel
              key={state.session.id}
              sessionId={state.session.id}
              selectedSources={selectedSources}
              initialArtifacts={state.session.artifacts}
              onCitation={showCitation}
            />
            {activeCitation && (
              <EvidencePanel
                key={activeCitation.id}
                citation={activeCitation}
                sessionId={state.session.id}
                onClose={closeCitation}
              />
            )}
          </div>
        </main>
        )
      })()}
    </div>
  )
}

