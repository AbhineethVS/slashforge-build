import { useEffect, useRef } from 'react'

import {
  activityLabel,
  subjectLabel,
} from '../../lib/tools/search'
import type { LearningTool } from '../../lib/tools/types'
import { Icon } from '../Icon'

type ToolCardProps = {
  tool: LearningTool
  expanded: boolean
  onInspect: (id: string | null) => void
}

export function ToolCard({ tool, expanded, onInspect }: ToolCardProps) {
  const inspectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!expanded || !inspectRef.current) return
    const inspect = inspectRef.current
    inspect.classList.remove('align-start', 'align-end')
    const rect = inspect.getBoundingClientRect()
    const pad = 24
    if (rect.right > window.innerWidth - pad) inspect.classList.add('align-end')
    else if (rect.left < pad) inspect.classList.add('align-start')
  }, [expanded])

  const tags = tool.keywords.slice(0, 4)
  const modes = tool.learningModes.slice(0, 3)
  const subjects = tool.domains.slice(0, 2).map(subjectLabel)

  return (
    <article
      className={`tool-card ${expanded ? 'is-expanded' : ''}`}
      onMouseEnter={() => onInspect(tool.id)}
      onMouseLeave={() => onInspect(null)}
      onFocus={() => onInspect(tool.id)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onInspect(null)
      }}
    >
      <button
        className="tool-card-face"
        type="button"
        aria-expanded={expanded}
        aria-controls={`${tool.id}-inspect`}
        onClick={() => onInspect(expanded ? null : tool.id)}
      >
        <h3>{tool.name}</h3>
        <p className="tool-card-subjects">{subjects.join(' · ')}</p>
        <p className="tool-card-modes">
          {modes.map(activityLabel).join(' · ')}
        </p>
      </button>

      <div
        ref={inspectRef}
        className={`tool-card-inspect ${expanded ? 'is-open' : ''}`}
        id={`${tool.id}-inspect`}
        aria-hidden={!expanded}
      >
        <p className="eyebrow">Go interactive</p>
        <h3>{tool.name}</h3>
        <p className="tool-inspect-lede">{tool.description}</p>
        {tags.length > 0 && (
          <div className="tool-inspect-meta">
            <strong>Best for</strong>
            <p>{tags.join(' · ')}</p>
          </div>
        )}
        {modes.length > 0 && (
          <div className="tool-inspect-tags">
            {modes.map((mode) => (
              <span key={mode}>{activityLabel(mode)}</span>
            ))}
          </div>
        )}
        {tool.recommendation && (
          <div className="tool-inspect-why">
            <strong>Why LUMA recommends it</strong>
            <p>{tool.recommendation}</p>
          </div>
        )}
        <a
          className="button button-small"
          href={tool.url}
          target="_blank"
          rel="noreferrer noopener"
          tabIndex={expanded ? 0 : -1}
        >
          Open tool
          <Icon name="external" size={14} />
        </a>
      </div>
    </article>
  )
}
