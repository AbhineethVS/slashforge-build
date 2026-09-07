import type { IconName } from '../../components/Icon'
import type { LearningMode, LearningTool, ToolDomain } from '../../lib/tools/types'

export function toolPreviewIcon(tool: LearningTool): IconName {
  if (tool.learningModes.includes('explore-3d')) return 'cube'
  if (tool.learningModes.includes('simulate')) return 'bolt'
  if (tool.learningModes.includes('run-code')) return 'sparkle'
  if (tool.learningModes.includes('calculate')) return 'chart'
  if (tool.learningModes.includes('build') || tool.learningModes.includes('design'))
    return 'layers'
  if (tool.domains.includes('astronomy') || tool.domains.includes('geography'))
    return 'compass'
  return 'book'
}

export function toolTone(tool: LearningTool): ToolDomain | LearningMode {
  return tool.domains[0] ?? tool.learningModes[0] ?? 'general-stem'
}
