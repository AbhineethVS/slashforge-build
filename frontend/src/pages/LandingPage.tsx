import { Link } from 'react-router-dom'

const features = [
  {
    number: '01',
    title: 'Bring your sources',
    description:
      'Study from a ready demo or add readable course PDFs for the current session.',
  },
  {
    number: '02',
    title: 'Ask with evidence',
    description:
      'Get focused answers tied to the exact source pages that support them.',
  },
  {
    number: '03',
    title: 'Practise actively',
    description:
      'Turn selected material into quizzes, teach-back, and a session memory of what you still confuse.',
  },
]

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="LUMA home">
          LUMA
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#trust">Why LUMA</a>
          <Link className="button button-small" to="/workspace">
            Start studying
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Your material. Clearer understanding.</p>
            <h1 id="hero-title">
              Study what matters.
              <span>Verify every answer.</span>
            </h1>
            <p className="hero-lede">
              LUMA turns course PDFs into a source-grounded study desk for
              questions, evidence, and active revision.
            </p>
            <div className="hero-actions">
              <Link className="button" to="/workspace">
                Start studying
                <span aria-hidden="true">→</span>
              </Link>
              <a className="text-link" href="#how-it-works">
                See how it works
              </a>
            </div>
            <p className="session-note">
              No account required. Your workspace is temporary.
            </p>
          </div>

          <div className="workspace-preview" aria-hidden="true">
            <div className="preview-bar">
              <span>LUMA</span>
              <span className="preview-status">Study workspace</span>
            </div>
            <div className="preview-grid">
              <div className="preview-sources">
                <p>Sources</p>
                <div className="preview-source">
                  <span className="file-mark">PDF</span>
                  <span>
                    Course notes
                    <small>Ready · 24 pages</small>
                  </span>
                </div>
              </div>
              <div className="preview-chat">
                <p className="preview-label">Grounded answer</p>
                <h2>Why does this concept matter?</h2>
                <div className="text-rule text-rule-long" />
                <div className="text-rule" />
                <div className="text-rule text-rule-short" />
                <span className="citation-chip">1 · p. 14</span>
                <div className="preview-composer">Ask your sources…</div>
              </div>
              <div className="preview-studio">
                <p>Studio</p>
                <span>Summary</span>
                <span>Flashcards</span>
                <span>Quiz</span>
                <span>Teach Back</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="how-section"
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <div className="section-intro">
            <p className="eyebrow">A focused revision loop</p>
            <h2 id="how-title">From scattered notes to active understanding.</h2>
          </div>
          <ol className="feature-list">
            {features.map((feature) => (
              <li key={feature.number}>
                <span>{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="trust-section" id="trust" aria-labelledby="trust-title">
          <div>
            <p className="eyebrow">Source before fluency</p>
            <h2 id="trust-title">Evidence stays one click away.</h2>
          </div>
          <p>
            Answers stay tied to the material you select. When the sources do
            not contain enough evidence, LUMA says so instead of filling the
            gap with a confident guess.
          </p>
          <Link className="button button-light" to="/workspace">
            Open the workspace
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <footer>
        <span className="wordmark">LUMA</span>
        <p>Source-grounded study for focused revision.</p>
      </footer>
    </div>
  )
}

