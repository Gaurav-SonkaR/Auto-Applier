import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startRun } from '../api/client'
import { useRuns, useStopRun } from '../hooks/useRuns'
import { StatusDot, statusText, formatDuration } from './shared/runStatus'
import type { RunLog, RunStartRequest } from '../types'

const PORTALS = ['linkedin', 'naukri', 'indeed', 'wellfound', 'cutshort'] as const

interface Props {
  /** Called when a new run is successfully created — passes the run_id for WS subscription */
  onRunStarted: (runId: number) => void
  /** The run_id currently wired to the live WS feed */
  watchedRunId: number | null
  onRunStopped: () => void
}

// ── Active Run card ───────────────────────────────────────────────────────────

function ActiveRunCard({ run, onStop }: { run: RunLog; onStop: () => void }) {
  const stopMut = useStopRun()

  const handleStop = () => {
    stopMut.mutate(run.run_id)
    onStop()
  }

  return (
    <div className="rounded-lg border border-emerald-700 bg-emerald-950/30 p-3 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={run.status} />
            <span className="text-xs font-semibold text-emerald-400">Run #{run.run_id} — RUNNING</span>
          </div>
          {run.portal && (
            <p className="text-xs text-slate-400 mt-0.5 ml-3.5">
              <span className="capitalize font-medium text-slate-300">{run.portal}</span>
              {run.job_title && <> · {run.job_title}</>}
              {run.location && <span className="text-slate-500"> ({run.location})</span>}
            </p>
          )}
        </div>
        <button
          className="btn-danger text-xs px-3 py-1 shrink-0"
          disabled={stopMut.isPending}
          onClick={handleStop}
        >
          {stopMut.isPending ? 'Stopping…' : '⏹ Stop'}
        </button>
      </div>

      {/* Counter grid */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {([
          ['Scraped',  run.jobs_scraped,  'text-sky-400'],
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

      {/* In-progress indicator */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        Processing jobs — check the live feed for per-job updates
      </div>
    </div>
  )
}

// ── Start Form ────────────────────────────────────────────────────────────────

function StartForm({ onStarted }: { onStarted: (id: number) => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<RunStartRequest>({
    portal: 'linkedin',
    job_title: '',
    location: '',
    batch_size: 10,
    include_checkpointed: true,
  })
  const [error, setError] = useState<string | null>(null)

  const startMut = useMutation({
    mutationFn: startRun,
    onSuccess: (data) => {
      setError(null)
      onStarted(data.run_id)
      qc.invalidateQueries({ queryKey: ['runs'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e: Error) => setError(e.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.job_title.trim()) { setError('Job title is required'); return }
    setError(null)
    startMut.mutate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Portal</label>
          <select
            className="input"
            value={form.portal}
            onChange={(e) => setForm({ ...form, portal: e.target.value as RunStartRequest['portal'] })}
          >
            {PORTALS.map((p) => (
              <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Batch Size</label>
          <input
            type="number"
            className="input"
            min={1}
            max={50}
            value={form.batch_size}
            onChange={(e) => setForm({ ...form, batch_size: Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label className="label">Job Title</label>
        <input
          className="input"
          placeholder="e.g. Software Engineer"
          value={form.job_title}
          onChange={(e) => setForm({ ...form, job_title: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Location</label>
        <input
          className="input"
          placeholder="e.g. Remote, India"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="checkpointed"
          type="checkbox"
          className="accent-indigo-500 w-4 h-4"
          checked={form.include_checkpointed}
          onChange={(e) => setForm({ ...form, include_checkpointed: e.target.checked })}
        />
        <label htmlFor="checkpointed" className="text-xs text-slate-400 cursor-pointer">
          Resume checkpointed jobs (PARSED / RESUME_READY)
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={startMut.isPending}
      >
        {startMut.isPending ? 'Starting…' : '▶ Start Portal Pipeline'}
      </button>
    </form>
  )
}

// ── Run history mini-table ────────────────────────────────────────────────────

function RunHistory({ runs, onWatch }: { runs: RunLog[]; onWatch: (id: number) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (runs.length === 0) return null

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Recent Runs</p>
      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/60">
              <th className="px-2 py-1.5 text-left text-slate-500 w-8">#</th>
              <th className="px-2 py-1.5 text-left text-slate-500">Portal · Job</th>
              <th className="px-2 py-1.5 text-left text-slate-500">Status</th>
              <th className="px-2 py-1.5 text-right text-slate-500" title="Scraped">Sc</th>
              <th className="px-2 py-1.5 text-right text-slate-500" title="Applied">Ap</th>
              <th className="px-2 py-1.5 text-right text-slate-500" title="Failed">Fa</th>
              <th className="px-2 py-1.5 text-right text-slate-500" title="Flagged (need your attention)">⚠</th>
              <th className="px-2 py-1.5 text-right text-slate-500" title="Skipped (already applied)">Sk</th>
              <th className="px-2 py-1.5 text-right text-slate-500">Time</th>
              <th className="px-2 py-1.5 text-right text-slate-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {runs.map((r) => (
              <>
                <tr
                  key={r.run_id}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === r.run_id ? null : r.run_id)}
                >
                  <td className="px-2 py-1.5 text-slate-500">{r.run_id}</td>
                  <td className="px-2 py-1.5 max-w-[120px]">
                    {r.portal ? (
                      <>
                        <span className="capitalize text-slate-300 font-medium">{r.portal}</span>
                        {r.job_title && (
                          <span className="text-slate-500 ml-1 truncate block">{r.job_title}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-500 italic">{r.run_type}</span>
                    )}
                  </td>
                  <td className={`px-2 py-1.5 font-medium whitespace-nowrap ${statusText(r.status)}`}>
                    <StatusDot status={r.status} />{r.status}
                  </td>
                  <td className="px-2 py-1.5 text-right text-sky-400">{r.jobs_scraped}</td>
                  <td className="px-2 py-1.5 text-right text-emerald-400">{r.jobs_applied}</td>
                  <td className="px-2 py-1.5 text-right text-red-400">{r.jobs_failed}</td>
                  <td className="px-2 py-1.5 text-right text-amber-400">{r.jobs_flagged}</td>
                  <td className="px-2 py-1.5 text-right text-slate-500">{r.jobs_skipped}</td>
                  <td className="px-2 py-1.5 text-right text-slate-500 whitespace-nowrap">
                    {formatDuration(r.started_at, r.completed_at)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button
                      className="text-indigo-400 hover:text-indigo-300"
                      onClick={(e) => { e.stopPropagation(); onWatch(r.run_id) }}
                      title="Attach live feed to this run"
                    >
                      📡
                    </button>
                  </td>
                </tr>
                {expanded === r.run_id && (
                  <tr key={`${r.run_id}-detail`} className="bg-slate-800/50">
                    <td colSpan={10} className="px-3 py-2 space-y-1">
                      {r.location && (
                        <p className="text-slate-400">Location: <span className="text-slate-300">{r.location}</span></p>
                      )}
                      {r.batch_size && (
                        <p className="text-slate-400">Batch size: <span className="text-slate-300">{r.batch_size}</span></p>
                      )}
                      <p className="text-slate-400">
                        Started: <span className="text-slate-300">{r.started_at ? new Date(r.started_at).toLocaleString() : '—'}</span>
                        {r.completed_at && (
                          <> · Finished: <span className="text-slate-300">{new Date(r.completed_at).toLocaleString()}</span></>
                        )}
                      </p>
                      {r.error_message && (
                        <p className="text-red-400 bg-red-950/40 rounded px-2 py-1">
                          Error: {r.error_message}
                        </p>
                      )}
                      {r.jobs_flagged > 0 && (
                        <p className="text-amber-400">
                          ⚠ {r.jobs_flagged} job(s) need your attention — go to the Flagged tab to review and retry them.
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">
        Sc=Scraped · Ap=Applied · Fa=Failed · ⚠=Flagged (need your input) · Sk=Skipped · Click row for details
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RunControls({ onRunStarted, watchedRunId, onRunStopped }: Props) {
  const { data: allRuns = [], isLoading } = useRuns(20)

  // 'web' runs belong to the Company Career Discovery card, not this one.
  const runs = (allRuns as RunLog[]).filter((r) => r.portal !== 'web')

  // Auto-detect the currently running run (survives page refresh)
  const activeRun = runs.find((r) => r.status === 'RUNNING') ?? null

  // If there is an active run but the parent doesn't know its ID yet, notify it
  if (activeRun && watchedRunId !== activeRun.run_id) {
    // Use a microtask to avoid setState during render
    Promise.resolve().then(() => onRunStarted(activeRun.run_id))
  }

  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold">Portal Apply Pipeline</h3>

      {/* Active run status — shown instead of the form when a run is live */}
      {activeRun ? (
        <ActiveRunCard run={activeRun} onStop={onRunStopped} />
      ) : (
        <StartForm onStarted={onRunStarted} />
      )}

      {/* Run history */}
      {!isLoading && runs.length > 0 && (
        <RunHistory
          runs={runs.filter((r) => r.status !== 'RUNNING').slice(0, 8)}
          onWatch={onRunStarted}
        />
      )}
    </div>
  )
}
