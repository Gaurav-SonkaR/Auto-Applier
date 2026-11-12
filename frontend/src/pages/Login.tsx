import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  completePasswordReset,
  getAuthStatus,
  requestPasswordReset,
  signup,
} from '../api/auth'
import { useAuth } from '../hooks/useAuth'

type View = 'signin' | 'signup' | 'forgot'

/**
 * The way in — and the two ways to ask to be let in.
 *
 * Signing up is open to anyone, but it creates a PENDING account that cannot
 * sign in until an admin approves it. A forgotten password works the same way:
 * ask, wait for approval, then set a new one. Both are said plainly here, so
 * nobody is left wondering why their fresh credentials don't work.
 */
export function Login() {
  const [view, setView] = useState<View>('signin')

  const { data: status } = useQuery({ queryKey: ['auth', 'status'], queryFn: getAuthStatus })
  const noAdminYet = status?.configured === false

  const subtitle = {
    signin: 'Sign in to continue',
    signup: 'Request an account',
    forgot: 'Reset your password',
  }[view]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <div className="text-3xl" aria-hidden>🤖</div>
          <h1 className="text-xl font-bold text-gray-900">AutoApply AI</h1>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>

        {noAdminYet ? (
          <SetupRequired />
        ) : view === 'forgot' ? (
          <ForgotPassword onDone={() => setView('signin')} />
        ) : (
          <>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              {(['signin', 'signup'] as View[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setView(t)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === t
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {t === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            {view === 'signin' ? (
              <>
                <SignInForm />
                <button
                  type="button"
                  className="w-full text-center text-xs text-gray-500 hover:text-brand-700"
                  onClick={() => setView('forgot')}
                >
                  Forgot your password?
                </button>
              </>
            ) : (
              <SignUpForm onDone={() => setView('signin')} />
            )}
          </>
        )}

        <p className="text-center text-xs text-gray-400">Local only — runs on 127.0.0.1</p>
      </div>
    </div>
  )
}

function SetupRequired() {
  return (
    <div className="card space-y-2">
      <h2 className="text-sm font-semibold text-amber-700">Setup required</h2>
      <p className="text-xs text-gray-600">
        No admin account exists yet. On the machine running the backend:
      </p>
      <pre className="text-xs bg-gray-100 border border-gray-200 rounded p-2 overflow-x-auto">
        python scripts/set_password.py
      </pre>
      <p className="text-xs text-gray-500">
        Then restart the backend and reload this page. That admin is the only one who can
        approve everybody else.
      </p>
    </div>
  )
}

function SignInForm() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(username, password)
      // No redirect needed — App swaps to the real UI once the token lands.
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input
          id="username"
          className="input"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          className="input"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={busy || !username || !password}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => signup(username, password, email),
    onError: (e: Error) => setError(e.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    mutation.mutate()
  }

  if (mutation.isSuccess) {
    return (
      <div className="card space-y-3 text-center">
        <div className="text-2xl" aria-hidden>⏳</div>
        <h2 className="text-sm font-semibold text-gray-900">Request sent</h2>
        <p className="text-xs text-gray-600">{mutation.data.message}</p>
        <button type="button" className="btn-secondary text-xs w-full" onClick={onDone}>
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
        Your account needs admin approval before you can sign in.
      </p>

      <div>
        <label className="label" htmlFor="su-username">Username</label>
        <input
          id="su-username"
          className="input"
          autoComplete="username"
          autoFocus
          placeholder="At least 3 characters"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="su-email">Email (optional)</label>
        <input
          id="su-email"
          type="email"
          className="input"
          autoComplete="email"
          placeholder="So the admin can reach you"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="su-password">Password</label>
        <input
          id="su-password"
          type="password"
          className="input"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="su-confirm">Confirm password</label>
        <input
          id="su-confirm"
          type="password"
          className="input"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={mutation.isPending || !username || !password || !confirm}
      >
        {mutation.isPending ? 'Sending…' : 'Request account'}
      </button>
    </form>
  )
}

/**
 * Forgotten password, in two visits.
 *
 * First the member asks and is handed a one-time code. Then — once an admin has
 * approved the request — they come back with that code and choose a new
 * password. Both halves are needed: the code alone is refused until approval,
 * and the approval alone is useless to anyone who doesn't hold the code.
 */
function ForgotPassword({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'request' | 'redeem'>('request')
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const ask = useMutation({
    mutationFn: () => requestPasswordReset(username),
    onSuccess: (data) => setCode(data.code),
    onError: (e: Error) => setError(e.message),
  })

  const redeem = useMutation({
    mutationFn: () => completePasswordReset(username, code, password),
    onError: (e: Error) => setError(e.message),
  })

  function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    ask.mutate()
  }

  function submitRedeem(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    redeem.mutate()
  }

  if (redeem.isSuccess) {
    return (
      <div className="card space-y-3 text-center">
        <div className="text-2xl" aria-hidden>✅</div>
        <h2 className="text-sm font-semibold text-gray-900">Password changed</h2>
        <p className="text-xs text-gray-600">{redeem.data.message}</p>
        <button type="button" className="btn-primary text-xs w-full" onClick={onDone}>
          Sign in
        </button>
      </div>
    )
  }

  // Step 1 succeeded — show the code once and explain what happens next.
  if (step === 'request' && ask.isSuccess) {
    return (
      <div className="card space-y-3">
        <div className="text-center space-y-1">
          <div className="text-2xl" aria-hidden>⏳</div>
          <h2 className="text-sm font-semibold text-gray-900">Waiting for approval</h2>
        </div>
        <p className="text-xs text-gray-600">{ask.data.message}</p>
        <div>
          <span className="label">Your one-time code</span>
          <code className="block text-sm font-mono bg-gray-100 border border-gray-200 rounded px-2 py-2 break-all select-all">
            {ask.data.code}
          </code>
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          Copy it now — it is shown only this once, and it expires in 24 hours.
        </p>
        <button
          type="button"
          className="btn-primary text-xs w-full"
          onClick={() => setStep('redeem')}
        >
          I have approval — set a new password
        </button>
        <button type="button" className="btn-secondary text-xs w-full" onClick={onDone}>
          Back to sign in
        </button>
      </div>
    )
  }

  if (step === 'redeem') {
    return (
      <form onSubmit={submitRedeem} className="card space-y-3">
        <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          This works only after an admin has approved your request.
        </p>

        <div>
          <label className="label" htmlFor="pr-username">Username</label>
          <input
            id="pr-username"
            className="input"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="pr-code">One-time code</label>
          <input
            id="pr-code"
            className="input font-mono"
            placeholder="From when you asked"
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
          />
        </div>

        <div>
          <label className="label" htmlFor="pr-password">New password</label>
          <input
            id="pr-password"
            type="password"
            className="input"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="pr-confirm">Confirm new password</label>
          <input
            id="pr-confirm"
            type="password"
            className="input"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={redeem.isPending || !username || !code || !password || !confirm}
        >
          {redeem.isPending ? 'Changing…' : 'Change password'}
        </button>
        <button
          type="button"
          className="btn-secondary text-xs w-full"
          onClick={() => setStep('request')}
        >
          Back
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={submitRequest} className="card space-y-3">
      <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
        An admin has to approve the reset before you can choose a new password.
      </p>

      <div>
        <label className="label" htmlFor="pr-ask-username">Username</label>
        <input
          id="pr-ask-username"
          className="input"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={ask.isPending || !username}
      >
        {ask.isPending ? 'Sending…' : 'Request reset'}
      </button>

      <button
        type="button"
        className="btn-secondary text-xs w-full"
        onClick={() => setStep('redeem')}
      >
        I already have a code
      </button>
      <button
        type="button"
        className="w-full text-center text-xs text-gray-500 hover:text-brand-700"
        onClick={onDone}
      >
        Back to sign in
      </button>
    </form>
  )
}
