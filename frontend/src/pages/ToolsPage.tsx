import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { BrandMark } from '../components/BrandMark'
import { Icon } from '../components/Icon'
import { ThemeToggle } from '../components/ThemeToggle'
import { ToolCard } from '../components/tools/ToolCard'
import { LEARNING_TOOLS } from '../lib/tools/catalog'
import { featuredTools, popularTools } from '../lib/tools/recommend'
import { filterTools } from '../lib/tools/search'
import {
  ACTIVITIES,
  SUBJECTS,
  type LearningMode,
  type ToolDomain,
} from '../lib/tools/types'
import './ToolsPage.css'

export function ToolsPage() {
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState<ToolDomain | 'all'>('all')
  const [mode, setMode] = useState<LearningMode | 'all'>('all')
  const [inspected, setInspected] = useState<string | null>(null)

  const browsing = query.trim().length === 0 && subject === 'all' && mode === 'all'
  const results = useMemo(
    () => filterTools(LEARNING_TOOLS, { query, subject, mode }),
    [query, subject, mode],
  )
  const featured = useMemo(() => featuredTools(LEARNING_TOOLS, 8), [])
  const popular = useMemo(() => popularTools(LEARNING_TOOLS, 6), [])
  const allTools = browsing ? LEARNING_TOOLS.slice(0, 16) : results

  function exploreSubject(next: ToolDomain) {
    setSubject(next)
    setInspected(null)
  }

  function exploreActivity(next: LearningMode) {
    setMode(next)
    setInspected(null)
  }

  function clearFilters() {
    setQuery('')
    setSubject('all')
    setMode('all')
    setInspected(null)
  }

  return (
    <div
      className={`tools-page ${inspected ? 'is-inspecting' : ''}`}
      onMouseLeave={() => setInspected(null)}
    >
      <header className="site-header">
        <Link className="brand-link" to="/" aria-label="LUMA home">
          <BrandMark size={32} tagline="Source-grounded study" />
        </Link>
        <nav aria-label="Primary navigation">
          <Link to="/">Home</Link>
          <Link to="/workspace">Workspace</Link>
          <ThemeToggle />
          <Link className="button button-small" to="/workspace">
            Start studying
          </Link>
        </nav>
      </header>

      <main>
        <section className="tools-hero" aria-labelledby="tools-title">
          <p className="hero-badge">
            <Icon name="compass" size={15} />
            LUMA Tools
          </p>
          <h1 id="tools-title">
            Go beyond reading.
            <span className="gradient-text">Experience the idea.</span>
          </h1>
          <p className="hero-lede">
            Find interactive tools to visualize, simulate, build, experiment,
            and explore what you are learning.
          </p>
          <label className="tools-search">
            <Icon name="search" size={18} />
            <span className="sr-only">Search tools, subjects, or concepts</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setInspected(null)
              }}
              placeholder="Search tools, subjects, concepts…"
              autoComplete="off"
            />
          </label>
          <p className="tools-count" aria-live="polite">
            {browsing
              ? `${LEARNING_TOOLS.length} curated specialist tools`
              : `${results.length} ${results.length === 1 ? 'match' : 'matches'}`}
          </p>
        </section>

        {browsing && (
          <>
            <section className="tools-section" aria-labelledby="featured-title">
              <div className="section-intro">
                <p className="eyebrow">LUMA picks</p>
                <h2 id="featured-title">Featured tools</h2>
                <p>Start with the tools that make a concept visible, not just described.</p>
              </div>
              <div className={`tools-grid ${inspected ? 'is-inspecting' : ''}`}>
                {featured.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    expanded={inspected === tool.id}
                    onInspect={setInspected}
                  />
                ))}
              </div>
            </section>

            <section className="tools-section" aria-labelledby="subjects-title">
              <div className="section-intro">
                <p className="eyebrow">Browse</p>
                <h2 id="subjects-title">Explore by subject</h2>
              </div>
              <ul className="explore-pills">
                {SUBJECTS.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => exploreSubject(item.id)}>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="tools-section" aria-labelledby="activity-title">
              <div className="section-intro">
                <p className="eyebrow">How you want to learn</p>
                <h2 id="activity-title">Explore by activity</h2>
              </div>
              <ul className="explore-pills activity-pills">
                {ACTIVITIES.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => exploreActivity(item.id)}>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {popular.length > 0 && (
              <section className="tools-section" aria-labelledby="popular-title">
                <div className="section-intro">
                  <p className="eyebrow">Also worth opening</p>
                  <h2 id="popular-title">More curated picks</h2>
                </div>
                <div className={`tools-grid ${inspected ? 'is-inspecting' : ''}`}>
                  {popular.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      expanded={inspected === tool.id}
                      onInspect={setInspected}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section
          className="tools-section"
          id="all-tools"
          aria-labelledby="all-tools-title"
        >
          <div className="section-intro">
            <p className="eyebrow">{browsing ? 'Library' : 'Results'}</p>
            <h2 id="all-tools-title">
              {browsing ? 'All tools' : 'Matching tools'}
            </h2>
            {!browsing && (
              <div className="tools-filters" role="toolbar" aria-label="Tool filters">
                <button
                  type="button"
                  className={subject === 'all' ? 'is-active' : ''}
                  onClick={() => setSubject('all')}
                >
                  All subjects
                </button>
                {subject !== 'all' && (
                  <button
                    type="button"
                    className="is-active"
                    onClick={() => setSubject('all')}
                  >
                    {SUBJECTS.find((item) => item.id === subject)?.label}
                  </button>
                )}
                <button
                  type="button"
                  className={mode === 'all' ? 'is-active' : ''}
                  onClick={() => setMode('all')}
                >
                  All activities
                </button>
                {mode !== 'all' && (
                  <button
                    type="button"
                    className="is-active"
                    onClick={() => setMode('all')}
                  >
                    {ACTIVITIES.find((item) => item.id === mode)?.label}
                  </button>
                )}
                <button type="button" className="button-quiet" onClick={clearFilters}>
                  Clear
                </button>
              </div>
            )}
          </div>

          {allTools.length === 0 ? (
            <div className="tools-empty">
              <h3>No tools matched that search.</h3>
              <p>Try a concept such as RC circuit, CPU, molecules, or 3D anatomy.</p>
              <button className="button-ghost" type="button" onClick={clearFilters}>
                Show curated tools
              </button>
            </div>
          ) : (
            <div className={`tools-grid ${inspected ? 'is-inspecting' : ''}`}>
              {allTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  expanded={inspected === tool.id}
                  onInspect={setInspected}
                />
              ))}
            </div>
          )}
          {browsing && (
            <p className="tools-footnote">
              Showing a first shelf of {allTools.length}. Search or pick a
              subject to open the rest of the collection.
            </p>
          )}
        </section>
      </main>

      <footer>
        <BrandMark size={24} />
        <p>Text explains. Tools let you experience.</p>
      </footer>
    </div>
  )
}
