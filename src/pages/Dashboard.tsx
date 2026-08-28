import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStats } from '../api/client'
import { useActiveRun } from '../hooks/useRuns'
import { StatsCards } from '../components/StatsCards'
import { PipelineFunnel } from '../components/PipelineFunnel'
import { RunControls } from '../components/RunControls'
import { CompanyCareerCard } from '../components/CompanyCareerCard'
import { ProgressBar } from '../components/ProgressBar'
import { JobsTable } from '../components/JobsTable'
import { EmailStats } from '../components/EmailStats'
import { useWebSocket } from '../hooks/useWebSocket'
import type { DashboardStats } from '../types'

type Tab = 'jobs' | 'emails'

export function Dashboard() {
  // watchedRunId = the run whose WebSocket feed is being displayed
  const [watchedRunId, setWatchedRunId] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('jobs')

  // Recover active run after page refresh
  const activeRun = useActiveRun()
  useEffect(() => {
    if (activeRun && watchedRunId === null) {
      setWatchedRunId(activeRun.run_id)
    }
  }, [activeRun, watchedRunId])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    refetchInterval: 15_000,
  })

  const { events, wsState, clearEvents } = useWebSocket(watchedRunId)

  const handleRunStarted = (runId: number) => {
    if (runId !== watchedRunId) {
      clearEvents()
      setWatchedRunId(runId)
    }
  }

  const handleRunStopped = () => {
    // Don't clear watchedRunId — keep the event log visible after stopping
    // The WS will naturally close, wsState will show 'closed'
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <StatsCards stats={stats ?? emptyStats} isLoading={statsLoading} />

      {/* Pipeline funnel + source breakdown */}
      {stats && <PipelineFunnel stats={stats} />}

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RunControls
          onRunStarted={handleRunStarted}
          watchedRunId={watchedRunId}
          onRunStopped={handleRunStopped}
        />
        <CompanyCareerCard
          onRunStarted={handleRunStarted}
          watchedRunId={watchedRunId}
          onRunStopped={handleRunStopped}
        />
      </div>

      {/* Live feed */}
      <ProgressBar events={events} wsState={wsState} runId={watchedRunId} />

      {/* Tab panel */}
      <div className="space-y-3">
        <div className="flex gap-1 border-b border-slate-700">
          {(['jobs', 'emails'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t
                  ? 'bg-slate-800 text-slate-100 border border-b-0 border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'jobs' ? 'All Jobs' : 'Cold Emails'}
            </button>
          ))}
        </div>

        <div className="pt-1">
          {tab === 'jobs' && <JobsTable />}
          {tab === 'emails' && <EmailStats />}
        </div>
      </div>
    </div>
  )
}

const emptyStats: DashboardStats = {
  total_jobs: 0,
  scraped: 0,
  parsed: 0,
  resume_ready: 0,
  applied: 0,
  failed: 0,
  flagged: 0,
  waiting_captcha: 0,
  waiting_login: 0,
  waiting_otp: 0,
  need_human_action: 0,
  duplicate: 0,
  skipped: 0,
  blacklisted: 0,
  emails_sent: 0,
  emails_failed: 0,
  emails_pending: 0,
  active_runs: 0,
  funnel: [],
  success_rate: 0,
  source_breakdown: { portal_jobs: 0, career_site_jobs: 0, by_portal: {} },
  stuck_jobs_count: 0,
}
