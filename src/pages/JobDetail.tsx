import { useParams, Link } from 'react-router-dom'
import { useJobTimeline, useRetryJob, useSetJobStatus, useSetOutcome } from '../hooks/useJobs'
import { useResumeMatches } from '../hooks/useResumes'
import { jobScreenshotUrl } from '../api/jobs'
import { libraryDownloadUrl, resumeDownloadUrl } from '../api/resumes'
import { PipelineStepper } from '../components/jobs/PipelineStepper'
import { formatDateTime, formatPercent } from '../utils/formatters'
import { RETRYABLE_STATUSES, statusBadgeClass } from '../utils/jobStatus'
import type { JobOutcome, ResumeMatch } from '../types'

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
  const statusMut = useSetJobStatus()

  if (isLoading) {
    return <div className="card animate-pulse h-64" />
  }

  if (!timeline) {
    return <div className="card text-center text-gray-500 py-8">Job not found</div>
  }

  const { job, events } = timeline
  const isReadyToApply = job.status === 'READY_TO_APPLY'

  return (
    <div className="space-y-4">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-700">&larr; Back to Dashboard</Link>

      <div className="card space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{job.title || 'Untitled Role'}</h1>
            {job.company && <p className="text-sm text-gray-600">{job.company}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`badge ${statusBadgeClass(job.status)}`}>{job.status}</span>
            <span className="badge bg-gray-100 text-gray-700 capitalize">
              {job.portal === 'web' ? 'Career Site' : job.portal}
            </span>
          </div>
        </div>
        <a href={job.url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline block truncate">
          {job.url}
        </a>
      </div>

      {/* Smart Job Apply hand-off. The same two actions as the Ready to Apply
          list, so arriving here from a link isn't a dead end. */}
      {isReadyToApply && (
        <div className="card space-y-2 border-violet-200 bg-violet-50">
          <p className="text-xs text-gray-700">
            Resume is ready. Open the posting, attach the PDF, then record what you did.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-xs px-3 py-1.5"
            >
              Open posting ↗
            </a>
            {job.resume_path && (
              <a href={resumeDownloadUrl(job.job_id)} className="btn-secondary text-xs px-3 py-1.5" download>
                Download resume
              </a>
            )}
            <button
              className="btn-secondary text-xs px-3 py-1.5 text-emerald-700"
              disabled={statusMut.isPending}
              onClick={() => statusMut.mutate({ jobId: job.job_id, status: 'APPLIED' })}
            >
              Mark as applied
            </button>
            <button
              className="btn-secondary text-xs px-3 py-1.5 text-gray-500"
              disabled={statusMut.isPending}
              onClick={() => statusMut.mutate({ jobId: job.job_id, status: 'SKIPPED' })}
            >
              Skip
            </button>
          </div>
          {statusMut.isError && (
            <p className="text-xs text-red-600">{(statusMut.error as Error).message}</p>
          )}
        </div>
      )}

      <div className="card">
        <p className="text-xs text-gray-600 mb-3">Pipeline Progress</p>
        <PipelineStepper job={job} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-2 text-sm">
          <p className="text-xs text-gray-600">Details</p>
          <p>Retry count: <span className="text-gray-700">{job.retry_count}</span></p>
          <p>ATS score: <span className="text-gray-700">{job.ats_score !== null ? `${job.ats_score}%` : '—'}</span></p>
          {job.redirect_url && (
            <p>
              Redirect: <a href={job.redirect_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline break-all">{job.redirect_url}</a>
            </p>
          )}
          {job.error_message && (
            <p className="text-amber-600 bg-amber-50 rounded px-2 py-1">{job.error_message}</p>
          )}

          <div className="flex gap-2 pt-2">
            {RETRYABLE_STATUSES.has(job.status) && (
              <button
                className="btn-secondary text-xs px-3 py-1.5"
                disabled={retryMut.isPending}
                onClick={() => retryMut.mutate(job.job_id)}
              >
                Retry / Resume
              </button>
            )}
            {job.resume_path && !isReadyToApply && (
              <a href={resumeDownloadUrl(job.job_id)} className="btn-secondary text-xs px-3 py-1.5" download>
                Download Resume
              </a>
            )}
          </div>
        </div>

        <div className="card space-y-2 text-sm">
          <p className="text-xs text-gray-600">Screenshot</p>
          {job.screenshot_path ? (
            <img
              src={jobScreenshotUrl(job.job_id)}
              alt="Latest status screenshot"
              className="rounded-lg border border-gray-200 w-full"
            />
          ) : (
            <p className="text-gray-500 text-xs">No screenshot recorded</p>
          )}
        </div>
      </div>

      <ResumeMatchCard jobId={job.job_id} />

      {job.status === 'APPLIED' && (
        <div className="card space-y-2">
          <p className="text-xs text-gray-600">Recruiting Outcome</p>
          {job.outcome ? (
            <span className="badge bg-teal-100 text-teal-800">{job.outcome.replace(/_/g, ' ')}</span>
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
        <p className="text-xs text-gray-600 mb-2">Timeline</p>
        {events.length === 0 ? (
          <p className="text-xs text-gray-500">No stage events recorded yet</p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.event_id} className="text-xs border-l-2 border-gray-200 pl-3">
                <span className="text-gray-500">{formatDateTime(e.created_at)}</span>{' '}
                <span className="text-gray-700 font-medium">{e.stage}</span>{' '}
                <span className="badge bg-gray-100 text-gray-700">{e.status}</span>
                {e.message && <p className="text-gray-600 mt-0.5">{e.message}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Which uploaded resume fits this job best.
 *
 * `GET /api/resumes/match/{job_id}` and the `useResumeMatches` hook were both
 * built and working, but nothing rendered them — the ranking existed only in
 * the API. It matters most when tailoring failed and the pipeline fell back to
 * a library resume, or when applying by hand and choosing which PDF to attach.
 */
function ResumeMatchCard({ jobId }: { jobId: number }) {
  const { data, isLoading, isError } = useResumeMatches(jobId)

  // Nothing uploaded, or the JD was never parsed — no ranking to show, and an
  // empty card would just be noise.
  if (isLoading || isError || !data || data.matches.length === 0) return null

  const [best, ...rest] = data.matches

  return (
    <div className="card space-y-3">
      <div>
        <p className="text-xs text-gray-600">Best matching uploaded resume</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Ranked against {data.jd_terms.length} term
          {data.jd_terms.length === 1 ? '' : 's'} from this job description.
        </p>
      </div>

      <MatchRow match={best} highlight />
      {rest.length > 0 && (
        <ul className="divide-y divide-gray-200 border-t border-gray-200 pt-1">
          {rest.map((m) => (
            <li key={m.resume.resume_id} className="pt-2 first:pt-1">
              <MatchRow match={m} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MatchRow({ match, highlight = false }: { match: ResumeMatch; highlight?: boolean }) {
  const { resume, score, matched_terms } = match

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 ${
        highlight ? 'rounded border border-emerald-200 bg-emerald-50 px-2 py-2' : ''
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-800 truncate">{resume.label || resume.filename}</span>
          {resume.is_master && <span className="badge bg-emerald-100 text-emerald-800">Master</span>}
          {highlight && <span className="badge bg-brand-100 text-brand-800">Best fit</span>}
        </div>
        {matched_terms.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5 truncate" title={matched_terms.join(', ')}>
            Matches: {matched_terms.slice(0, 8).join(' · ')}
            {matched_terms.length > 8 && ` +${matched_terms.length - 8} more`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold text-gray-700">{formatPercent(score)}</span>
        <a
          href={libraryDownloadUrl(resume.resume_id)}
          className="btn-secondary text-xs px-2 py-1"
          download
        >
          PDF
        </a>
      </div>
    </div>
  )
}
