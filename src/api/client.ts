/** Shared fetch configuration. Domain calls live in jobs.ts / resumes.ts /
 *  runs.ts / dashboard.ts / auth.ts and all go through `request` here. */

export const BASE = '/api'

/** Read straight from storage rather than importing from auth.ts — that module
 *  imports `request` from here, and going the other way would be a cycle. */
const TOKEN_KEY = 'autoapply.token'

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function toError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => null)
  // FastAPI validation errors arrive as a list of {loc, msg}; flatten them so
  // the UI shows "job_title: field required" instead of "[object Object]".
  const detail = body?.detail
  if (Array.isArray(detail)) {
    return new ApiError(
      detail.map((d: { loc?: string[]; msg?: string }) =>
        `${d.loc?.slice(1).join('.') ?? 'field'}: ${d.msg ?? 'invalid'}`).join('; '),
      res.status,
    )
  }
  return new ApiError(
    typeof detail === 'string' ? detail : res.statusText || 'Request failed',
    res.status,
  )
}

/** A 401 anywhere means the token is gone or expired. Clear it and let the
 *  app fall back to the login screen, rather than leaving every page stuck
 *  showing errors against a session that can never recover. */
function handleUnauthorized(path: string) {
  // The login call itself 401s on wrong credentials — that's a normal form
  // error, not an expired session, so don't wipe anything.
  if (path.startsWith('/auth/login')) return
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('autoapply.username')
  } catch {
    /* nothing to clear */
  }
  window.dispatchEvent(new Event('autoapply:auth-changed'))
}

function authHeaders(): Record<string, string> {
  const token = readToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...init?.headers,
    },
  })
  if (res.status === 401) handleUnauthorized(path)
  if (!res.ok) throw await toError(res)
  // 204 No Content has no body to parse.
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/** Multipart POST — no Content-Type header, the browser sets the boundary. */
export async function upload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body: form,
    headers: authHeaders(),
  })
  if (res.status === 401) handleUnauthorized(path)
  if (!res.ok) throw await toError(res)
  return res.json() as Promise<T>
}

/** Build a query string, omitting empty values. */
export function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const str = search.toString()
  return str ? `?${str}` : ''
}

/** Append the auth token to a URL the browser fetches directly — file
 *  downloads via <a href> and the WebSocket handshake can't carry an
 *  Authorization header. */
export function withToken(url: string): string {
  const token = readToken()
  if (!token) return url
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
}
