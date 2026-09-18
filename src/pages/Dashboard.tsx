import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStats } from '../api/dashboard'
import { useActiveRun } from '../hooks/useRuns'
import { StatsCards } from '../components/common/StatsCards'
import { PipelineFunnel } from '../components/common/PipelineFunnel'
import { RefreshButton } from '../components/common/RefreshButton'
import { RunControls } from '../components/runs/RunControls'
import { CompanyCareerCard } from '../components/runs/CompanyCareerCard'
import { ProgressBar } from '../components/common/ProgressBar'
import { JobsTable } from '../components/jobs/JobsTable'
import { EmailStats } from '../components/runs/EmailStats'
import { useWebSocket } from '../hooks/useWebSocket'
import type { DashboardStats } from '../types'

type Tab = 'jobs' | 'emails'

export function Dashboard() {
  const qc = useQueryClient()

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

  // No refetchInterval — the dashboard never polls. Data loads once and is
  // refreshed by: the RefreshButton below, any mutation elsewhere on the page
  // (starting/stopping a run, retrying a job, ...), or a live run's own
  // WebSocket telling us a job just finished (see the effect after
  // useWebSocket — that is a push signal from an already-open connection,
  // not a new poll).
  const { data: stats, isLoading: statsLoading, isFetching: statsFetching } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  })

  const { events, wsState, clearEvents } = useWebSocket(watchedRunId)

  // While a run is live, its WS feed already pushes one event per job. When a
  // job finishes we know the run's counters and the jobs table changed, so we
  // refresh those — driven by that push, not a timer. This is what keeps the
  // dashboard live during a run without polling anything on an interval.
  const lastHandledEvent = useRef(0)
  useEffect(() => {
    if (events.length === lastHandledEvent.current) return
    const newEvents = events.slice(lastHandledEvent.current)
    lastHandledEvent.current = events.length
    if (newEvents.some((e) => e.node === 'done')) {
      qc.invalidateQueries({ queryKey: ['runs'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
    }
  }, [events, qc])

  const handleRefreshAll = () => {
    qc.invalidateQueries({ queryKey: ['stats'] })
    qc.invalidateQueries({ queryKey: ['runs'] })
    qc.invalidateQueries({ queryKey: ['jobs'] })
    qc.invalidateQueries({ queryKey: ['cold-email-stats'] })
  }

  const handleRunStarted = (runId: number) => {
    if (runId !== watchedRunId) {
      clearEvents()
      lastHandledEvent.current = 0
      setWatchedRunId(runId)
    }
  }

  const handleRunStopped = () => {
    // Don't clear watchedRunId — keep the event log visible after stopping
    // The WS will naturally close, wsState will show 'closed'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
        <RefreshButton onRefresh={handleRefreshAll} isRefreshing={statsFetching} label="Refresh all" />
      </div>

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
        <div className="flex gap-1 border-b border-gray-200">
          {(['jobs', 'emails'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t
                  ? 'bg-white text-brand-700 border border-b-0 border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
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
  ready_to_apply: 0,
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
