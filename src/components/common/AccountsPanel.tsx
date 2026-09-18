import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listUsers,
  reviewPasswordReset,
  setUserRole,
  setUserStatus,
  type UserSummary,
} from '../../api/auth'
import { formatDate, formatRelative } from '../../utils/formatters'
import { RefreshButton } from './RefreshButton'

const STATUS_STYLES: Record<UserSummary['status'], string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  DISABLED: 'bg-gray-200 text-gray-600',
}

const USERS_KEY = ['auth', 'users']

/**
 * Admin-only account management: approvals, password resets, and who else is
 * an admin.
 *
 * This is the other half of open signup — anyone may request an account or a
 * password reset, and nothing happens until someone here says yes. Rendered
 * only for admins; the API refuses non-admins regardless, this just avoids
 * showing a panel that would only ever error.
 */
export function AccountsPanel() {
  const qc = useQueryClient()
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: USERS_KEY,
    queryFn: listUsers,
  })

  // One invalidation for all three actions — they all change the same list.
  const onSettled = () => qc.invalidateQueries({ queryKey: USERS_KEY })

  const status = useMutation({
    mutationFn: ({ userId, value }: { userId: number; value: string }) =>
      setUserStatus(userId, value),
    onSuccess: onSettled,
  })
  const role = useMutation({
    mutationFn: ({ userId, value }: { userId: number; value: 'ADMIN' | 'USER' }) =>
      setUserRole(userId, value),
    onSuccess: onSettled,
  })
  const reset = useMutation({
    mutationFn: ({ userId, value }: { userId: number; value: 'approve' | 'deny' }) =>
      reviewPasswordReset(userId, value),
    onSuccess: onSettled,
  })

  const users = data?.items ?? []
  const pending = data?.pending_count ?? 0
  const resets = data?.reset_request_count ?? 0
  const busy = status.isPending || role.isPending || reset.isPending
  const error = (status.error ?? role.error ?? reset.error) as Error | null

  return (
    <section className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2 flex-wrap">
            Accounts
            {pending > 0 && (
              <span className="badge bg-amber-100 text-amber-800">{pending} waiting</span>
            )}
            {resets > 0 && (
              <span className="badge bg-blue-100 text-blue-800">
                {resets} reset{resets === 1 ? '' : 's'}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Anyone can sign up or ask to reset a password — neither takes effect until you
            approve it here.
          </p>
        </div>
        <RefreshButton onRefresh={refetch} isRefreshing={isFetching} label="" />
      </div>

      {error && <p className="text-xs text-red-600">{error.message}</p>}

      {isLoading ? (
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      ) : users.length === 0 ? (
        <p className="text-xs text-gray-500 py-4 text-center">No accounts yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {users.map((u) => (
            <AccountRow
              key={u.user_id}
              user={u}
              busy={busy}
              onSetStatus={(value) => status.mutate({ userId: u.user_id, value })}
              onSetRole={(value) => role.mutate({ userId: u.user_id, value })}
              onReviewReset={(value) => reset.mutate({ userId: u.user_id, value })}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface RowProps {
  user: UserSummary
  busy: boolean
  onSetStatus: (status: string) => void
  onSetRole: (role: 'ADMIN' | 'USER') => void
  onReviewReset: (action: 'approve' | 'deny') => void
}

function AccountRow({ user, busy, onSetStatus, onSetRole, onReviewReset }: RowProps) {
  const isAdmin = user.role === 'ADMIN'

  return (
    <li className="py-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-800">{user.username}</span>
            <span className={`badge ${STATUS_STYLES[user.status]}`}>{user.status}</span>
            {isAdmin && <span className="badge bg-brand-100 text-brand-800">ADMIN</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {user.email || 'No email given'} · signed up {formatDate(user.created_at)}
            {user.last_login_at && <> · last seen {formatRelative(user.last_login_at)}</>}
          </p>
          {user.approved_by && (
            <p className="text-xs text-gray-400 mt-0.5">Approved by {user.approved_by}</p>
          )}
        </div>

        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
          {user.status === 'PENDING' && (
            <>
              <button
                className="btn-primary text-xs px-3 py-1"
                disabled={busy}
                onClick={() => onSetStatus('ACTIVE')}
              >
                Approve
              </button>
              <button
                className="btn-secondary text-xs px-3 py-1 text-red-600"
                disabled={busy}
                onClick={() => onSetStatus('REJECTED')}
              >
                Reject
              </button>
            </>
          )}
          {user.status === 'ACTIVE' && (
            <button
              className="btn-secondary text-xs px-3 py-1 text-gray-500"
              disabled={busy}
              onClick={() => onSetStatus('DISABLED')}
              title="Revoke access — takes effect on their next request"
            >
              Disable
            </button>
          )}
          {(user.status === 'REJECTED' || user.status === 'DISABLED') && (
            <button
              className="btn-secondary text-xs px-3 py-1"
              disabled={busy}
              onClick={() => onSetStatus('ACTIVE')}
            >
              Allow
            </button>
          )}
          <button
            className="btn-secondary text-xs px-3 py-1 text-gray-500"
            disabled={busy}
            onClick={() => onSetRole(isAdmin ? 'USER' : 'ADMIN')}
            title={
              isAdmin
                ? 'Demote to a normal member'
                : 'Let them approve accounts too. They still cannot see anyone else’s data.'
            }
          >
            {isAdmin ? 'Remove admin' : 'Make admin'}
          </button>
        </div>
      </div>

      {user.reset_state !== 'NONE' && (
        <ResetRequest user={user} busy={busy} onReviewReset={onReviewReset} />
      )}
    </li>
  )
}

/**
 * Approving does not change anyone's password. It only unlocks the reset for
 * whoever holds the one-time code that was generated when they asked — so
 * check who is asking before you approve.
 */
function ResetRequest({
  user,
  busy,
  onReviewReset,
}: Pick<RowProps, 'user' | 'busy' | 'onReviewReset'>) {
  const approved = user.reset_state === 'APPROVED'

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded border px-2 py-1.5 ${
        approved
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <p className="text-xs text-gray-700">
        {approved ? (
          <>
            Password reset <strong>approved</strong> — waiting for them to set a new
            password.
          </>
        ) : (
          <>
            Asked to reset their password
            {user.reset_requested_at && <> {formatRelative(user.reset_requested_at)}</>}.
          </>
        )}
      </p>
      <div className="flex gap-1 shrink-0">
        {!approved && (
          <button
            className="btn-primary text-xs px-3 py-1"
            disabled={busy}
            onClick={() => onReviewReset('approve')}
          >
            Approve reset
          </button>
        )}
        <button
          className="btn-secondary text-xs px-3 py-1 text-red-600"
          disabled={busy}
          onClick={() => onReviewReset('deny')}
          title="Forget the request — the code stops working immediately"
        >
          {approved ? 'Revoke' : 'Deny'}
        </button>
      </div>
    </div>
  )
}
