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

import { BrandMark } from '../components/BrandMark'
import {
  ChatPromptRail,
  promptAnchorId,
} from '../components/ChatPromptRail'
import { EvidencePanel } from '../components/EvidencePanel'
import { Icon } from '../components/Icon'
import { NarrationPlayer } from '../components/NarrationPlayer'
import { StudioPanel } from '../components/StudioPanel'
import { ThemeToggle } from '../components/ThemeToggle'
import { ToolRecommendation } from '../components/tools/ToolRecommendation'
import { VoiceRecorder } from '../components/VoiceRecorder'
import { recommendChatTool } from '../lib/tools/recommend'
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
  takeSessionRecoveryNotice,
  uploadSource,
  type ChatMessage,
  type Citation,
  type DemoSession,
  type AnswerFormat,
  type AnswerSection,
  type LearningMemory,
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
  const [answerFormat, setAnswerFormat] = useState<AnswerFormat>('auto')
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [memoryNote, setMemoryNote] = useState<string | null>(null)
  const [chatState, setChatState] = useState<
    | { status: 'idle' }
    | { status: 'submitting'; question: string }
    | { status: 'error'; question: string; message: string; action?: string }
  >({ status: 'idle' })
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)
  const [sideSheet, setSideSheet] = useState<'sources' | 'studio' | null>(null)
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)
  const [panelWidths, setPanelWidths] = useState<PanelWidths>(() =>
    restorePanelWidths(),
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const questionInputRef = useRef<HTMLTextAreaElement>(null)
  const chatContentRef = useRef<HTMLDivElement>(null)
  const citationTriggerRef = useRef<HTMLButtonElement | null>(null)
  const workspaceGridRef = useRef<HTMLElement>(null)
  const sourcesPanelRef = useRef<HTMLElement>(null)
  const studioRegionRef = useRef<HTMLDivElement>(null)
  const sourcesNavRef = useRef<HTMLButtonElement>(null)
  const studioNavRef = useRef<HTMLButtonElement>(null)
  const panelWidthsRef = useRef(panelWidths)
  const resizeDragRef = useRef<{
    edge: 'sources' | 'studio'
    startX: number
    startWidths: PanelWidths
  } | null>(null)

  useEffect(() => {
    panelWidthsRef.current = panelWidths
  }, [panelWidths])

  const closeSideSheet = useCallback(() => {
    const trigger =
      sideSheet === 'sources' ? sourcesNavRef.current : studioNavRef.current
    setSideSheet(null)
    window.setTimeout(() => trigger?.focus(), 0)
  }, [sideSheet])

  useEffect(() => {
    if (!sideSheet) return
    const panel =
      sideSheet === 'sources'
        ? sourcesPanelRef.current
        : studioRegionRef.current
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
    )
    focusable?.[0]?.focus()

    function handleSheetKeys(event: KeyboardEvent) {
      if (activeCitation) return
      if (event.key === 'Escape') {
        event.preventDefault()
        closeSideSheet()
        return
      }
      if (event.key !== 'Tab' || !focusable?.length) return
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
    document.addEventListener('keydown', handleSheetKeys)
    return () => document.removeEventListener('keydown', handleSheetKeys)
  }, [activeCitation, closeSideSheet, sideSheet])

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
        setSuggestedQuestions(session.suggested_questions || [])
        setMemoryNote(
          session.learning_memory?.open_misconception
            ? session.learning_memory.next_action
            : null,
        )
        setSessionNotice(takeSessionRecoveryNotice())
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

  function applyLearningMemory(memory: LearningMemory) {
    if (memory.suggested_questions?.length) {
      setSuggestedQuestions(memory.suggested_questions)
    }
    setMemoryNote(
      memory.open_misconception ? memory.next_action : null,
    )
  }

  function chooseQuestion(value: string) {
    setQuestion(value)
    setSideSheet(null)
    window.setTimeout(() => questionInputRef.current?.focus(), 0)
  }

  function scrollChatToBottom(behavior: ScrollBehavior = 'smooth') {
    const root = chatContentRef.current
    if (!root || typeof root.scrollTo !== 'function') return
    root.scrollTo({ top: root.scrollHeight, behavior })
  }

  function jumpToPrompt(promptId: string) {
    const root = chatContentRef.current
    if (!root) return
    const target = root.querySelector<HTMLElement>(
      `#${CSS.escape(promptAnchorId(promptId))}`,
    )
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (chatState.status !== 'submitting' && messages.length === 0) return
    const frame = window.requestAnimationFrame(() => {
      scrollChatToBottom('smooth')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [messages, chatState])

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
        answerFormat,
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
    setSideSheet('studio')
    setActiveCitation(citation)
  }

  function closeCitation() {
    setActiveCitation(null)
    window.setTimeout(() => citationTriggerRef.current?.focus(), 0)
  }

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <Link className="brand-link" to="/" aria-label="LUMA home">
          <BrandMark size={30} tagline="Study desk" />
        </Link>
        <div className="workspace-title">
          <strong>Study workspace</strong>
          <span className="pill pill-quiet pill-live">Temporary session</span>
        </div>
        <div className="header-actions">
          <nav className="workspace-panel-nav" aria-label="Workspace panels">
            <button
              ref={sourcesNavRef}
              type="button"
              aria-expanded={sideSheet === 'sources'}
              onClick={() =>
                setSideSheet((current) =>
                  current === 'sources' ? null : 'sources',
                )
              }
            >
              <Icon name="panel-left" size={15} />
              Sources
            </button>
            <button
              ref={studioNavRef}
              type="button"
              aria-expanded={sideSheet === 'studio'}
              onClick={() =>
                setSideSheet((current) =>
                  current === 'studio' ? null : 'studio',
                )
              }
            >
              <Icon name="panel-right" size={15} />
              Studio
            </button>
          </nav>
          <ThemeToggle />
          <Link className="button-quiet button-small" to="/tools">
            Explore tools
          </Link>
          <button
            className="button-quiet button-small"
            type="button"
            onClick={handleReset}
            disabled={state.status !== 'ready' || isResetting}
          >
            <Icon name="refresh" size={15} />
            <span>{isResetting ? 'Resetting…' : 'Reset session'}</span>
          </button>
        </div>
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
            <Icon name="refresh" size={16} />
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
        <>
        {sessionNotice && (
          <div className="session-recovery-notice" role="status">
            <span>{sessionNotice}</span>
            <button type="button" onClick={() => setSessionNotice(null)}>
              Dismiss
            </button>
          </div>
        )}
        <main
          ref={workspaceGridRef}
          className="workspace-grid"
          style={{
            gridTemplateColumns: `${panelWidths.sources}px 6px minmax(0, 1fr) 6px ${panelWidths.studio}px`,
          }}
        >
          <aside
            ref={sourcesPanelRef}
            className={`sources-panel ${sideSheet === 'sources' ? 'is-sheet-open' : ''}`}
            aria-labelledby="sources-title"
            role={sideSheet === 'sources' ? 'dialog' : undefined}
            aria-modal={sideSheet === 'sources' ? true : undefined}
          >
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Library</p>
                <h1 id="sources-title">Sources</h1>
              </div>
              <button
                className="responsive-sheet-close"
                type="button"
                aria-label="Close Sources panel"
                onClick={closeSideSheet}
              >
                <Icon name="close" size={15} />
                Close
              </button>
              <button
                className="add-source"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={pendingUpload !== null || uploadLimitReached}
              >
                <Icon name="plus" size={15} />
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
                  <Icon name="file" size={22} />
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
                  <li
                    key={source.id}
                    className={`source-card ${
                      selectedSourceIds.includes(source.id) ? 'is-active' : ''
                    }`}
                  >
                    <div className="source-card-header">
                      <span className="file-mark" aria-hidden="true">
                        <Icon name="file" size={16} />
                      </span>
                      <div>
                        <strong title={source.display_name}>
                          {source.display_name}
                        </strong>
                        <span className="source-kind">
                          PDF ·{' '}
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
                          <Icon name="trash" size={14} />
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
                        <Icon name="file" size={16} />
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
              <Icon name="shield" size={15} />
              <span>
                Uploaded PDFs are sent to OpenAI for indexing. Uploads and
                activity are temporary and disappear after one hour of
                inactivity, reset, or a server restart.
              </span>
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
              <span className="pill pill-quiet source-count">
                {activeCount} active {activeCount === 1 ? 'source' : 'sources'}
              </span>
            </div>

            <div className="chat-content" ref={chatContentRef}>
              {messages.length === 0 && chatState.status === 'idle' ? (
                <div className="chat-empty">
                  <span className="chat-empty-mark" aria-hidden="true">
                    <Icon name="sparkle" size={22} />
                  </span>
                  <p className="eyebrow">Grounded study chat</p>
                  <h2>Ask your material, not the open web.</h2>
                  <p>
                    Answers use only the sources you select and link back to
                    trusted page evidence.
                  </p>
                    {memoryNote && (
                      <p className="memory-chat-note">
                        <Icon name="target" size={15} />
                        <span>{memoryNote}</span>
                      </p>
                    )}
                    <div
                      className="suggestion-list"
                      aria-label="Suggested questions"
                    >
                      {suggestedQuestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => chooseQuestion(suggestion)}
                        disabled={activeCount === 0}
                      >
                        {suggestion}
                        <Icon name="arrow-right" size={15} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="chat-thread" aria-live="polite">
                  {(() => {
                    const recentToolIds: string[] = []
                    return messages.map((message, index) => {
                      if (message.role === 'user') {
                        return (
                          <section
                            key={message.id}
                            id={promptAnchorId(message.id)}
                            className="user-question"
                          >
                            <p className="panel-kicker">
                              <Icon name="quote" size={13} />
                              You asked
                            </p>
                            <p>{message.content_markdown}</p>
                          </section>
                        )
                      }

                      const prior = index > 0 ? messages[index - 1] : null
                      const question =
                        prior?.role === 'user' ? prior.content_markdown : ''
                      const tip = recommendChatTool({
                        question,
                        answer: message.content_markdown,
                        insufficientEvidence: message.insufficient_evidence,
                        hasCitations: message.citations.length > 0,
                        excludeIds: recentToolIds.slice(-2),
                      })
                      if (tip) recentToolIds.push(tip.id)

                      return (
                        <article key={message.id} className="grounded-answer">
                          <p className="panel-kicker">
                            <Icon name="spark-small" size={13} />
                            Grounded answer
                          </p>
                          {message.insufficient_evidence && (
                            <p className="evidence-warning">
                              <Icon name="alert" size={16} />
                              <span>
                                The selected material does not contain enough
                                evidence for a supported answer.
                              </span>
                            </p>
                          )}
                          <StructuredAnswer
                            message={message}
                            onCitation={showCitation}
                          />
                          <div className="answer-actions">
                            <NarrationPlayer
                              compact
                              sessionId={state.session.id}
                              resource={{ kind: 'message', id: message.id }}
                            />
                            {tip && <ToolRecommendation compact tool={tip} />}
                          </div>
                          {message.citations.length > 0 &&
                            (!message.sections ||
                              message.sections.length === 0) && (
                              <div
                                className="citation-list"
                                aria-label="Answer citations"
                              >
                                {message.citations.map((citation, cIndex) => (
                                  <button
                                    key={citation.id}
                                    type="button"
                                    title={`${citation.source_name}, page ${citation.page_start}: ${citation.excerpt}`}
                                    aria-label={`Citation ${cIndex + 1}: ${citation.source_name}, page ${citation.page_start}`}
                                    onClick={(event) =>
                                      showCitation(
                                        citation,
                                        event.currentTarget,
                                      )
                                    }
                                  >
                                    [{cIndex + 1}] {citation.source_name}, p.
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
                      )
                    })
                  })()}
                  {chatState.status === 'submitting' && (
                    <>
                      <section
                        id={promptAnchorId('pending')}
                        className="user-question"
                      >
                        <p className="panel-kicker">
                          <Icon name="quote" size={13} />
                          You asked
                        </p>
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

            <ChatPromptRail
              prompts={[
                ...messages
                  .filter((message) => message.role === 'user')
                  .map((message) => ({
                    id: message.id,
                    text: message.content_markdown,
                  })),
                ...(chatState.status === 'submitting'
                  ? [{ id: 'pending', text: chatState.question }]
                  : []),
              ]}
              onJump={jumpToPrompt}
            />

            <div className="chat-composer-dock">
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
                <div className="chat-composer-actions">
                  <VoiceRecorder
                    sessionId={state.session.id}
                    disabled={
                      activeCount === 0 || chatState.status === 'submitting'
                    }
                    onTranscript={(transcript) => {
                      setQuestion((current) =>
                        [current.trim(), transcript.trim()]
                          .filter(Boolean)
                          .join(' '),
                      )
                      window.setTimeout(
                        () => questionInputRef.current?.focus(),
                        0,
                      )
                    }}
                  />
                  <span className="composer-count">
                    {activeCount} {activeCount === 1 ? 'source' : 'sources'}{' '}
                    selected
                  </span>
                  <label className="answer-format">
                    <span>Answer format</span>
                    <select
                      value={answerFormat}
                      onChange={(event) =>
                        setAnswerFormat(event.target.value as AnswerFormat)
                      }
                      disabled={chatState.status === 'submitting'}
                    >
                      <option value="auto">Auto</option>
                      <option value="bullets">Concise points</option>
                      <option value="table">Table</option>
                      <option value="steps">Steps</option>
                      <option value="code">Code</option>
                      <option value="paragraph">Paragraph</option>
                    </select>
                  </label>
                  <button
                    className="composer-submit"
                    type="submit"
                    disabled={
                      activeCount === 0 ||
                      !question.trim() ||
                      chatState.status === 'submitting'
                    }
                  >
                    {chatState.status === 'submitting' ? 'Working…' : 'Ask'}
                    <Icon name="send" size={15} />
                  </button>
                </div>
              </form>
            </div>
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

          <div
            ref={studioRegionRef}
            className={`studio-region ${sideSheet === 'studio' ? 'is-sheet-open' : ''}`}
            role={sideSheet === 'studio' ? 'dialog' : undefined}
            aria-modal={sideSheet === 'studio' ? true : undefined}
            aria-label={sideSheet === 'studio' ? 'Studio panel' : undefined}
          >
            <StudioPanel
              key={state.session.id}
              sessionId={state.session.id}
              selectedSources={selectedSources}
              initialArtifacts={state.session.artifacts}
              initialAttemptCount={state.session.attempts.length}
              onCitation={showCitation}
              onCloseResponsive={closeSideSheet}
              onAskQuestion={chooseQuestion}
              onLearningMemory={applyLearningMemory}
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
        {sideSheet && (
          <button
            className="sheet-backdrop"
            type="button"
            aria-label="Close side panel"
            onClick={() => {
              if (!activeCitation) closeSideSheet()
            }}
          />
        )}
        </>
        )
      })()}
    </div>
  )
}

function StructuredAnswer({
  message,
  onCitation,
}: {
  message: ChatMessage
  onCitation: (citation: Citation, trigger: HTMLButtonElement) => void
}) {
  const sections = message.sections || []
  if (sections.length === 0) {
    return (
      <ReactMarkdown allowedElements={groundedMarkdownElements}>
        {message.content_markdown}
      </ReactMarkdown>
    )
  }

  return (
    <div className="structured-answer">
      {sections.map((section, index) => (
        <AnswerSectionView
          key={`${section.title || section.kind}-${index}`}
          section={section}
          citations={message.citations.filter((citation) =>
            section.evidence_chunk_ids.includes(citation.chunk_id),
          )}
          onCitation={onCitation}
        />
      ))}
    </div>
  )
}

function AnswerSectionView({
  section,
  citations,
  onCitation,
}: {
  section: AnswerSection
  citations: Citation[]
  onCitation: (citation: Citation, trigger: HTMLButtonElement) => void
}) {
  return (
    <section className={`answer-section answer-section-${section.kind}`}>
      {section.title && <h2>{section.title}</h2>}
      {section.kind === 'paragraph' && section.content_markdown && (
        <ReactMarkdown allowedElements={groundedMarkdownElements}>
          {section.content_markdown}
        </ReactMarkdown>
      )}
      {section.kind === 'bullets' && (
        <ul>
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {section.kind === 'steps' && (
        <ol>
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
      {section.kind === 'code' && section.content_markdown && (
        <pre className="answer-code">
          <code>{section.content_markdown}</code>
        </pre>
      )}
      {section.kind === 'table' && (
        <div className="answer-table-wrap" tabIndex={0}>
          <table>
            <thead>
              <tr>
                {section.columns.map((column) => (
                  <th key={column} scope="col">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {citations.length > 0 && (
        <div className="citation-list answer-section-citations" aria-label="Section citations">
          {citations.map((citation, index) => (
            <button
              key={citation.id}
              type="button"
              aria-label={`Citation ${index + 1}: ${citation.source_name}, page ${citation.page_start}`}
              onClick={(event) => onCitation(citation, event.currentTarget)}
            >
              [{index + 1}] p.{citation.page_start}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
