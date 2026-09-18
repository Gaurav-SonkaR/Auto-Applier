import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStats } from '../../api/dashboard'
import { useAuth } from '../../hooks/useAuth'
import { RefreshButton } from '../common/RefreshButton'

interface NavItem {
  to: string
  label: string
  end?: boolean
  /** Badge count pulled from dashboard stats, when it is non-zero. */
  badge?: 'ready_to_apply' | 'stuck_jobs_count'
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/ready-to-apply', label: 'Ready to Apply', badge: 'ready_to_apply' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/human-queue', label: 'Human Queue', badge: 'stuck_jobs_count' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
]

export function Header() {
  const { username, signOut } = useAuth()
  // No refetchInterval: this badge count is a snapshot from the last refresh
  // (page load, or any RefreshButton elsewhere that invalidates ['stats']),
  // not a live counter.
  const { data: stats, refetch, isFetching } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  })

  return (
    <header className="border-b border-gray-200 bg-white/85 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl" aria-hidden>🤖</span>
          <span className="font-bold text-gray-900">AutoApply AI</span>
        </div>

        <nav className="flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map(({ to, label, end, badge }) => {
            const count = badge && stats ? stats[badge] : 0
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                  }`
                }
              >
                {label}
                {count > 0 && (
                  <span className="badge bg-amber-100 text-amber-800">{count}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="hidden md:flex items-center gap-4 text-xs text-gray-500 shrink-0">
          {stats && (
            <>
              <span>Applied: <strong className="text-emerald-600">{stats.applied}</strong></span>
              <span>Active: <strong className="text-teal-600">{stats.active_runs}</strong></span>
            </>
          )}
          <RefreshButton onRefresh={refetch} isRefreshing={isFetching} label="" />
          <button
            type="button"
            onClick={signOut}
            className="text-gray-500 hover:text-gray-800 hover:underline"
            title={username ? `Signed in as ${username}` : 'Sign out'}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
