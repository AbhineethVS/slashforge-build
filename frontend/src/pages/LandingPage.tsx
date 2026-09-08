import { Link } from 'react-router-dom'

import { BrandMark } from '../components/BrandMark'
import { Icon, type IconName } from '../components/Icon'
import { ThemeToggle } from '../components/ThemeToggle'

const steps: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'file',
    title: 'Open with sources ready',
    description:
      'Start from the bundled economics and DSA demos, or add readable course PDFs for this session.',
  },
  {
    icon: 'quote',
    title: 'Ask with page evidence',
    description:
      'Chat answers stay tied to selected material. Open the exact page behind any citation.',
  },
  {
    icon: 'target',
    title: 'Practise what you confuse',
    description:
      'Turn the same sources into summary, flashcards, quiz, and teach-back.',
  },
]

const featureCards: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'spark-small',
    title: 'Grounded chat',
    description: 'Answers only from the sources you select.',
  },
  {
    icon: 'book',
    title: 'Cited summary',
    description: 'A short revision brief with page links.',
  },
  {
    icon: 'cards',
    title: 'Flashcards & quiz',
    description: 'Active recall from the same evidence.',
  },
  {
    icon: 'teach',
    title: 'Teach Back',
    description: 'Explain a concept and spot the gaps.',
  },
  {
    icon: 'audio',
    title: 'Audio overview',
    description: 'A cited walkthrough when you want voice.',
  },
  {
    icon: 'compass',
    title: 'Explore tools',
    description: 'Jump to specialist sites when needed.',
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
          <a href="#features">Features</a>
          <Link to="/tools">Explore tools</Link>
          <ThemeToggle />
          <Link className="button button-small" to="/workspace">
            Start studying
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hero-brand">LUMA</p>
            <h1 id="hero-title">
              Study what matters.
              <span className="gradient-text">Verify every answer.</span>
            </h1>
            <p className="hero-lede">
              Ask course PDFs with citations, open the evidence page, then
              revise in Studio—all in one temporary study desk.
            </p>
            <div className="hero-actions">
              <Link className="button" to="/workspace">
                Start studying
                <Icon name="arrow-right" size={17} />
              </Link>
              <Link className="button-ghost" to="/tools">
                Explore tools
                <Icon name="compass" size={16} />
              </Link>
            </div>
            <a className="text-link" href="#how-it-works">
              See how it works
            </a>
            <p className="session-note">
              <Icon name="shield" size={14} />
              No account. Temporary session. Demo sources included.
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
                <div className="preview-source is-active">
                  <span className="file-mark">
                    <Icon name="file" size={13} />
                  </span>
                  <span>
                    Theory of Cost
                    <small>Ready · 43 pages</small>
                  </span>
                </div>
                <div className="preview-source">
                  <span className="file-mark">
                    <Icon name="file" size={13} />
                  </span>
                  <span>
                    Data Structures
                    <small>Ready · 49 pages</small>
                  </span>
                </div>
              </div>
              <div className="preview-chat">
                <p className="preview-label">Grounded answer</p>
                <h2>What is asymptotic notation?</h2>
                <p className="preview-answer">
                  It describes how an algorithm’s time or space grows as input
                  size increases.
                </p>
                <span className="citation-chip preview-citation">[1] p. 1</span>
                <div className="preview-composer">Ask your sources…</div>
              </div>
              <div className="preview-studio">
                <p>Studio</p>
                <span className="is-hot">
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
            <div className="preview-evidence">
              <span className="preview-evidence-kicker">Evidence</span>
              <strong>DSA · page 1</strong>
              <p>
                Basic Concepts · Performance Analysis — Time &amp; Space
                Complexity, Asymptotic Notations.
              </p>
            </div>
          </div>
        </section>

        <section
          className="how-section"
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <div className="section-intro">
            <p className="eyebrow">How it works</p>
            <h2 id="how-title">Three steps. One study desk.</h2>
          </div>
          <ol className="feature-list">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="feature-step" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="feature-icon" aria-hidden="true">
                  <Icon name={step.icon} size={19} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="features-section"
          id="features"
          aria-labelledby="features-title"
        >
          <div className="section-intro">
            <p className="eyebrow">Features</p>
            <h2 id="features-title">What’s on the desk.</h2>
          </div>
          <ul className="landing-feature-cards">
            {featureCards.map((feature) => (
              <li key={feature.title}>
                <span className="feature-icon" aria-hidden="true">
                  <Icon name={feature.icon} size={18} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </li>
            ))}
          </ul>
          <div className="features-cta">
            <Link className="button" to="/workspace">
              Start studying
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
        </section>
      </main>

      <footer>
        <BrandMark size={24} />
        <p>Source-grounded study for focused revision.</p>
      </footer>
    </div>
  )
}
