import { request } from './client'

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_at: string | null
  username: string
  role: string
}

export interface CurrentUser {
  user_id: number
  username: string
  email: string | null
  role: string
  status: string
  authenticated: boolean
  is_admin: boolean
}

export interface SignupResponse {
  username: string
  status: string
  message: string
}

export interface UserSummary {
  user_id: number
  username: string
  email: string | null
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'DISABLED'
  role: 'ADMIN' | 'USER'
  created_at: string
  approved_at: string | null
  approved_by: string | null
  last_login_at: string | null
  /** Whether this member has asked to reset their password. */
  reset_state: 'NONE' | 'REQUESTED' | 'APPROVED'
  reset_requested_at: string | null
}

export interface UserListResponse {
  items: UserSummary[]
  pending_count: number
  reset_request_count: number
}

export interface PasswordResetRequestResponse {
  /** Shown to the requester once and never stored in the clear. Useless on its
   *  own — an admin still has to approve the request. */
  code: string
  message: string
}

export interface AuthStatus {
  /** False until `python scripts/set_password.py` has created an admin. */
  configured: boolean
  accepts_signup: boolean
}

const TOKEN_KEY = 'autoapply.token'
const USERNAME_KEY = 'autoapply.username'
const ROLE_KEY = 'autoapply.role'

/** Fires whenever the token is set or cleared, so `useAuth` can react to a
 *  401 that happened deep inside some other request. */
export const AUTH_CHANGED_EVENT = 'autoapply:auth-changed'

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    // Private mode / storage disabled — treat as signed out rather than crash.
    return null
  }
}

export function getStoredUsername(): string | null {
  try {
    return localStorage.getItem(USERNAME_KEY)
  } catch {
    return null
  }
}

export function getStoredRole(): string | null {
  try {
    return localStorage.getItem(ROLE_KEY)
  } catch {
    return null
  }
}

export function storeSession(token: string, username: string, role = 'USER') {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USERNAME_KEY, username)
    localStorage.setItem(ROLE_KEY, role)
  } catch {
    /* non-fatal: the token still works for this page's lifetime */
  }
  notifyAuthChanged()
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    localStorage.removeItem(ROLE_KEY)
  } catch {
    /* nothing to clear */
  }
  notifyAuthChanged()
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export const login = (username: string, password: string) =>
  request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const getCurrentUser = () => request<CurrentUser>('/auth/me')

/** Unauthenticated — tells the login page whether credentials exist at all. */
export const getAuthStatus = () => request<AuthStatus>('/auth/status')

/** Create an account. Returns no token: the account is PENDING until an admin
 *  approves it, so there is deliberately nothing to sign in with yet. */
export const signup = (username: string, password: string, email?: string) =>
  request<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password, email: email || null }),
  })

/** Ask an admin to allow a password reset. Public, because someone who has
 *  forgotten their password cannot authenticate to ask. The reply is the same
 *  whether or not the account exists, so it can't be used to find usernames. */
export const requestPasswordReset = (username: string) =>
  request<PasswordResetRequestResponse>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ username }),
  })

/** Needs both halves: the code from the request, and the admin's approval. */
export const completePasswordReset = (
  username: string,
  code: string,
  newPassword: string,
) =>
  request<{ username: string; message: string }>('/auth/password-reset/complete', {
    method: 'POST',
    body: JSON.stringify({ username, code, new_password: newPassword }),
  })

// ── Admin only ───────────────────────────────────────────────────────────────

export const listUsers = () => request<UserListResponse>('/auth/users')

export const setUserStatus = (userId: number, status: string) =>
  request<UserSummary>(`/auth/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

/** Promote to ADMIN or demote to USER. This is what the "make someone else an
 *  admin first" message tells you to do before disabling the last admin. */
export const setUserRole = (userId: number, role: 'ADMIN' | 'USER') =>
  request<UserSummary>(`/auth/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })

/** Approving does not change anyone's password — it only lets the person
 *  holding the one-time code set a new one. */
export const reviewPasswordReset = (userId: number, action: 'approve' | 'deny') =>
  request<UserSummary>(`/auth/users/${userId}/password-reset`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  })
