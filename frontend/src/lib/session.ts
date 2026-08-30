const SESSION_STORAGE_KEY = 'luma.session_id'

export type DemoSession = {
  id: string
  created_at: string
  expires_at: string
  sources: SourceSummary[]
  messages: unknown[]
  artifacts: unknown[]
  attempts: unknown[]
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
    message?: string
  }
}

async function readError(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}.`
  try {
    const body = (await response.json()) as ApiErrorResponse
    return body.error?.message || fallback
  } catch {
    return fallback
  }
}

async function createSession(): Promise<DemoSession> {
  const response = await fetch('/api/v1/session', { method: 'POST' })
  if (!response.ok) throw new Error(await readError(response))
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
  throw new Error(await readError(response))
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
    throw new Error(await readError(response))
  }
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  return createSession()
}

