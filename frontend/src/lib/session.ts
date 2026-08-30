const SESSION_STORAGE_KEY = 'luma.session_id'

export type DemoSession = {
  id: string
  created_at: string
  expires_at: string
  sources: SourceSummary[]
  messages: unknown[]
  artifacts: unknown[]
  attempts: unknown[]
  suggested_questions: string[]
}

export type SourceSummary = {
  id: string
  display_name: string
  kind: 'bundled' | 'uploaded'
  page_count: number
  status: 'uploading' | 'extracting' | 'embedding' | 'ready' | 'failed'
  error_code: string | null
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

async function restoreOrCreate(): Promise<DemoSession> {
  const sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionId) return createSession()

  const response = await fetch('/api/v1/session', {
    headers: { 'X-Session-ID': sessionId },
  })
  if (response.ok) return (await response.json()) as DemoSession
  if (response.status === 404 || response.status === 410) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
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

export async function resetSession(sessionId: string): Promise<DemoSession> {
  const response = await fetch('/api/v1/session', {
    method: 'DELETE',
    headers: { 'X-Session-ID': sessionId },
  })
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw await readError(response)
  }
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
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

