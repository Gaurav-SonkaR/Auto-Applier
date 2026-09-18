import { Link } from 'react-router-dom'
import { useHumanQueue } from '../hooks/useJobs'
import { useRetryJob } from '../hooks/useJobs'
import { RefreshButton } from '../components/common/RefreshButton'
import type { JobStatus } from '../types'

const REASON_LABELS: Partial<Record<JobStatus, string>> = {
  WAITING_CAPTCHA: 'CAPTCHA — solve it manually, then Resume',
  WAITING_LOGIN: 'Login failed — check credentials, then Resume',
  WAITING_OTP: 'OTP required',
  NEED_HUMAN_ACTION: 'External ATS redirect or unrecognized block',
  FLAGGED: 'Flagged (legacy)',
}

const REASON_COLORS: Partial<Record<JobStatus, string>> = {
  WAITING_CAPTCHA: 'bg-amber-100 text-amber-800',
  WAITING_LOGIN: 'bg-sky-100 text-sky-800',
  WAITING_OTP: 'bg-purple-100 text-purple-800',
  NEED_HUMAN_ACTION: 'bg-rose-100 text-rose-800',
  FLAGGED: 'bg-amber-100 text-amber-800',
}

export function HumanQueue() {
  const { data: jobs = [], isLoading, refetch, isFetching } = useHumanQueue()
  const retryMut = useRetryJob()

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-bold text-gray-900">Human Queue</h1>
      <RefreshButton onRefresh={refetch} isRefreshing={isFetching} />
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {header}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-3">
        {header}
        <div className="card text-center text-gray-500 text-sm py-8">
          Nothing needs your attention right now 🎉
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {header}
      <p className="text-xs text-gray-600">{jobs.length} job(s) waiting on you — oldest first</p>
      <div className="space-y-2">
      {jobs.map((job) => (
        <div key={job.job_id} className="card space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge ${REASON_COLORS[job.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {job.status.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-gray-500">#{job.job_id}</span>
                <span className="text-xs text-gray-500 capitalize">
                  {job.portal === 'web' ? 'Career Site' : job.portal}
                </span>
              </div>
              <Link to={`/jobs/${job.job_id}`} className="text-sm font-medium mt-1 truncate block text-brand-600 hover:text-brand-800">
                {job.title || 'Untitled'}
              </Link>
              {job.company && (
                <p className="text-xs text-gray-600">{job.company}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">{REASON_LABELS[job.status] ?? 'Needs manual review'}</p>
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
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              {job.error_message}
            </p>
          )}

          {job.redirect_url && (
            <a
              href={job.redirect_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-600 hover:underline block truncate"
            >
              External ATS: {job.redirect_url}
            </a>
          )}

          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-500 hover:text-gray-700 block truncate"
          >
            {job.url}
          </a>
        </div>
      ))}
      </div>
    </div>
  )
}
