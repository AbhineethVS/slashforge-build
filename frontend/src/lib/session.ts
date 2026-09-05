const SESSION_STORAGE_KEY = 'luma.session_id'
const SELECTED_SOURCES_STORAGE_KEY = 'luma.selected_source_ids'
const PANEL_WIDTHS_STORAGE_KEY = 'luma.panel_widths'

export const DEFAULT_SOURCES_WIDTH = 272
export const DEFAULT_STUDIO_WIDTH = 344
export const MIN_SOURCES_WIDTH = 200
export const MAX_SOURCES_WIDTH = 420
export const MIN_STUDIO_WIDTH = 260
export const MAX_STUDIO_WIDTH = 560
export const MIN_CHAT_WIDTH = 360

export type PanelWidths = {
  sources: number
  studio: number
}

export type DemoSession = {
  id: string
  created_at: string
  expires_at: string
  sources: SourceSummary[]
  messages: ChatMessage[]
  artifacts: StudioArtifact[]
  attempts: Attempt[]
  suggested_questions: string[]
  learning_memory?: LearningMemory
}

export type SourceSummary = {
  id: string
  display_name: string
  kind: 'bundled' | 'uploaded'
  page_count: number
  status: 'uploading' | 'extracting' | 'embedding' | 'ready' | 'failed'
  error_code: string | null
}

export type Citation = {
  id: string
  chunk_id: string
  source_id: string
  source_name: string
  page_start: number
  page_end: number
  excerpt: string
  claim: string
  viewer_url: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content_markdown: string
  answer_format?: AnswerFormat
  sections?: AnswerSection[]
  citations: Citation[]
  insufficient_evidence?: boolean
  follow_up_questions?: string[]
  status: 'pending' | 'complete' | 'interrupted' | 'failed'
  created_at: string
}

export type AnswerFormat =
  | 'auto'
  | 'paragraph'
  | 'bullets'
  | 'steps'
  | 'table'
  | 'code'

export type AnswerSection = {
  kind: Exclude<AnswerFormat, 'auto'>
  title: string | null
  content_markdown: string | null
  code_language: string | null
  items: string[]
  columns: string[]
  rows: string[][]
  evidence_chunk_ids: string[]
}

export type SummaryArtifact = {
  id: string
  type: 'summary'
  title: string
  content: {
    fallback?: boolean
    sections: {
      title: string
      content_markdown: string
      citations: Citation[]
    }[]
    revision_questions: string[]
  }
  source_ids: string[]
  created_at: string
}

export type FlashcardArtifact = {
  id: string
  type: 'flashcards'
  title: string
  content: {
    fallback?: boolean
    cards: {
      id: string
      front: string
      back_markdown: string
      concept_label: string
      difficulty: 'recall' | 'understanding' | 'application'
      citations: Citation[]
    }[]
  }
  source_ids: string[]
  created_at: string
}

export type QuizArtifact = {
  id: string
  type: 'quiz'
  title: string
  content: {
    fallback?: boolean
    questions: {
      id: string
      type: 'mcq' | 'short_answer'
      prompt: string
      options: string[]
      expected_answer: string
      explanation_markdown: string
      demo_response: string
      concept_label: string
      difficulty: 'recall' | 'understanding' | 'application'
      citations: Citation[]
    }[]
  }
  source_ids: string[]
  created_at: string
}

export type LearningClassification =
  | 'mastered'
  | 'lucky_guess'
  | 'needs_practice'
  | 'confident_misconception'
  | 'unscored'

export type Attempt = {
  id: string
  artifact_id: string
  activity_type: 'quiz' | 'teach_back'
  concept_label: string | null
  confidence: 1 | 2 | 3 | null
  is_correct: boolean | null
  classification: LearningClassification
  feedback: string
  created_at: string
}

export type ConceptProgress = {
  concept_label: string
  attempt_count: number
  classification: LearningClassification
  mastered: number
  lucky_guess: number
  needs_practice: number
  confident_misconception: number
  unscored: number
}

export type Progress = {
  total_attempts: number
  concepts: ConceptProgress[]
  recommended_concept: string | null
  recommendation: string
  learning_memory?: LearningMemory
}

export type MisconceptionRecord = {
  claim: string
  status: 'open' | 'repairing' | 'rechecked'
  evidence_pages: number[]
  source_name: string | null
  transfer_question: string
}

export type ConceptMemory = {
  concept_id: string
  concept_label: string
  state: 'unseen' | 'emerging' | 'stable' | 'needs_recheck'
  classification: LearningClassification
  attempt_count: number
  confidence_pattern: 'low_confidence' | 'confident_misconception' | null
  misconception: MisconceptionRecord | null
  confused_with: string[]
  next_action: 'counterexample' | 'teach_back' | 'transfer_question' | null
  next_action_label: string
  evidence_pages: number[]
}

export type LearningMemory = {
  concepts: ConceptMemory[]
  open_misconception: ConceptMemory | null
  recommended_concept: string | null
  next_action: string
  suggested_questions: string[]
}

type TeachBackPoint = {
  text: string
  citations: Citation[]
}

export type TeachBackArtifact = {
  id: string
  type: 'teach_back'
  title: string
  content: {
    concept: string
    rubric_points: TeachBackPoint[]
    covered: TeachBackPoint[]
    missing: TeachBackPoint[]
    check_this: TeachBackPoint[]
    next_prompt: string
  }
  source_ids: string[]
  created_at: string
}

export type AudioOverviewArtifact = {
  id: string
  type: 'audio_overview'
  title: string
  content: {
    fallback?: boolean
    audio_status: 'pending' | 'ready' | 'unavailable'
    estimated_duration_seconds: number
    prompt_version: string
    sections: {
      title: string
      transcript: string
      citations: Citation[]
      audio_clip_ids: string[]
    }[]
  }
  source_ids: string[]
  created_at: string
}

export type VisualDeckArtifact = {
  id: string
  type: 'visual_deck'
  title: string
  content: {
    prompt: string
    fallback: true
    page_count: number
    file_url: string
  }
  source_ids: string[]
  created_at: string
}

export type StudioArtifact =
  | SummaryArtifact
  | FlashcardArtifact
  | QuizArtifact
  | TeachBackArtifact
  | AudioOverviewArtifact
  | VisualDeckArtifact

export type AudioClip = {
  id: string
  url: string
  mime_type: string
  sequence: number
  section_index: number | null
}

export type Narration = {
  resource_id: string
  clips: AudioClip[]
}

type ApiErrorResponse = {
  error?: {
    code?: string
    message?: string
    retryable?: boolean
    action?: string
  }
}

export class ApiRequestError extends Error {
  code: string
  retryable: boolean
  action?: string

  constructor(
    message: string,
    {
      code = 'REQUEST_FAILED',
      retryable = false,
      action,
    }: { code?: string; retryable?: boolean; action?: string } = {},
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = code
    this.retryable = retryable
    this.action = action
  }
}

async function readError(response: Response): Promise<ApiRequestError> {
  const fallback = `Request failed with status ${response.status}.`
  try {
    const body = (await response.json()) as ApiErrorResponse
    return new ApiRequestError(body.error?.message || fallback, {
      code: body.error?.code,
      retryable: body.error?.retryable,
      action: body.error?.action,
    })
  } catch {
    return new ApiRequestError(fallback)
  }
}

async function createSession(): Promise<DemoSession> {
  const response = await fetch('/api/v1/session', { method: 'POST' })
  if (!response.ok) throw await readError(response)
  const session = (await response.json()) as DemoSession
  sessionStorage.setItem(SESSION_STORAGE_KEY, session.id)
  return session
}

let pendingRestore: Promise<DemoSession> | null = null
let sessionRecoveryNotice: string | null = null

async function restoreOrCreate(): Promise<DemoSession> {
  const sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionId) return createSession()

  const response = await fetch('/api/v1/session', {
    headers: { 'X-Session-ID': sessionId },
  })
  if (response.ok) return (await response.json()) as DemoSession
  if (response.status === 404 || response.status === 410) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    sessionRecoveryNotice =
      response.status === 410
        ? 'Your temporary session expired. A fresh session was opened with the bundled demo; temporary work was cleared.'
        : 'The previous temporary session was unavailable. A fresh demo session was opened.'
    return createSession()
  }
  throw await readError(response)
}

export function restoreOrCreateSession(): Promise<DemoSession> {
  if (!pendingRestore) {
    pendingRestore = restoreOrCreate().finally(() => {
      pendingRestore = null
    })
  }
  return pendingRestore
}

export function takeSessionRecoveryNotice(): string | null {
  const notice = sessionRecoveryNotice
  sessionRecoveryNotice = null
  return notice
}

export async function resetSession(sessionId: string): Promise<DemoSession> {
  const response = await fetch('/api/v1/session', {
    method: 'DELETE',
    headers: { 'X-Session-ID': sessionId },
  })
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw await readError(response)
  }
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  sessionStorage.removeItem(SELECTED_SOURCES_STORAGE_KEY)
  return createSession()
}

export async function uploadSource(
  sessionId: string,
  file: File,
): Promise<SourceSummary> {
  const body = new FormData()
  body.append('file', file)
  const response = await fetch('/api/v1/sources', {
    method: 'POST',
    headers: { 'X-Session-ID': sessionId },
    body,
  })
  if (!response.ok) throw await readError(response)
  return (await response.json()) as SourceSummary
}

export async function deleteSource(
  sessionId: string,
  sourceId: string,
): Promise<void> {
  const response = await fetch(`/api/v1/sources/${sourceId}`, {
    method: 'DELETE',
    headers: { 'X-Session-ID': sessionId },
  })
  if (!response.ok) throw await readError(response)
}

export async function askQuestion(
  sessionId: string,
  question: string,
  sourceIds: string[],
  answerFormat: AnswerFormat = 'auto',
): Promise<ChatMessage> {
  const response = await fetch('/api/v1/chat/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({
      question,
      source_ids: sourceIds,
      answer_format: answerFormat,
    }),
  })
  if (!response.ok) throw await readError(response)
  return (await response.json()) as ChatMessage
}

export async function fetchSourcePdf(
  sessionId: string,
  sourceId: string,
): Promise<Blob> {
  const response = await fetch(`/api/v1/sources/${sourceId}/file`, {
    headers: { 'X-Session-ID': sessionId },
  })
  if (!response.ok) throw await readError(response)
  return response.blob()
}

export function restoreSelectedSourceIds(sources: SourceSummary[]): string[] {
  const readyIds = new Set(
    sources.filter((source) => source.status === 'ready').map((source) => source.id),
  )
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(SELECTED_SOURCES_STORAGE_KEY) || '[]',
    ) as unknown
    if (Array.isArray(stored)) {
      const restored = stored.filter(
        (value): value is string =>
          typeof value === 'string' && readyIds.has(value),
      )
      if (restored.length > 0) return restored
    }
  } catch {
    sessionStorage.removeItem(SELECTED_SOURCES_STORAGE_KEY)
  }
  const bundled = sources.find(
    (source) => source.kind === 'bundled' && source.status === 'ready',
  )
  return bundled ? [bundled.id] : [...readyIds].slice(0, 1)
}

export function persistSelectedSourceIds(sourceIds: string[]): void {
  sessionStorage.setItem(
    SELECTED_SOURCES_STORAGE_KEY,
    JSON.stringify(sourceIds),
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function restorePanelWidths(): PanelWidths {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(PANEL_WIDTHS_STORAGE_KEY) || 'null',
    ) as Partial<PanelWidths> | null
    if (
      stored &&
      typeof stored.sources === 'number' &&
      typeof stored.studio === 'number'
    ) {
      return {
        sources: clamp(
          Math.round(stored.sources),
          MIN_SOURCES_WIDTH,
          MAX_SOURCES_WIDTH,
        ),
        studio: clamp(
          Math.round(stored.studio),
          MIN_STUDIO_WIDTH,
          MAX_STUDIO_WIDTH,
        ),
      }
    }
  } catch {
    sessionStorage.removeItem(PANEL_WIDTHS_STORAGE_KEY)
  }
  return {
    sources: DEFAULT_SOURCES_WIDTH,
    studio: DEFAULT_STUDIO_WIDTH,
  }
}

export function persistPanelWidths(widths: PanelWidths): void {
  sessionStorage.setItem(PANEL_WIDTHS_STORAGE_KEY, JSON.stringify(widths))
}

export function constrainPanelWidths(
  widths: PanelWidths,
  availableWidth: number,
): PanelWidths {
  let sources = clamp(widths.sources, MIN_SOURCES_WIDTH, MAX_SOURCES_WIDTH)
  let studio = clamp(widths.studio, MIN_STUDIO_WIDTH, MAX_STUDIO_WIDTH)
  if (availableWidth > MIN_CHAT_WIDTH) {
    const maxSides = availableWidth - MIN_CHAT_WIDTH
    if (sources + studio > maxSides) {
      const overflow = sources + studio - maxSides
      const reduceStudio = Math.min(studio - MIN_STUDIO_WIDTH, overflow)
      studio -= reduceStudio
      sources -= overflow - reduceStudio
    }
  }
  return {
    sources: clamp(sources, MIN_SOURCES_WIDTH, MAX_SOURCES_WIDTH),
    studio: clamp(studio, MIN_STUDIO_WIDTH, MAX_STUDIO_WIDTH),
  }
}

export async function generateStudioArtifact(
  sessionId: string,
  kind: 'summary' | 'flashcards' | 'quiz',
  sourceIds: string[],
): Promise<StudioArtifact> {
  const response = await fetch(`/api/v1/studio/${kind}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({ source_ids: sourceIds }),
  })
  if (!response.ok) throw await readError(response)
  return (await response.json()) as StudioArtifact
}

export async function generateVisualDeck(
  sessionId: string,
  sourceIds: string[],
  prompt: string,
): Promise<VisualDeckArtifact> {
  const response = await fetch('/api/v1/studio/visual-deck', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({ source_ids: sourceIds, prompt }),
  })
  if (!response.ok) throw await readError(response)
  return (await response.json()) as VisualDeckArtifact
}

export async function fetchVisualDeckPdf(
  sessionId: string,
  fileUrl: string,
): Promise<Blob> {
  const response = await fetch(fileUrl, {
    headers: { 'X-Session-ID': sessionId },
  })
  if (!response.ok) throw await readError(response)
  return response.blob()
}

export async function submitQuizAttempt(
  sessionId: string,
  artifactId: string,
  questionId: string,
  responseText: string,
  confidence: 1 | 2 | 3,
): Promise<Attempt> {
  const response = await fetch(`/api/v1/artifacts/${artifactId}/attempts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({
      question_id: questionId,
      response_text: responseText,
      confidence,
    }),
  })
  if (!response.ok) throw await readError(response)
  return (await response.json()) as Attempt
}

export async function fetchProgress(sessionId: string): Promise<Progress> {
  const response = await fetch('/api/v1/studio/progress', {
    headers: { 'X-Session-ID': sessionId },
  })
  if (!response.ok) throw await readError(response)
  return (await response.json()) as Progress
}

export async function generateTeachBack(
  sessionId: string,
  sourceIds: string[],
  concept: string,
  explanation: string,
): Promise<TeachBackArtifact> {
  const response = await fetch('/api/v1/studio/teach-back', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({
      source_ids: sourceIds,
      concept,
      explanation,
    }),
  })
  if (!response.ok) throw await readError(response)
  return (await response.json()) as TeachBackArtifact
}

export async function transcribeVoice(
  sessionId: string,
  recording: Blob,
): Promise<string> {
  const body = new FormData()
  const extension = recording.type.includes('mp4') ? 'm4a' : 'webm'
  body.append('file', recording, `luma-recording.${extension}`)
  const response = await fetch('/api/v1/voice/transcriptions', {
    method: 'POST',
    headers: { 'X-Session-ID': sessionId },
    body,
  })
  if (!response.ok) throw await readError(response)
  const result = (await response.json()) as { transcript: string }
  return result.transcript
}

export async function createMessageNarration(
  sessionId: string,
  messageId: string,
): Promise<Narration> {
  const response = await fetch(`/api/v1/chat/messages/${messageId}/audio`, {
    method: 'POST',
    headers: { 'X-Session-ID': sessionId },
  })
  if (!response.ok) throw await readError(response)
  return (await response.json()) as Narration
}

export async function createArtifactNarration(
  sessionId: string,
  artifactId: string,
): Promise<Narration> {
  const response = await fetch(`/api/v1/artifacts/${artifactId}/audio`, {
    method: 'POST',
    headers: { 'X-Session-ID': sessionId },
  })
  if (!response.ok) throw await readError(response)
  return (await response.json()) as Narration
}

export async function fetchAudioClip(
  sessionId: string,
  url: string,
): Promise<Blob> {
  const response = await fetch(url, {
    headers: { 'X-Session-ID': sessionId },
  })
  if (!response.ok) throw await readError(response)
  return response.blob()
}

export async function generateAudioOverview(
  sessionId: string,
  sourceIds: string[],
): Promise<AudioOverviewArtifact> {
  const response = await fetch('/api/v1/studio/audio-overview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    },
    body: JSON.stringify({ source_ids: sourceIds }),
  })
  if (!response.ok) throw await readError(response)
  return (await response.json()) as AudioOverviewArtifact
}

export async function deleteStudioArtifact(
  sessionId: string,
  artifactId: string,
): Promise<void> {
  const response = await fetch(`/api/v1/artifacts/${artifactId}`, {
    method: 'DELETE',
    headers: { 'X-Session-ID': sessionId },
  })
  if (!response.ok) throw await readError(response)
}

