import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStats } from './api/client'
import { Dashboard } from './pages/Dashboard'
import { JobDetail } from './pages/JobDetail'
import { HumanQueue } from './pages/HumanQueue'
import { JobsBySource } from './pages/JobsBySource'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/human-queue', label: 'Human Queue', end: false },
  { to: '/portal-jobs', label: 'Portal Jobs', end: false },
  { to: '/career-jobs', label: 'Career Jobs', end: false },
]

function Header() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 15_000,
  })

  return (
    <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <span className="font-bold text-slate-100">AutoApply AI</span>
        </div>

        <nav className="flex gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              {link.label}
              {link.to === '/human-queue' && stats && stats.stuck_jobs_count > 0 && (
                <span className="badge bg-amber-900 text-amber-300">{stats.stuck_jobs_count}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          {stats && (
            <>
              <span>Applied: <strong className="text-emerald-400">{stats.applied}</strong></span>
              <span>Active: <strong className="text-teal-400">{stats.active_runs}</strong></span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs/:jobId" element={<JobDetail />} />
            <Route path="/human-queue" element={<HumanQueue />} />
            <Route path="/portal-jobs" element={<JobsBySource source="portal" />} />
            <Route path="/career-jobs" element={<JobsBySource source="career_site" />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-800 py-3 text-center text-xs text-slate-600">
          AutoApply AI — local only, runs on 127.0.0.1
        </footer>
      </div>
    </BrowserRouter>
  )
}
