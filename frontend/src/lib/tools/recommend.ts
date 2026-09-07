import { LEARNING_TOOLS } from './catalog'
import type { LearningTool } from './types'

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'what',
  'how',
  'why',
  'does',
  'with',
  'from',
  'that',
  'this',
  'which',
  'when',
  'where',
  'who',
  'are',
  'is',
  'was',
  'were',
  'can',
  'into',
  'about',
  'explain',
  'describe',
  'difference',
  'between',
  'using',
  'your',
  'selected',
  'sources',
  'source',
  'page',
  'pages',
  'answer',
  'question',
  'please',
  'tell',
  'me',
  'of',
  'to',
  'in',
  'on',
  'or',
  'an',
  'a',
  'as',
  'by',
  'be',
  'it',
  'its',
  'if',
  'do',
  'did',
  'not',
  'no',
  'yes',
])

const INTERACTIVE_BONUS: Partial<Record<LearningTool['learningModes'][number], number>> = {
  simulate: 3,
  'explore-3d': 3,
  'run-code': 3,
  visualize: 2,
  experiment: 2,
  build: 2,
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
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

export type ChatToolMatch = {
  tool: LearningTool
  score: number
}

export function scoreChatTools(
  query: string,
  catalog: readonly LearningTool[] = LEARNING_TOOLS,
): ChatToolMatch[] {
  const terms = tokenize(query)
  if (terms.length === 0) return []

  return catalog
    .map((tool) => {
      const name = tool.name.toLowerCase()
      const blob = haystack(tool)
      let score = 0
      let hits = 0
      for (const term of terms) {
        if (name === term || name.includes(term)) {
          score += 10
          hits += 1
        } else if (
          tool.keywords.some((keyword) => blobHas(keyword.toLowerCase(), term))
        ) {
          score += 6
          hits += 1
        } else if (blobHas(blob, term)) {
          score += 2
          hits += 1
        }
      }
      if (hits === 0) return null
      if (tool.featured) score += 1
      for (const mode of tool.learningModes) {
        score += INTERACTIVE_BONUS[mode] ?? 0
      }
      return { tool, score }
    })
    .filter((entry): entry is ChatToolMatch => entry !== null)
    .sort(
      (left, right) =>
        right.score - left.score || left.tool.name.localeCompare(right.tool.name),
    )
}

export function recommendTools(
  query: string,
  limit = 3,
  catalog: readonly LearningTool[] = LEARNING_TOOLS,
): LearningTool[] {
  const trimmed = query.trim()
  if (!trimmed) {
    return catalog.filter((tool) => tool.featured).slice(0, limit)
  }
  return scoreChatTools(trimmed, catalog)
    .slice(0, limit)
    .map((entry) => entry.tool)
}

/** Minimum score before Chat shows a tool tip. */
export const CHAT_TOOL_SCORE_FLOOR = 10

export function recommendChatTool(options: {
  question: string
  answer: string
  insufficientEvidence?: boolean
  hasCitations: boolean
  excludeIds?: readonly string[]
  catalog?: readonly LearningTool[]
  minScore?: number
}): LearningTool | null {
  if (options.insufficientEvidence || !options.hasCitations) return null

  const query = [options.question, options.answer].filter(Boolean).join(' ')
  const excluded = new Set(options.excludeIds ?? [])
  const minScore = options.minScore ?? CHAT_TOOL_SCORE_FLOOR
  const match = scoreChatTools(query, options.catalog ?? LEARNING_TOOLS).find(
    (entry) => entry.score >= minScore && !excluded.has(entry.tool.id),
  )
  return match?.tool ?? null
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
