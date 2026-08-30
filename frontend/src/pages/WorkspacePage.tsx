import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  resetSession,
  restoreOrCreateSession,
  type DemoSession,
} from '../lib/session'

type WorkspaceState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; session: DemoSession }

const studioTools = [
  ['Summary', 'Build a cited revision brief.'],
  ['Flashcards', 'Recall key ideas from your sources.'],
  ['Quiz', 'Test understanding and confidence.'],
  ['Teach Back', 'Explain a concept in your own words.'],
]

export function WorkspacePage() {
  const [state, setState] = useState<WorkspaceState>({ status: 'loading' })
  const [isResetting, setIsResetting] = useState(false)

  const requestSession = useCallback(() => {
    restoreOrCreateSession()
      .then((session) => setState({ status: 'ready', session }))
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

      {state.status === 'ready' && (
        <main className="workspace-grid">
          <aside className="sources-panel" aria-labelledby="sources-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Library</p>
                <h1 id="sources-title">Sources</h1>
              </div>
              <button className="add-source" type="button" disabled>
                Add source
              </button>
            </div>

            {state.session.sources.length === 0 ? (
              <div className="panel-empty">
                <span className="empty-file" aria-hidden="true">
                  PDF
                </span>
                <h2>Demo source coming next</h2>
                <p>
                  The session foundation is ready. A bundled, page-indexed
                  source will be attached in the next Phase 1 slice.
                </p>
              </div>
            ) : (
              <ul className="source-list">
                {state.session.sources.map((source) => (
                  <li key={source.id}>
                    <strong>{source.display_name}</strong>
                    <span>{source.status}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="temporary-note">
              Sources and activity are temporary and may disappear after one
              hour of inactivity or a server restart.
            </p>
          </aside>

          <section className="chat-panel" aria-labelledby="chat-title">
            <div className="panel-heading chat-heading">
              <div>
                <p className="panel-kicker">Selected material</p>
                <h1 id="chat-title">Chat</h1>
              </div>
              <span className="source-count">0 active sources</span>
            </div>

            <div className="chat-empty">
              <p className="eyebrow">Grounded study chat</p>
              <h2>Ask your material, not the open web.</h2>
              <p>
                Once the demo source is attached, answers will include trusted
                page citations and abstain when evidence is missing.
              </p>
              <div className="suggestion-list" aria-label="Example questions">
                <button type="button" disabled>
                  Explain the central idea in simple terms
                </button>
                <button type="button" disabled>
                  Compare the two key approaches
                </button>
              </div>
            </div>

            <form className="chat-composer">
              <label className="sr-only" htmlFor="question">
                Ask your selected sources
              </label>
              <textarea
                id="question"
                rows={2}
                placeholder="Add or select a source to ask a question"
                disabled
              />
              <div>
                <span>0 sources selected</span>
                <button type="submit" disabled>
                  Ask
                </button>
              </div>
            </form>
          </section>

          <aside className="studio-panel" aria-labelledby="studio-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Active learning</p>
                <h1 id="studio-title">Studio</h1>
              </div>
            </div>
            <p className="studio-intro">
              Create study tools from the sources you select.
            </p>
            <div className="studio-tools">
              {studioTools.map(([title, description]) => (
                <button key={title} type="button" disabled>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </button>
              ))}
            </div>
            <div className="session-ready" role="status">
              <span aria-hidden="true" />
              Session ready
            </div>
          </aside>
        </main>
      )}
    </div>
  )
}

