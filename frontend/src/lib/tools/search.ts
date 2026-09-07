import {
  ACTIVITIES,
  SUBJECTS,
  type LearningMode,
  type LearningTool,
  type ToolDomain,
} from './types'

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((token) => token.length > 1)
}

function haystack(tool: LearningTool): string {
  return [
    tool.name,
    tool.description,
    tool.domains.join(' '),
    tool.learningModes.join(' '),
    tool.keywords.join(' '),
    tool.recommendation ?? '',
  ]
    .join(' ')
    .toLowerCase()
}

function blobHas(blob: string, term: string): boolean {
  if (blob.includes(term)) return true
  if (term.length > 3 && term.endsWith('s') && blob.includes(term.slice(0, -1))) {
    return true
  }
  if (term.length > 3 && blob.includes(`${term}s`)) return true
  return false
}

export function searchTools(
  tools: readonly LearningTool[],
  query: string,
): LearningTool[] {
  const terms = tokenize(query)
  if (terms.length === 0) return [...tools]

  return tools
    .map((tool) => {
      const name = tool.name.toLowerCase()
      const blob = haystack(tool)
      let score = 0
      for (const term of terms) {
        if (name === term) score += 12
        else if (name.includes(term)) score += 8
        else if (
          tool.keywords.some((keyword) => blobHas(keyword.toLowerCase(), term))
        )
          score += 5
        else if (blobHas(blob, term)) score += 2
        else return null
      }
      if (tool.featured) score += 1
      return { tool, score }
    })
    .filter((entry): entry is { tool: LearningTool; score: number } => entry !== null)
    .sort((left, right) => right.score - left.score || left.tool.name.localeCompare(right.tool.name))
    .map((entry) => entry.tool)
}

export function filterTools(
  tools: readonly LearningTool[],
  options: {
    query: string
    subject: ToolDomain | 'all'
    mode: LearningMode | 'all'
  },
): LearningTool[] {
  const byQuery = searchTools(tools, options.query)
  return byQuery.filter((tool) => {
    if (options.subject !== 'all' && !tool.domains.includes(options.subject)) {
      return false
    }
    if (options.mode !== 'all' && !tool.learningModes.includes(options.mode)) {
      return false
    }
    return true
  })
}

export function subjectLabel(id: ToolDomain): string {
  return SUBJECTS.find((subject) => subject.id === id)?.label ?? id
}

export function activityLabel(id: LearningMode): string {
  return ACTIVITIES.find((activity) => activity.id === id)?.label ?? id
}
