import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  AUTH_CHANGED_EVENT,
  clearSession,
  getStoredRole,
  getStoredUsername,
  getToken,
  login as loginRequest,
  storeSession,
} from '../api/auth'

interface AuthState {
  isAuthenticated: boolean
  username: string | null
  role: string | null
  isAdmin: boolean
  /** True until the stored token has been checked on first load. */
  isLoading: boolean
}

/**
 * Session state for the whole app.
 *
 * Listens for `autoapply:auth-changed`, which `api/client.ts` fires whenever a
 * request comes back 401 — so a session that expires mid-use drops the UI back
 * to the login screen instead of leaving every page showing errors against a
 * token that can never work again.
 */
export function useAuth() {
  const qc = useQueryClient()
  const [state, setState] = useState<AuthState>(() => ({
    isAuthenticated: getToken() !== null,
    username: getStoredUsername(),
    role: getStoredRole(),
    isAdmin: getStoredRole() === 'ADMIN',
    isLoading: false,
  }))

  useEffect(() => {
    const sync = () => {
      setState({
        isAuthenticated: getToken() !== null,
        username: getStoredUsername(),
        role: getStoredRole(),
        isAdmin: getStoredRole() === 'ADMIN',
        isLoading: false,
      })
    }
    window.addEventListener(AUTH_CHANGED_EVENT, sync)
    // `storage` fires when another tab signs in or out — keep them in step.
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const signIn = useCallback(
    async (username: string, password: string) => {
      const res = await loginRequest(username, password)
      storeSession(res.access_token, res.username, res.role)
      // Anything cached from a previous session belongs to that session.
      qc.clear()
      return res
    },
    [qc],
  )

  const signOut = useCallback(() => {
    clearSession()
    qc.clear()
  }, [qc])

  return { ...state, signIn, signOut }
}
