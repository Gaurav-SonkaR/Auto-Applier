import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startRun } from '../../api/runs'
import { useDiscoveryQuota, useRuns, useStopRun } from '../../hooks/useRuns'
import { StatusDot, statusText } from './runStatus'
import { RefreshButton } from '../common/RefreshButton'
import { formatDuration } from '../../utils/formatters'
import type { RunLog } from '../../types'

interface Props {
  /** Called when a new run is successfully created — passes the run_id for WS subscription */
  onRunStarted: (runId: number) => void
  /** The run_id currently wired to the live WS feed */
  watchedRunId: number | null
  onRunStopped: () => void
}

// ── Active Run card ───────────────────────────────────────────────────────────

function ActiveDiscoveryRunCard({ run, onStop }: { run: RunLog; onStop: () => void }) {
  const stopMut = useStopRun()

  const handleStop = () => {
    stopMut.mutate(run.run_id)
    onStop()
  }

  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={run.status} />
            <span className="text-xs font-semibold text-emerald-600">Run #{run.run_id} — RUNNING</span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5 ml-3.5">
            <span className="font-medium text-gray-700">Smart Search</span>
            {run.job_title && <> · {run.job_title}</>}
            {run.location && <span className="text-gray-500"> ({run.location})</span>}
          </p>
        </div>
        <button
          className="btn-danger text-xs px-3 py-1 shrink-0"
          disabled={stopMut.isPending}
          onClick={handleStop}
        >
          {stopMut.isPending ? 'Stopping…' : '⏹ Stop'}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2 text-center">
        {([
          ['Found',    run.jobs_scraped,  'text-sky-600'],
          // Smart Job Apply stops at READY_TO_APPLY by design, so `jobs_applied`
          // is always 0 here — showing it made a fully successful run look like
          // a failed one. `jobs_ready` is this pipeline's success counter.
          ['Ready',    run.jobs_ready,    'text-violet-600'],
          ['Failed',   run.jobs_failed,   'text-red-600'],
          ['Flagged',  run.jobs_flagged,  'text-amber-600'],
          ['Skipped',  run.jobs_skipped,  'text-gray-500'],
        ] as const).map(([label, val, color]) => (
          <div key={label} className="bg-white rounded-lg p-2">
            <p className={`text-xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="inline-block w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
        Searching Google (Serper) for company career pages matching your profile
      </div>
    </div>
  )
}

// ── Discovery quota banner ────────────────────────────────────────────────────

function QuotaBanner() {
  // Was its own useQuery(['discovery-quota']) polling every 30s — a second,
  // differently-keyed copy of useDiscoveryQuota() in hooks/useRuns.ts (that
  // one keyed ['runs', 'discovery-quota']), so the two never even shared a
  // cache entry. Consolidated onto the one hook; no polling either way now.
  const { data: quota } = useDiscoveryQuota()

  if (!quota) return null

  if (!quota.serper_configured) {
    return (
      <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
        SERPER_API_KEY is not set — smart search is unavailable until it's configured in .env.
      </p>
    )
  }

  const low = quota.remaining_today <= quota.daily_limit * 0.1
  return (
    <p className={`text-xs ${low ? 'text-amber-600' : 'text-gray-500'}`}>
      {quota.remaining_today} / {quota.daily_limit} Google searches remaining today
    </p>
  )
}

// ── Start Form ────────────────────────────────────────────────────────────────

function StartForm({ onStarted }: { onStarted: (id: number) => void }) {
  const qc = useQueryClient()
  const [location, setLocation] = useState('')
  const [batchSize, setBatchSize] = useState(10)
  const [error, setError] = useState<string | null>(null)

  const startMut = useMutation({
    mutationFn: startRun,
    onSuccess: (data) => {
      setError(null)
      onStarted(data.run_id)
      qc.invalidateQueries({ queryKey: ['runs'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['runs', 'discovery-quota'] })
    },
    onError: (e: Error) => setError(e.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startMut.mutate({ portal: 'web', job_title: '', location, batch_size: batchSize })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-gray-600">
        Searches Google for company career pages matching your most recent role and top
        skills, taken from your{' '}
        <Link to="/profile" className="text-brand-600 underline">Profile</Link> — no job
        title needed.
      </p>

      <QuotaBanner />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Location</label>
          <input
            className="input"
            placeholder="e.g. Remote, India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Batch Size</label>
          <input
            type="number"
            className="input"
            min={1}
            max={50}
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={startMut.isPending}
      >
        {startMut.isPending ? 'Starting…' : '🔎 Start Smart Search'}
      </button>
    </form>
  )
}

// ── Run history mini-table ────────────────────────────────────────────────────

function DiscoveryRunHistory({ runs, onWatch }: { runs: RunLog[]; onWatch: (id: number) => void }) {
  if (runs.length === 0) return null

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Recent Searches</p>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-200">
              <th className="px-2 py-1.5 text-left text-gray-500 w-8">#</th>
              <th className="px-2 py-1.5 text-left text-gray-500">Role</th>
              <th className="px-2 py-1.5 text-left text-gray-500">Status</th>
              <th className="px-2 py-1.5 text-right text-gray-500" title="Found">Fo</th>
              <th className="px-2 py-1.5 text-right text-gray-500" title="Ready to apply">Rd</th>
              <th className="px-2 py-1.5 text-right text-gray-500" title="Flagged (need your attention)">⚠</th>
              <th className="px-2 py-1.5 text-right text-gray-500">Time</th>
              <th className="px-2 py-1.5 text-right text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {runs.map((r) => (
              <tr key={r.run_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-1.5 text-gray-500">{r.run_id}</td>
                <td className="px-2 py-1.5 max-w-[140px] truncate text-gray-700">{r.job_title ?? '—'}</td>
                <td className={`px-2 py-1.5 font-medium whitespace-nowrap ${statusText(r.status)}`}>
                  <StatusDot status={r.status} />{r.status}
                </td>
                <td className="px-2 py-1.5 text-right text-sky-600">{r.jobs_scraped}</td>
                <td className="px-2 py-1.5 text-right text-violet-600">{r.jobs_ready}</td>
                <td className="px-2 py-1.5 text-right text-amber-600">{r.jobs_flagged}</td>
                <td className="px-2 py-1.5 text-right text-gray-500 whitespace-nowrap">
                  {formatDuration(r.started_at, r.completed_at)}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    className="text-brand-600 hover:text-brand-800"
                    onClick={() => onWatch(r.run_id)}
                    title="Attach live feed to this run"
                  >
                    📡
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CompanyCareerCard({ onRunStarted, watchedRunId, onRunStopped }: Props) {
  const { data: runs = [], isLoading, refetch, isFetching } = useRuns(20)
  const webRuns = (runs as RunLog[]).filter((r) => r.portal === 'web')

  const activeRun = webRuns.find((r) => r.status === 'RUNNING') ?? null

  if (activeRun && watchedRunId !== activeRun.run_id) {
    Promise.resolve().then(() => onRunStarted(activeRun.run_id))
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Company Career Discovery</h3>
        <RefreshButton onRefresh={refetch} isRefreshing={isFetching} label="" />
      </div>

      {activeRun ? (
        <ActiveDiscoveryRunCard run={activeRun} onStop={onRunStopped} />
      ) : (
        <StartForm onStarted={onRunStarted} />
      )}

      {!isLoading && webRuns.length > 0 && (
        <DiscoveryRunHistory
          runs={webRuns.filter((r) => r.status !== 'RUNNING')}
          onWatch={onRunStarted}
        />
      )}
    </div>
  )
}
