import { activityLabel } from '../../lib/tools/search'
import type { LearningTool } from '../../lib/tools/types'
import { Icon } from '../Icon'

type ToolRecommendationProps = {
  tool: LearningTool
  reason?: string
  concept?: string
  compact?: boolean
}

export function ToolRecommendation({
  tool,
  reason,
  concept,
  compact = false,
}: ToolRecommendationProps) {
  const detail = reason ?? tool.recommendation ?? tool.description

  if (compact) {
    return (
      <a
        className="tool-recommendation is-compact"
        href={tool.url}
        target="_blank"
        rel="noreferrer noopener"
        title={detail}
      >
        <span className="eyebrow">Go interactive</span>
        <span className="tool-recommendation-name">{tool.name}</span>
        <Icon name="external" size={13} />
      </a>
    )
  }

  return (
    <aside className="tool-recommendation">
      <p className="eyebrow">Go interactive</p>
      {concept && <p className="tool-recommendation-concept">{concept}</p>}
      <h3 className="tool-recommendation-name">{tool.name}</h3>
      <p>{detail}</p>
      <p className="tool-recommendation-modes">
        {tool.learningModes.slice(0, 3).map(activityLabel).join(' · ')}
      </p>
      <div className="tool-recommendation-actions">
        <a
          className="button-ghost button-small"
          href={tool.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          Try it
          <Icon name="external" size={14} />
        </a>
      </div>
    </aside>
  )
}
