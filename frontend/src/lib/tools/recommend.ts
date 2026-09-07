import { LEARNING_TOOLS } from './catalog'
import { searchTools } from './search'
import type { LearningTool } from './types'

export function recommendTools(
  query: string,
  limit = 3,
  catalog: readonly LearningTool[] = LEARNING_TOOLS,
): LearningTool[] {
  const trimmed = query.trim()
  if (!trimmed) {
    return catalog.filter((tool) => tool.featured).slice(0, limit)
  }
  return searchTools(catalog, trimmed).slice(0, limit)
}

export function featuredTools(
  catalog: readonly LearningTool[] = LEARNING_TOOLS,
  limit = 8,
): LearningTool[] {
  const featured = catalog.filter((tool) => tool.featured)
  return featured.slice(0, limit)
}

export function popularTools(
  catalog: readonly LearningTool[] = LEARNING_TOOLS,
  limit = 8,
): LearningTool[] {
  return catalog.filter((tool) => tool.popular && !tool.featured).slice(0, limit)
}
