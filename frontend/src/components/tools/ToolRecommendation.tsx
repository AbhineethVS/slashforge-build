import { activityLabel } from '../../lib/tools/search'
import type { LearningTool } from '../../lib/tools/types'
import { Icon } from '../Icon'

type ToolRecommendationProps = {
  tool: LearningTool
  reason?: string
  concept?: string
}

export function ToolRecommendation({
  tool,
  reason,
  concept,
}: ToolRecommendationProps) {
  return (
    <aside className="tool-recommendation">
      <p className="eyebrow">Go interactive</p>
      {concept && <p className="tool-recommendation-concept">{concept}</p>}
      <h3>{tool.name}</h3>
      <p>{reason ?? tool.recommendation ?? tool.description}</p>
      <p className="tool-recommendation-modes">
        {tool.learningModes.slice(0, 3).map(activityLabel).join(' · ')}
      </p>
      <a
        className="button-ghost button-small"
        href={tool.url}
        target="_blank"
        rel="noreferrer noopener"
      >
        Try it
        <Icon name="external" size={14} />
      </a>
    </aside>
  )
}
