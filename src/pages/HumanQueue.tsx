import { Link } from 'react-router-dom'
import { useHumanQueue } from '../hooks/useHumanQueue'
import { useRetryJob } from '../hooks/useJobs'
import type { JobStatus } from '../types'

const REASON_LABELS: Partial<Record<JobStatus, string>> = {
  WAITING_CAPTCHA: 'CAPTCHA — solve it manually, then Resume',
  WAITING_LOGIN: 'Login failed — check credentials, then Resume',
  WAITING_OTP: 'OTP required',
  NEED_HUMAN_ACTION: 'External ATS redirect or unrecognized block',
  FLAGGED: 'Flagged (legacy)',
}

const REASON_COLORS: Partial<Record<JobStatus, string>> = {
  WAITING_CAPTCHA: 'bg-amber-900 text-amber-300',
  WAITING_LOGIN: 'bg-sky-900 text-sky-300',
  WAITING_OTP: 'bg-purple-900 text-purple-300',
  NEED_HUMAN_ACTION: 'bg-rose-900 text-rose-300',
  FLAGGED: 'bg-amber-900 text-amber-300',
}

export function HumanQueue() {
  const { data: jobs = [], isLoading } = useHumanQueue()
  const retryMut = useRetryJob()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card animate-pulse h-20" />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="card text-center text-slate-500 text-sm py-8">
        Nothing needs your attention right now 🎉
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">{jobs.length} job(s) waiting on you — oldest first</p>
      {jobs.map((job) => (
        <div key={job.job_id} className="card space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge ${REASON_COLORS[job.status] ?? 'bg-slate-700 text-slate-300'}`}>
                  {job.status.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-500">#{job.job_id}</span>
                <span className="text-xs text-slate-500 capitalize">
                  {job.portal === 'web' ? 'Career Site' : job.portal}
                </span>
              </div>
              <Link to={`/jobs/${job.job_id}`} className="text-sm font-medium mt-1 truncate block text-indigo-400 hover:text-indigo-300">
                {job.title || 'Untitled'}
              </Link>
              {job.company && (
                <p className="text-xs text-slate-400">{job.company}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">{REASON_LABELS[job.status] ?? 'Needs manual review'}</p>
            </div>

            <button
              className="btn-secondary text-xs px-3 py-1 shrink-0"
              disabled={retryMut.isPending}
              onClick={() => retryMut.mutate(job.job_id)}
            >
              Resume
            </button>
          </div>

          {job.error_message && (
            <p className="text-xs text-amber-400 bg-amber-950/40 rounded px-2 py-1">
              {job.error_message}
            </p>
          )}

          {job.redirect_url && (
            <a
              href={job.redirect_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:underline block truncate"
            >
              External ATS: {job.redirect_url}
            </a>
          )}

          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 hover:text-slate-300 block truncate"
          >
            {job.url}
          </a>
        </div>
      ))}
    </div>
  )
}
