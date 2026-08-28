import { useParams, Link } from 'react-router-dom'
import { useJobTimeline } from '../hooks/useJobs'
import { useRetryJob } from '../hooks/useJobs'
import { useSetOutcome } from '../hooks/useHumanQueue'
import { resumeDownloadUrl, jobScreenshotUrl } from '../api/client'
import { PipelineStepper } from '../components/PipelineStepper'
import type { JobOutcome } from '../types'

const RETRYABLE = new Set([
  'FAILED', 'FLAGGED', 'WAITING_CAPTCHA', 'WAITING_LOGIN', 'WAITING_OTP', 'NEED_HUMAN_ACTION',
])

const OUTCOMES: { value: JobOutcome; label: string }[] = [
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { value: 'ASSESSMENT_PENDING', label: 'Assessment Pending' },
  { value: 'OFFER_RECEIVED', label: 'Offer Received' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'NO_RESPONSE', label: 'No Response' },
]

export function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const id = jobId ? Number(jobId) : null
  const { data: timeline, isLoading } = useJobTimeline(id)
  const retryMut = useRetryJob()
  const outcomeMut = useSetOutcome()

  if (isLoading) {
    return <div className="card animate-pulse h-64" />
  }

  if (!timeline) {
    return <div className="card text-center text-slate-500 py-8">Job not found</div>
  }

  const { job, events } = timeline

  return (
    <div className="space-y-4">
      <Link to="/" className="text-xs text-slate-500 hover:text-slate-300">&larr; Back to Dashboard</Link>

      <div className="card space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-100">{job.title || 'Untitled Role'}</h1>
            {job.company && <p className="text-sm text-slate-400">{job.company}</p>}
          </div>
          <span className="badge bg-slate-700 text-slate-300 capitalize">
            {job.portal === 'web' ? 'Career Site' : job.portal}
          </span>
        </div>
        <a href={job.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline block truncate">
          {job.url}
        </a>
      </div>

      <div className="card">
        <p className="text-xs text-slate-400 mb-3">Pipeline Progress</p>
        <PipelineStepper job={job} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-2 text-sm">
          <p className="text-xs text-slate-400">Details</p>
          <p>Retry count: <span className="text-slate-300">{job.retry_count}</span></p>
          <p>ATS score: <span className="text-slate-300">{job.ats_score !== null ? `${job.ats_score}%` : '—'}</span></p>
          {job.redirect_url && (
            <p>
              Redirect: <a href={job.redirect_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline break-all">{job.redirect_url}</a>
            </p>
          )}
          {job.error_message && (
            <p className="text-amber-400 bg-amber-950/40 rounded px-2 py-1">{job.error_message}</p>
          )}

          <div className="flex gap-2 pt-2">
            {RETRYABLE.has(job.status) && (
              <button
                className="btn-secondary text-xs px-3 py-1.5"
                disabled={retryMut.isPending}
                onClick={() => retryMut.mutate(job.job_id)}
              >
                Retry / Resume
              </button>
            )}
            {job.resume_path && (
              <a href={resumeDownloadUrl(job.job_id)} className="btn-secondary text-xs px-3 py-1.5" download>
                Download Resume
              </a>
            )}
          </div>
        </div>

        <div className="card space-y-2 text-sm">
          <p className="text-xs text-slate-400">Screenshot</p>
          {job.screenshot_path ? (
            <img
              src={jobScreenshotUrl(job.job_id)}
              alt="Latest status screenshot"
              className="rounded-lg border border-slate-700 w-full"
            />
          ) : (
            <p className="text-slate-500 text-xs">No screenshot recorded</p>
          )}
        </div>
      </div>

      {job.status === 'APPLIED' && (
        <div className="card space-y-2">
          <p className="text-xs text-slate-400">Recruiting Outcome</p>
          {job.outcome ? (
            <span className="badge bg-teal-900 text-teal-300">{job.outcome.replace(/_/g, ' ')}</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  className="btn-secondary text-xs px-2 py-1"
                  disabled={outcomeMut.isPending}
                  onClick={() => outcomeMut.mutate({ jobId: job.job_id, outcome: o.value })}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <p className="text-xs text-slate-400 mb-2">Timeline</p>
        {events.length === 0 ? (
          <p className="text-xs text-slate-500">No stage events recorded yet</p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.event_id} className="text-xs border-l-2 border-slate-700 pl-3">
                <span className="text-slate-500">{new Date(e.created_at).toLocaleString()}</span>{' '}
                <span className="text-slate-300 font-medium">{e.stage}</span>{' '}
                <span className="badge bg-slate-700 text-slate-300">{e.status}</span>
                {e.message && <p className="text-slate-400 mt-0.5">{e.message}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
