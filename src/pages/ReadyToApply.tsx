import { Link } from 'react-router-dom'
import { resumeDownloadUrl } from '../api/resumes'
import { useReadyToApplyJobs, useSetJobStatus } from '../hooks/useJobs'
import { RefreshButton } from '../components/common/RefreshButton'
import { formatRelative, formatScore, formatUrl } from '../utils/formatters'
import type { Job } from '../types'

/**
 * Smart Job Apply hand-off.
 *
 * These jobs have a tailored resume built and stop there by design — company
 * career pages and third-party ATS forms are not auto-submitted. Each card
 * gives the two things needed to finish by hand: the apply link and the PDF.
 * "Mark as applied" then moves the job on (FR-006).
 */
export function ReadyToApply() {
  const { data: jobs = [], isLoading, refetch, isFetching } = useReadyToApplyJobs()
  const setStatus = useSetJobStatus()

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Ready to Apply</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Tailored resumes are built and waiting. Open the posting, attach the PDF, then mark
            it applied.
          </p>
        </div>
        <RefreshButton onRefresh={refetch} isRefreshing={isFetching} />
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-36 animate-pulse bg-gray-200" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <p className="text-xs text-gray-500">
            {jobs.length} job{jobs.length === 1 ? '' : 's'} waiting
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {jobs.map((job) => (
              <ReadyCard
                key={job.job_id}
                job={job}
                busy={setStatus.isPending}
                onApplied={() => setStatus.mutate({ jobId: job.job_id, status: 'APPLIED' })}
                onSkip={() => setStatus.mutate({ jobId: job.job_id, status: 'SKIPPED' })}
              />
            ))}
          </div>
        </>
      )}

      {setStatus.isError && (
        <p className="text-xs text-red-600">
          Could not update the job: {(setStatus.error as Error).message}
        </p>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card text-center py-10 space-y-2">
      <p className="text-gray-600 text-sm">Nothing waiting yet.</p>
      <p className="text-xs text-gray-500">
        Start a <span className="text-gray-700">Smart Job Apply</span> run from the{' '}
        <Link to="/" className="text-brand-600 hover:text-brand-800">dashboard</Link> to
        discover jobs on company career pages.
      </p>
    </div>
  )
}

interface CardProps {
  job: Job
  busy: boolean
  onApplied: () => void
  onSkip: () => void
}

function ReadyCard({ job, busy, onApplied, onSkip }: CardProps) {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={`/jobs/${job.job_id}`}
            className="text-brand-600 hover:text-brand-800 font-medium block truncate"
            title={job.title}
          >
            {job.title || formatUrl(job.url)}
          </Link>
          <p className="text-xs text-gray-500 truncate">
            {job.company || 'Unknown company'} · found {formatRelative(job.created_at)}
          </p>
        </div>
        {job.ats_score != null && (
          <span
            className="badge bg-brand-100 text-brand-800 shrink-0"
            title="Share of job-description keywords present in the generated resume"
          >
            ATS {formatScore(job.ats_score)}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 truncate" title={job.url}>
        {formatUrl(job.url, 60)}
      </p>

      <div className="flex flex-wrap gap-2">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-xs px-3 py-1.5"
        >
          Open posting ↗
        </a>
        {job.resume_path && (
          <a
            href={resumeDownloadUrl(job.job_id)}
            className="btn-secondary text-xs px-3 py-1.5"
            download
          >
            Download resume
          </a>
        )}
        <button
          className="btn-secondary text-xs px-3 py-1.5 ml-auto"
          disabled={busy}
          onClick={onApplied}
        >
          Mark applied
        </button>
        <button
          className="btn-secondary text-xs px-3 py-1.5 text-gray-500"
          disabled={busy}
          onClick={onSkip}
          title="Not interested — remove from this list"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
