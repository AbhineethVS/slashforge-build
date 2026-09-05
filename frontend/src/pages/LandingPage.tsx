import { Link } from 'react-router-dom'

import { BrandMark } from '../components/BrandMark'
import { Icon, type IconName } from '../components/Icon'
import { ThemeToggle } from '../components/ThemeToggle'

const features: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'file',
    title: 'Bring your sources',
    description:
      'Study from a ready demo or add readable course PDFs for the current session.',
  },
  {
    icon: 'quote',
    title: 'Ask with evidence',
    description:
      'Get focused answers tied to the exact source pages that support them.',
  },
  {
    icon: 'target',
    title: 'Practise actively',
    description:
      'Turn selected material into quizzes, teach-back, and a session memory of what you still confuse.',
  },
]

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="site-header">
        <Link className="brand-link" to="/" aria-label="LUMA home">
          <BrandMark size={32} tagline="Source-grounded study" />
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#trust">Why LUMA</a>
          <ThemeToggle />
          <Link className="button button-small" to="/workspace">
            Start studying
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hero-badge">
              <Icon name="spark-small" size={15} />
              Your material. Clearer understanding.
            </p>
            <h1 id="hero-title">
              Study what matters.
              <span className="gradient-text">Verify every answer.</span>
            </h1>
            <p className="hero-lede">
              LUMA turns course PDFs into a source-grounded study desk for
              questions, evidence, and active revision.
            </p>
            <div className="hero-actions">
              <Link className="button" to="/workspace">
                Start studying
                <Icon name="arrow-right" size={17} />
              </Link>
              <a className="text-link" href="#how-it-works">
                See how it works
              </a>
            </div>
            <p className="session-note">
              <Icon name="shield" size={14} />
              No account required. Your workspace is temporary.
            </p>
          </div>

          <div className="workspace-preview" aria-hidden="true">
            <div className="preview-bar">
              <span>LUMA</span>
              <span className="preview-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="preview-status">Study workspace</span>
            </div>
            <div className="preview-grid">
              <div className="preview-sources">
                <p>Sources</p>
                <div className="preview-source">
                  <span className="file-mark">
                    <Icon name="file" size={13} />
                  </span>
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
                <span>
                  <Icon name="book" size={13} />
                  Summary
                </span>
                <span>
                  <Icon name="cards" size={13} />
                  Flashcards
                </span>
                <span>
                  <Icon name="check-circle" size={13} />
                  Quiz
                </span>
                <span>
                  <Icon name="teach" size={13} />
                  Teach Back
                </span>
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
              <li key={feature.title}>
                <span className="feature-icon" aria-hidden="true">
                  <Icon name={feature.icon} size={19} />
                </span>
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
          <Link className="button button-ghost" to="/workspace">
            Open the workspace
            <Icon name="arrow-right" size={17} />
          </Link>
        </section>
      </main>

      <footer>
        <BrandMark size={24} />
        <p>Source-grounded study for focused revision.</p>
      </footer>
    </div>
  )
}
