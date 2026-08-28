import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { startRun, getDiscoveryQuota } from '../api/client'
import { useRuns, useStopRun } from '../hooks/useRuns'
import { StatusDot, statusText, formatDuration } from './shared/runStatus'
import type { RunLog } from '../types'

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
    <div className="rounded-lg border border-emerald-700 bg-emerald-950/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={run.status} />
            <span className="text-xs font-semibold text-emerald-400">Run #{run.run_id} — RUNNING</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 ml-3.5">
            <span className="font-medium text-slate-300">Smart Search</span>
            {run.job_title && <> · {run.job_title}</>}
            {run.location && <span className="text-slate-500"> ({run.location})</span>}
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
          ['Found',    run.jobs_scraped,  'text-sky-400'],
          ['Applied',  run.jobs_applied,  'text-emerald-400'],
          ['Failed',   run.jobs_failed,   'text-red-400'],
          ['Flagged',  run.jobs_flagged,  'text-amber-400'],
          ['Skipped',  run.jobs_skipped,  'text-slate-500'],
        ] as const).map(([label, val, color]) => (
          <div key={label} className="bg-slate-800 rounded-lg p-2">
            <p className={`text-xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        Searching Google (Serper) for company career pages matching your profile
      </div>
    </div>
  )
}

// ── Discovery quota banner ────────────────────────────────────────────────────

function QuotaBanner() {
  const { data: quota } = useQuery({
    queryKey: ['discovery-quota'],
    queryFn: getDiscoveryQuota,
    refetchInterval: 30_000,
  })

  if (!quota) return null

  if (!quota.serper_configured) {
    return (
      <p className="text-xs text-amber-400 bg-amber-950/40 rounded px-2 py-1">
        SERPER_API_KEY is not set — smart search is unavailable until it's configured in .env.
      </p>
    )
  }

  const low = quota.remaining_today <= quota.daily_limit * 0.1
  return (
    <p className={`text-xs ${low ? 'text-amber-400' : 'text-slate-500'}`}>
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
      qc.invalidateQueries({ queryKey: ['discovery-quota'] })
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
      <p className="text-xs text-slate-400">
        Searches Google for company career pages matching your most recent role and top
        skills (from <code>master_profile.json</code>) — no job title needed.
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

      {error && <p className="text-xs text-red-400">{error}</p>}

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
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Recent Searches</p>
      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/60">
              <th className="px-2 py-1.5 text-left text-slate-500 w-8">#</th>
              <th className="px-2 py-1.5 text-left text-slate-500">Role</th>
              <th className="px-2 py-1.5 text-left text-slate-500">Status</th>
              <th className="px-2 py-1.5 text-right text-slate-500" title="Found">Fo</th>
              <th className="px-2 py-1.5 text-right text-slate-500" title="Applied">Ap</th>
              <th className="px-2 py-1.5 text-right text-slate-500" title="Flagged (need your attention)">⚠</th>
              <th className="px-2 py-1.5 text-right text-slate-500">Time</th>
              <th className="px-2 py-1.5 text-right text-slate-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {runs.map((r) => (
              <tr key={r.run_id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-2 py-1.5 text-slate-500">{r.run_id}</td>
                <td className="px-2 py-1.5 max-w-[140px] truncate text-slate-300">{r.job_title ?? '—'}</td>
                <td className={`px-2 py-1.5 font-medium whitespace-nowrap ${statusText(r.status)}`}>
                  <StatusDot status={r.status} />{r.status}
                </td>
                <td className="px-2 py-1.5 text-right text-sky-400">{r.jobs_scraped}</td>
                <td className="px-2 py-1.5 text-right text-emerald-400">{r.jobs_applied}</td>
                <td className="px-2 py-1.5 text-right text-amber-400">{r.jobs_flagged}</td>
                <td className="px-2 py-1.5 text-right text-slate-500 whitespace-nowrap">
                  {formatDuration(r.started_at, r.completed_at)}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    className="text-indigo-400 hover:text-indigo-300"
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
  const { data: runs = [], isLoading } = useRuns(20)
  const webRuns = (runs as RunLog[]).filter((r) => r.portal === 'web')

  const activeRun = webRuns.find((r) => r.status === 'RUNNING') ?? null

  if (activeRun && watchedRunId !== activeRun.run_id) {
    Promise.resolve().then(() => onRunStarted(activeRun.run_id))
  }

  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold">Company Career Discovery</h3>

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
